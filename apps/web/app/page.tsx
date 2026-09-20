"use client";

import { API_URL } from "./lib/config";
import { useEffect, useState } from "react";
import RoomCard from "./components/RoomCard";
import CreateRoom from "./components/CreateRoom";
import { useAuth } from "./_providers/Authprovider";
import Icon from "./components/Icon";
import { socket } from "./lib/socket";

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
    const { user } = useAuth();
    const [revision, setRevision] = useState(0);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const refresh = () => setRevision((value) => value + 1);
        socket.on("rooms-changed", refresh);
        socket.on("connect", refresh);
        window.addEventListener("focus", refresh);
        return () => {
            socket.off("rooms-changed", refresh);
            socket.off("connect", refresh);
            window.removeEventListener("focus", refresh);
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        async function getRooms() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${API_URL}/v1/rooms`, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch rooms: ${response.status}`,
                    );
                }

                const data: RoomsResponse = await response.json();

                setRooms(data.rooms);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error("Failed to load rooms:", error);
                setError("Unable to load rooms");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        getRooms();
        return () => controller.abort();
    }, [revision]);

    return (
        <main
            id="main-content"
            className="mx-auto w-full max-w-[1260px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10"
        >
            <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
                <div>
                    <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
                        Better together
                    </p>
                    <h1 className="text-[30px] font-semibold tracking-[-1px] sm:text-4xl">
                        Study rooms
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-muted">
                        Find your kind of quiet, with a little company.
                    </p>
                </div>
                {user && (
                    <CreateRoom
                        onCreated={() => setRevision((value) => value + 1)}
                    />
                )}
            </header>
            <section aria-labelledby="rooms-heading">
                <h2 id="rooms-heading" className="sr-only">
                    Available study rooms
                </h2>
                {loading ? (
                    <div
                        className="rounded-[24px] bg-surface p-10 text-center text-sm text-muted shadow-clay"
                        role="status"
                    >
                        Finding your quiet corner…
                    </div>
                ) : error ? (
                    <div
                        className="rounded-[24px] bg-surface p-10 text-center text-sm text-muted shadow-clay"
                        role="alert"
                    >
                        <h2 className="mb-2 font-semibold text-ink">
                            Rooms couldn’t load
                        </h2>
                        <p>{error}. Please try again shortly.</p>
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="flex flex-col items-center rounded-[24px] bg-surface p-10 text-center shadow-clay">
                        <Icon
                            name="book"
                            className="mb-4 size-7 text-sage-500"
                        />
                        <h2 className="text-base font-semibold">
                            A quiet moment here
                        </h2>
                        <p className="mt-2 text-sm text-muted">
                            No rooms are available right now. Check back soon.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {rooms.map((room) => (
                            <RoomCard key={room.id} {...room} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
