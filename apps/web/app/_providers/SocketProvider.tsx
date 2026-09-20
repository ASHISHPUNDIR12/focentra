"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { socket } from "../lib/socket";
import { useAuth } from "./Authprovider";

type ActiveRoomContextValue = {
    activeRoomId: number | null;
    rememberRoom: (roomId: number) => void;
    clearRoom: () => void;
};
const ActiveRoomContext = createContext<ActiveRoomContextValue | undefined>(
    undefined,
);

export function useActiveRoom() {
    const value = useContext(ActiveRoomContext);
    if (!value)
        throw new Error("useActiveRoom must be used inside SocketProvider");
    return value;
}

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const userId = user?.id;
    const [activeRoom, setActiveRoom] = useState<{
        userId: number;
        roomId: number;
    } | null>(null);
    const rememberRoom = useCallback(
        (roomId: number) => {
            if (userId !== undefined) setActiveRoom({ userId, roomId });
        },
        [userId],
    );
    const clearRoom = useCallback(() => setActiveRoom(null), []);

    // Keep only the confirmed room ID for navigation, using the existing socket.
    // A fresh connection restores it from presence; no local-storage guess is needed.
    useEffect(() => {
        if (userId === undefined) return;
        function onPresence(data: {
            roomId: number;
            members: { id: number }[];
        }) {
            if (data.members.some((member) => member.id === userId))
                rememberRoom(data.roomId);
            else
                setActiveRoom((current) =>
                    current?.roomId === data.roomId ? null : current,
                );
        }
        socket.on("presence-update", onPresence);
        socket.on("disconnect", clearRoom);
        return () => {
            socket.off("presence-update", onPresence);
            socket.off("disconnect", clearRoom);
        };
    }, [userId, rememberRoom, clearRoom]);

    useEffect(() => {
        if (loading || !user) {
            return;
        }

        function handleConnect() {
            console.log("Socket connected:", socket.id);
        }

        function handleConnectError(error: Error) {
            console.error("Socket connection failed:", error.message);
        }

        socket.on("connect", handleConnect);
        socket.on("connect_error", handleConnectError);

        socket.connect();

        return () => {
            socket.off("connect", handleConnect);
            socket.off("connect_error", handleConnectError);

            socket.disconnect();
        };
    }, [loading, user]);

    return (
        <ActiveRoomContext
            value={{
                activeRoomId:
                    activeRoom && activeRoom.userId === userId
                        ? activeRoom.roomId
                        : null,
                rememberRoom,
                clearRoom,
            }}
        >
            {children}
        </ActiveRoomContext>
    );
};

export default SocketProvider;
