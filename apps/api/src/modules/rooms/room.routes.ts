import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { prisma } from "../../lib/prisma.js";
import { createRoomSchema } from "./room.schema.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { roomEvents } from "./room.events.js";
import { musicState, roomTracks, updateMusicSchema } from "./room.music.js";

const router = Router();
// create room hehe
router.post("/", requireAuth, async (req, res) => {
    const userId = Number(res.locals.userId);

    const result = createRoomSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            error: result.error.flatten(),
        });
    }

    const { title } = result.data;
    const resultRoom = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
        const active = await tx.focusSession.findFirst({
            where: { userId, endedAt: null },
        });
        if (active) return null;
        const room = await tx.room.create({
            data: {
                title,
                creatorId: userId,
                focusSessions: { create: { userId } },
            },
        });
        return room;
    });
    if (!resultRoom) {
        return res.status(409).json({ message: "You are already in a room" });
    }
    const member = await prisma.user.findUnique({ where: { id: userId } });
    roomEvents.emit("membership-change", {
        roomId: resultRoom.id,
        userId,
        name: member?.name ?? null,
        action: "joined",
    });
    return res.status(201).json({ message: "Room created", room: resultRoom });
});

// see available rooms
router.get("/", async (req, res) => {
    const rooms = await prisma.room.findMany({
        // Empty rooms are closed; retain their records for study history.
        where: { focusSessions: { some: { endedAt: null } } },
        select: {
            id: true,
            title: true,
            createdAt: true,
            _count: {
                select: {
                    focusSessions: {
                        where: {
                            endedAt: null,
                        },
                    },
                },
            },
        },
    });
    const formattedRooms = rooms.map((room) => ({
        id: room.id,
        title: room.title,
        createdAt: room.createdAt,
        activeMember: room._count.focusSessions,
        capacity: 8,
    }));
    return res.status(200).json({
        rooms: formattedRooms,
    });
});

// join room
router.post("/:roomId/join", requireAuth, async (req, res) => {
    const userId = Number(res.locals.userId);
    const roomId = Number(req.params.roomId);

    if (!Number.isInteger(roomId) || roomId <= 0) {
        return res.status(400).json({
            message: "Invalid room id",
        });
    }

    const room = await prisma.room.findUnique({
        where: {
            id: roomId,
        },
    });

    if (!room) {
        return res.status(404).json({
            message: "Room does not exist",
        });
    }

    const joinRoom = () =>
        prisma.$transaction(
            async (tx) => {
                await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
                await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${roomId} FOR UPDATE`;
                const focusedSession = await tx.focusSession.findFirst({
                    where: {
                        userId,
                        endedAt: null,
                    },
                });

                if (focusedSession) {
                    return {
                        status: "already-active" as const,
                    };
                }

                const currentActiveMembers = await tx.focusSession.count({
                    where: {
                        roomId,
                        endedAt: null,
                    },
                });

                if (currentActiveMembers === 0) {
                    return { status: "closed" as const };
                }

                if (currentActiveMembers >= 8) {
                    return {
                        status: "full" as const,
                    };
                }

                const session = await tx.focusSession.create({
                    data: {
                        userId,
                        roomId,
                    },
                });

                return {
                    status: "joined" as const,
                    session,
                };
            },
            {
                isolationLevel: "ReadCommitted",
            },
        );

    const MAX_RETRIES = 3;

    let result: Awaited<ReturnType<typeof joinRoom>> | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            result = await joinRoom();
            break;
        } catch (error) {
            const isTransactionConflict =
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2034";

            if (!isTransactionConflict) {
                throw error;
            }

            if (attempt === MAX_RETRIES) {
                return res.status(503).json({
                    message: "Could not join room. Please try again.",
                });
            }
        }
    }

    if (!result) {
        return res.status(503).json({
            message: "Could not join room. Please try again.",
        });
    }

    if (result.status === "already-active") {
        return res.status(409).json({
            message: "You are already in a room",
        });
    }

    if (result.status === "closed") {
        return res.status(404).json({ message: "Room is closed" });
    }

    if (result.status === "full") {
        return res.status(409).json({
            message: "Room is full",
        });
    }

    const member = await prisma.user.findUnique({ where: { id: userId } });
    roomEvents.emit("membership-change", {
        roomId,
        userId,
        name: member?.name ?? null,
        action: "joined",
    });
    return res.status(201).json({
        message: "Joined room successfully",
        session: result.session,
    });
});

// leave room
router.post("/:roomId/leave", requireAuth, async (req, res) => {
    const userId = Number(res.locals.userId);
    const roomId = Number(req.params.roomId);
    if (!Number.isInteger(roomId) || roomId <= 0) {
        return res.status(400).json({
            message: "Invalid room id",
        });
    }
    const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${roomId} FOR UPDATE`;
        return tx.focusSession.updateMany({
            where: { userId, roomId, endedAt: null },
            data: { endedAt: new Date() },
        });
    });
    if (!result.count) {
        return res.status(409).json({ message: "No active session" });
    }
    const member = await prisma.user.findUnique({ where: { id: userId } });
    roomEvents.emit("membership-change", {
        roomId,
        userId,
        name: member?.name ?? null,
        action: "left",
    });
    return res.status(200).json({
        message: "left room succesfully",
    });
});

