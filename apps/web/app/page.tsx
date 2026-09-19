"use client";

import { useEffect, useState } from "react";
import RoomCard from "./components/RoomCard";

type Room = {
    id: number;
    title: string;
    activeMember: number;
    capacity: number;
};

type RoomsResponse = {
    rooms: Room[];
};

export default function Home() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function getRooms() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch("http://localhost:3001/v1/rooms");

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch rooms: ${response.status}`,
                    );
                }

                const data: RoomsResponse = await response.json();

                setRooms(data.rooms);
            } catch (error) {
                console.error("Failed to load rooms:", error);
                setError("Unable to load rooms");
            } finally {
                setLoading(false);
            }
        }

        getRooms();
    }, []);

    if (loading) {
        return <p>Loading rooms...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className="flex flex-col  ">
            <h1>Focentra</h1>

            {rooms.length === 0 ? (
                <p>No rooms available</p>
            ) : (
                rooms.map((room) => (
                    <RoomCard
                        key={room.id}
                        id={room.id}
                        title={room.title}
                        activeMember={room.activeMember}
                        capacity={room.capacity}
                    />
                ))
            )}
        </div>
    );
}
