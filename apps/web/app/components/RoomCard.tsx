"use client";

import { API_URL } from "../lib/config";
import { useState } from "react";
import Icon from "./Icon";
import { useRouter } from "next/navigation";
import { useAuth } from "../_providers/Authprovider";
import { useActiveRoom } from "../_providers/SocketProvider";

type RoomProps = {
    id: number;
    title: string;
    activeMember: number;
    capacity: number;
};

const RoomCard = ({ title, activeMember, capacity, id }: RoomProps) => {
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();

    const { user, loading, error: authError } = useAuth();
    const { activeRoomId, rememberRoom } = useActiveRoom();
    const isCurrentRoom = activeRoomId === id;

    async function handleJoinRoom() {
        // Returning is navigation, not another FocusSession creation request.
        if (isCurrentRoom) {
            router.push(`/rooms/${id}`);
            return;
        }
        if (loading) {
            return;
        }

        if (authError) {
            setError("Unable to verify authentication");
            return;
        }

        if (!user) {
            router.replace("/login");
            return;
        }

        try {
            setIsJoining(true);
            setError("");

            const response = await fetch(
                `${API_URL}/v1/rooms/${id}/join`,
                {
                    method: "POST",
                    credentials: "include",
                },
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Unable to join room");
                return;
            }

            rememberRoom(data.session.roomId);
            router.push(`/rooms/${data.session.roomId}`);
        } catch (error) {
            console.error("Failed to join room:", error);
            setError("Unable to reach server");
        } finally {
            setIsJoining(false);
        }
    }

    const isFull = activeMember >= capacity;
    const appearance = id % 3;
    const icon =
        appearance === 0 ? "book" : appearance === 1 ? "leaf" : "headphones";
    const iconTone =
        appearance === 0
            ? "bg-sage-100 text-sage-600"
            : appearance === 1
              ? "bg-[#f3e8d8] text-[#b78961]"
              : "bg-[#eeebf3] text-[#927aab]";
    return (
        <article className="flex min-w-0 flex-col rounded-[24px] border border-white bg-surface p-6 shadow-clay transition duration-150 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none">
            <div className="mb-6 flex items-center justify-between gap-3">
                <span
                    className={`flex size-11 items-center justify-center rounded-[16px] shadow-clay-icon ${iconTone}`}
                >
                    <Icon name={icon} className="size-5" />
                </span>
                <span className="rounded-lg bg-[#eeebf5] px-2.5 py-1.5 text-[10px] font-medium text-[#756283]">
                    {isCurrentRoom
                        ? "Your room"
                        : isFull
                          ? "Room full"
                          : "Open seats"}
                </span>
            </div>
            <h3 className="mb-6 text-lg leading-snug font-bold tracking-tight wrap-anywhere">
                {title}
            </h3>
            <div className="mt-auto">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                    <span>
                        {activeMember === 0
                            ? "Be the first to settle in"
                            : "A little focus, together"}
                    </span>
                    <span>
                        <strong className="font-semibold text-ink">
                            {activeMember} / {capacity}
                        </strong>{" "}
                        focusing
                    </span>
                </div>
                <div className="mb-5 flex h-1 gap-1" aria-hidden="true">
                    {Array.from(
                        { length: Math.min(capacity, 20) },
                        (_, index) => (
                            <span
                                key={index}
                                className={`h-full flex-1 rounded-full ${index < Math.round((activeMember / capacity) * Math.min(capacity, 20)) ? "bg-sage-400" : "bg-sage-100"}`}
                            />
                        ),
                    )}
                </div>
                <button
                    disabled={
                        isJoining || loading || (isFull && !isCurrentRoom)
                    }
                    onClick={handleJoinRoom}
                    className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-2xl border border-sage-200/60 bg-sage-50 px-5 py-3 text-xs font-semibold text-sage-800 shadow-[inset_0_-2px_2px_#344d3a06] transition-colors hover:bg-sage-100 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-sage-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isCurrentRoom
                        ? "Return to room"
                        : isJoining
                          ? "Joining…"
                          : isFull
                            ? "Room full"
                            : "Join room"}
                    <Icon name="arrow" className="size-4" />
                </button>
                {error && (
                    <p className="mt-3 text-xs text-rose-800" role="alert">
                        {error}
                    </p>
                )}
            </div>
        </article>
    );
};

export default RoomCard;
