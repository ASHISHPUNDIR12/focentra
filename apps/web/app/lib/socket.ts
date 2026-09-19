import { io } from "socket.io-client";

export const socket = io("http://locahost:3001", {
    withCredentials: true,
    autoConnect: false,
});

