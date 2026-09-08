import { parseCookie } from "cookie";
import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../modules/auth/auth.token";
import { prisma } from "../lib/prisma";

export function initializeSocketServer(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:3000",
            credentials: true,
        },
    });
    // authentication
    io.use((socket, next) => {
        try {
            const rawCookie = socket.handshake.headers.cookie;
            if (!rawCookie) {
                throw new Error("unauthorized");
            }
            const cookies = parseCookie(rawCookie);
            const accessToken = cookies.accessToken;
            if (!accessToken) {
                throw new Error("unauthorized");
            }
            const userId = verifyAccessToken(accessToken);
            socket.data.userId = userId;
            next();
        } catch {
            next(new Error("Unauthorized"));
        }
    });

    async function broadcastRoomPresence(roomId: number) {
        const activeSessions = await prisma.focusSession.findMany({
            where: {
                roomId,
                endedAt: null,
            },
            select: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        const members = activeSessions.map((session) => session.user);
        const activeMembers = members.length;
        io.to(`room:${roomId}`).emit("presence-update", {
            roomId,
            activeMembers,
            members,
        });
    }

    async function syncSocketRoom(socket: Socket) {
        const activeSession = await prisma.focusSession.findFirst({
            where: {
                userId: socket.data.userId,
                endedAt: null,
            },
            select: {
                roomId: true,
            },
        });

        if (!activeSession) {
            for (const room of socket.rooms) {
                if (room.startsWith("room:")) {
                    await socket.leave(room);
                    const oldRoomId = Number(room.replace("room:", ""));
                    await broadcastRoomPresence(oldRoomId);
                }
            }

            return;
        }
        const desiredRoom = `room:${activeSession.roomId}`;

        for (const room of socket.rooms) {
            if (room.startsWith("room:") && room !== desiredRoom) {
                await socket.leave(room);

                const oldRoomId = Number(room.replace("room:", ""));
                await broadcastRoomPresence(oldRoomId);
            }
        }

        if (socket.rooms.has(desiredRoom)) {
            return;
        }
        await socket.join(desiredRoom);
        await broadcastRoomPresence(activeSession.roomId);
    }

    const disconnectTimers = new Map<number, NodeJS.Timeout>();

    io.on("connection", async (socket) => {
        const userId = socket.data.userId;
        const pendingTimer = disconnectTimers.get(userId);
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            disconnectTimers.delete(userId);
        }
        try {
            await syncSocketRoom(socket);
        } catch (error) {
            console.error("Initial room sync failed:", error);
        }
        socket.on("sync-room", async () => {
            try {
                await syncSocketRoom(socket);
            } catch (error) {
                console.error("Room sync failed:", error);
            }
        });

        socket.on("disconnect", async () => {
            try {
                const activeSession = await prisma.focusSession.findFirst({
                    where: {
                        userId,
                        endedAt: null,
                    },
                    select: {
                        id: true,
                        roomId: true,
                    },
                });

                if (!activeSession) {
                    return;
                }

                const remainingSockets = await io.fetchSockets();

                const hasAnotherSocket = remainingSockets.some(
                    (connectedSocket) => connectedSocket.data.userId === userId,
                );

                if (hasAnotherSocket) {
                    return;
                }

                const existingTimer = disconnectTimers.get(userId);

                if (existingTimer) {
                    clearTimeout(existingTimer);
                }

                const timer = setTimeout(async () => {
                    disconnectTimers.delete(userId);

                    try {
                        const currentSockets = await io.fetchSockets();

                        const userReconnected = currentSockets.some(
                            (connectedSocket) =>
                                connectedSocket.data.userId === userId,
                        );

                        if (userReconnected) {
                            return;
                        }

                        const result = await prisma.focusSession.updateMany({
                            where: {
                                id: activeSession.id,
                                endedAt: null,
                            },
                            data: {
                                endedAt: new Date(),
                            },
                        });

                        if (result.count > 0) {
                            await broadcastRoomPresence(activeSession.roomId);
                        }
                    } catch (error) {
                        console.error(
                            "Failed to clean up disconnected user:",
                            error,
                        );
                    }
                }, 5000);

                disconnectTimers.set(userId, timer);
            } catch (error) {
                console.error("Disconnect handling failed:", error);
            }
        });
    });
}
