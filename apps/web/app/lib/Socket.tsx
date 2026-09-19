"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";

export default function Socket() {
    useEffect(() => {
        const socket = io("http://localhost:3001", {
            withCredentials: true,
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection failed:", error.message);
        });

        return () => {
            socket.off("connect_error");
            socket.disconnect();
        };
    }, []);

    return null;
}
