"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { socket } from "../../../lib/socket";

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

function formatTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const RoomPage = () => {
    const params = useParams<{ roomId: string }>();
    const router = useRouter();

    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const [isLeaving, setIsLeaving] = useState(false);
    const [leaveError, setLeaveError] = useState("");

    const [roomDetail, setRoomDetail] = useState<Room | null>(null);
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
                    `http://localhost:3001/v1/rooms/${roomId}`,
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
            } catch (error) {
                console.error("Failed to load room:", error);
                setError("Unable to load room");
            } finally {
                setLoading(false);
            }
        }

        loadRoomDetails();
    }, [roomId]);

    // Realtime presence
    useEffect(() => {
        function handlePresenceUpdate(data: PresenceUpdate) {
            setPresence(data);
        }

        socket.on("presence-update", handlePresenceUpdate);

        socket.emit("sync-room");

        return () => {
            socket.off("presence-update", handlePresenceUpdate);
        };
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (!roomDetail) {
        return <p>Room unavailable</p>;
    }

    async function handleLeaveRoom() {
        setIsLeaving(true);
        setLeaveError("");

        try {
            const response = await fetch(
                `http://localhost:3001/v1/rooms/${roomId}/leave`,
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
        <div>
            <h1>{roomDetail.title}</h1>

            {presence ? (
                <>
                    <p>Members: {presence.activeMembers} / 8</p>

                    <h2>Members</h2>

                    {presence.members.map((member) => (
                        <p key={member.id}>{member.name ?? "Anonymous"}</p>
                    ))}
                </>
            ) : (
                <p>Loading presence...</p>
            )}

            <p>Focus time: {formatTime(elapsedSeconds)}</p>

            <button onClick={handleLeaveRoom} disabled={isLeaving}>
                {isLeaving ? "Leaving..." : "Leave room"}
            </button>

            {leaveError && <p>{leaveError}</p>}
        </div>
    );
};

export default RoomPage;