router.get("/:roomId/music", requireAuth, async (req, res) => {
    const roomId = Number(req.params.roomId);
    const userId = Number(res.locals.userId);
    if (!Number.isInteger(roomId) || roomId <= 0) {
        return res.status(400).json({ message: "Invalid room id" });
    }
    const room = await prisma.room.findFirst({
        where: {
            id: roomId,
            focusSessions: { some: { userId, endedAt: null } },
        },
    });
    if (!room) {
        return res
            .status(403)
            .json({ message: "You are not active in this room" });
    }
    return res.status(200).json({
        music: musicState(room),
        tracks: roomTracks,
        creatorId: room.creatorId,
    });
});

router.patch("/:roomId/music", requireAuth, async (req, res) => {
    const roomId = Number(req.params.roomId);
    const userId = Number(res.locals.userId);
    const input = updateMusicSchema.safeParse(req.body);
    if (!Number.isInteger(roomId) || roomId <= 0 || !input.success) {
        return res
            .status(400)
            .json({ message: "Choose an available room sound" });
    }
    const result = await prisma.$transaction(async (tx) => {
        // Serialize music changes with departures, so departed creators cannot edit.
        await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${roomId} FOR UPDATE`;
        const room = await tx.room.findUnique({ where: { id: roomId } });
        if (!room) return { status: 404 as const };
        const session = await tx.focusSession.findFirst({
            where: { roomId, userId, endedAt: null },
        });
        if (!session || room.creatorId !== userId)
            return { status: 403 as const };
        const updated = await tx.room.update({
            where: { id: roomId },
            data: {
                musicTrack: input.data.trackId,
                musicStartedAt: input.data.trackId ? new Date() : null,
                musicRevision: { increment: 1 },
            },
        });
        return { status: 200 as const, music: musicState(updated) };
    });
    if (result.status !== 200) {
        return res.status(result.status).json({
            message: "Only the room creator can change sound while in the room",
        });
    }
    roomEvents.emit("music-change", result.music);
    return res.status(200).json({ music: result.music });
});

router.get("/:roomId", requireAuth, async (req, res) => {
    const roomId = Number(req.params.roomId);
    const userId = Number(res.locals.userId);

    if (!Number.isInteger(roomId) || roomId <= 0) {
        return res.status(400).json({
            message: "Invalid room id",
        });
    }

    const room = await prisma.room.findUnique({
        where: {
            id: roomId,
            focusSessions: { some: { endedAt: null } },
        },
        select: {
            id: true,
            title: true,
        },
    });

    if (!room) {
        return res.status(404).json({
            message: "Room does not exist",
        });
    }

    const session = await prisma.focusSession.findFirst({
        where: {
            userId,
            roomId,
            endedAt: null,
        },
        select: {
            id: true,
            startedAt: true,
        },
    });

    if (!session) {
        return res.status(403).json({
            message: "You are not active in this room",
        });
    }

    return res.status(200).json({
        message: "Room details",
        room,
        session: {
            startedAt: session.startedAt,
        },
    });
});

export default router;
