"use client";

import { useEffect } from "react";
import { socket } from "../lib/socket";
import { useAuth } from "./Authprovider";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

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

    return <>{children}</>;
};

export default SocketProvider;
