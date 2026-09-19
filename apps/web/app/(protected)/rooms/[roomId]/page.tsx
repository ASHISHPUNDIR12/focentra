"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Room = {
    id: number;
    title: string;
};

type RoomSuccessResponse = {
    message: string;
    room: Room;
};

type ErrorResponse = {
    message: string;
};

const RoomPage = () => {
    const params = useParams<{ roomId: string }>();

    const [roomDetail, setRoomDetail] = useState<Room | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const roomId = params.roomId;

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

                setRoomDetail(data.room);
            } catch (error) {
                console.error("Failed to load room:", error);

                setError("Unable to load room");
            } finally {
                setLoading(false);
            }
        }

        loadRoomDetails();
    }, [roomId]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <>
            <h1>{roomDetail?.title}</h1>
        </>
    );
};

export default RoomPage;
