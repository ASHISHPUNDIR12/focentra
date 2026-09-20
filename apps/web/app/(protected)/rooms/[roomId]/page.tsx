"use client";

import { API_URL } from "../../../lib/config";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { socket } from "../../../lib/socket";
import RoomMusic from "@/app/components/RoomMusic";
import RoomHeader from "@/app/components/RoomHeader";
import FocusTimer from "@/app/components/FocusTimer";
import MemberList from "@/app/components/MemberList";
import Link from "next/link";
import Icon from "@/app/components/Icon";
import { useAuth } from "@/app/_providers/Authprovider";
import { useActiveRoom } from "@/app/_providers/SocketProvider";

type Room = {
    id: number;
    title: string;
};

type Session = {
    startedAt: string;
};

type RoomSuccessResponse = {
    message: string;
    room: Room;
    session: Session;
};

type ErrorResponse = {
    message: string;
};

type PresenceUpdate = {
    roomId: number;
    activeMembers: number;
    members: {
        id: number;
        name: string | null;
    }[];
};

const RoomPage = () => {
    const params = useParams<{ roomId: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { rememberRoom, clearRoom } = useActiveRoom();

    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const [isLeaving, setIsLeaving] = useState(false);
    const [leaveError, setLeaveError] = useState("");

    const [roomDetail, setRoomDetail] = useState<Room | null>(null);
    const [notifications, setNotifications] = useState<
        { id: number; text: string }[]
    >([]);
    const [presence, setPresence] = useState<PresenceUpdate | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const roomId = params.roomId;

    useEffect(() => {
        if (!startedAt) {
            return;
        }

        const startTime = new Date(startedAt).getTime();

        function updateTimer() {
            const currentTime = Date.now();

            const seconds = Math.floor((currentTime - startTime) / 1000);

            setElapsedSeconds(seconds);
        }

        updateTimer();

        const interval = setInterval(updateTimer, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [startedAt]);

    useEffect(() => {
        async function loadRoomDetails() {
            try {
                setLoading(true);
                setError("");
                setRoomDetail(null);

                const response = await fetch(
                    `${API_URL}/v1/rooms/${roomId}`,
                    {
                        credentials: "include",
                    },
                );

                if (!response.ok) {
                    const errorData: ErrorResponse = await response.json();

                    setError(errorData.message || "Unable to load room");

                    return;
                }

                const data: RoomSuccessResponse = await response.json();
                console.log(data);
                setRoomDetail(data.room);
                setStartedAt(data.session.startedAt);
                rememberRoom(data.room.id);
            } catch (error) {
                console.error("Failed to load room:", error);
                setError("Unable to load room");
            } finally {
                setLoading(false);
            }
        }

        loadRoomDetails();
    }, [roomId, rememberRoom]);

    // Realtime presence
    useEffect(() => {
        const timers = new Set<ReturnType<typeof setTimeout>>();
        let sequence = 0;
        function handlePresenceUpdate(data: PresenceUpdate) {
            if (data.roomId === Number(roomId)) setPresence(data);
        }
        function handleNotification(data: {
            roomId: number;
            userId: number;
            name: string | null;
            action: "joined" | "left";
        }) {
            if (data.roomId !== Number(roomId) || data.userId === user?.id)
                return;
            const id = sequence++;
            setNotifications((current) => [
                ...current.slice(-3),
                {
                    id,
                    text: `${data.name || "Someone"} ${data.action} the room`,
                },
            ]);
            const timer = setTimeout(() => {
                setNotifications((current) =>
                    current.filter((item) => item.id !== id),
                );
                timers.delete(timer);
            }, 4000);
            timers.add(timer);
        }
        socket.on("room-notification", handleNotification);

        socket.on("presence-update", handlePresenceUpdate);

        socket.emit("sync-room");

        return () => {
            socket.off("presence-update", handlePresenceUpdate);
            socket.off("room-notification", handleNotification);
            timers.forEach(clearTimeout);
        };
    }, [roomId, user?.id]);

    async function handleLeaveRoom() {
        setIsLeaving(true);
        setLeaveError("");

        try {
            const response = await fetch(
                `${API_URL}/v1/rooms/${roomId}/leave`,
                {
                    method: "POST",
                    credentials: "include",
                },
            );

            const data = await response.json();

            if (!response.ok) {
                setLeaveError(data.message || "Unable to leave room");
                return;
            }

            // FocusSession has ended in DB.
            clearRoom();
            // Tell the socket server to re-check our active room.
            socket.emit("sync-room");

            // We no longer belong on this room page.
            router.replace("/");
        } catch (error) {
            console.error("Failed to leave room:", error);
            setLeaveError("Unable to leave room");
        } finally {
            setIsLeaving(false);
        }
    }

    return (
        <main
            id="main-content"
            className="mx-auto w-full max-w-[1260px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10"
        >
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="pointer-events-none fixed right-5 bottom-5 z-50 flex max-w-sm flex-col gap-2"
            >
                {notifications.map((notification) => (
                    <p
                        key={notification.id}
                        className="rounded-2xl border border-sage-200 bg-surface px-4 py-3 text-sm text-sage-800 shadow-clay"
                    >
                        {notification.text}
                    </p>
                ))}
            </div>
            <Link
                href="/"
                className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-lg text-xs text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-sage-600"
            >
                <Icon name="back" size={16} />
                All study rooms
            </Link>
            {leaveError && (
                <p
                    className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800"
                    role="alert"
                >
                    {leaveError}
                </p>
            )}
            {loading ? (
                <div
                    className="rounded-[28px] bg-surface p-12 text-center text-sm text-muted shadow-clay motion-safe:animate-pulse"
                    role="status"
                >
                    Getting your room ready…
                </div>
            ) : error || !roomDetail ? (
                <div className="rounded-[28px] bg-surface p-10 text-center shadow-clay">
                    <h1 className="mb-3 text-2xl font-bold">
                        Room unavailable
                    </h1>
                    <p role="alert" className="text-sm text-muted">
                        {error || "Room unavailable"}
                    </p>
                    <Link
                        href="/"
                        className="mt-5 inline-block rounded-lg p-2 text-sm font-semibold text-sage-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-sage-600"
                    >
                        Back to rooms
                    </Link>
                </div>
            ) : (
                <>
                    <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
                        <div className="min-w-0 flex-1">
                            <p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-sage-700">
                                YOUR FOCUS SPACE
                            </p>
                            <h1 className="text-3xl leading-tight font-bold tracking-[-0.035em] wrap-anywhere sm:text-4xl">
                                {roomDetail.title}
                            </h1>
                            <p className="mt-3 text-sm text-muted">
                                Settle in. Let the rest wait.
                            </p>
                        </div>
                        <RoomHeader
                            onLeave={handleLeaveRoom}
                            isLeaving={isLeaving}
                            disabled={loading || !roomDetail}
                        />
                    </header>
                    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
                        <FocusTimer seconds={elapsedSeconds} user={user} />
                        {presence ? (
                            <MemberList
                                members={presence.members}
                                activeMembers={presence.activeMembers}
                                currentUserId={user?.id}
                            />
                        ) : (
                            <section
                                className="rounded-[26px] bg-surface p-8 text-sm text-muted shadow-clay"
                                role="status"
                            >
                                Loading members…
                            </section>
                        )}
                    </div>
                    <RoomMusic key={roomDetail.id} roomId={roomDetail.id} userId={user?.id} />
                </>
            )}
        </main>
    );
};
export default RoomPage;
