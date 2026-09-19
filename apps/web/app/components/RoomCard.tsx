"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../_providers/Authprovider";

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

    async function handleJoinRoom() {
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
                `http://localhost:3001/v1/rooms/${id}/join`,
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

            router.push(`/rooms/${data.session.roomId}`);
        } catch (error) {
            console.error("Failed to join room:", error);
            setError("Unable to reach server");
        } finally {
            setIsJoining(false);
        }
    }

    return (
        <div className="w-full max-w-sm space-y-3 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm">
            <p className="wrap-break-words text-lg font-semibold text-gray-900">
                {title}
            </p>

            <p className="text-sm text-gray-600">
                Members: {activeMember} / {capacity}
            </p>

            <button
                disabled={isJoining}
                onClick={handleJoinRoom}
                className="w-full cursor-pointer rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isJoining ? "Joining..." : "Join room"}
            </button>

            {error && <p className="text-red-600">{error}</p>}
        </div>
    );
};

export default RoomCard;
