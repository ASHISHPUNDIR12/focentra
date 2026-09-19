import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { prisma } from "../../lib/prisma";
import { createRoomSchema } from "./room.schema";
import { Prisma } from "../../../generated/prisma/client";
import { title } from "process";

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
    const room = await prisma.room.create({
        data: {
            title,
            creatorId: userId,
        },
    });
    return res.status(201).json({
        message: "Room created",
        room,
    });
});

// see available rooms
router.get("/", async (req, res) => {
    const rooms = await prisma.room.findMany({
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
                isolationLevel: "Serializable",
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

    if (result.status === "full") {
        return res.status(409).json({
            message: "Room is full",
        });
    }

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
    const activeFocusSession = await prisma.focusSession.findFirst({
        where: {
            userId,
            roomId,
            endedAt: null,
        },
    });
    if (!activeFocusSession) {
        return res.status(409).json({
            message: "no active session",
        });
    }
    const { id } = activeFocusSession;
    await prisma.focusSession.update({
        where: {
            id,
        },
        data: {
            endedAt: new Date(),
        },
    });
    return res.status(200).json({
        message: "left room succesfully",
    });
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
    });
});

export default router;
