import express from "express";
import { apiError, notFound } from "./middleware/error.middleware.js";
import cors from "cors";
import "dotenv/config";
import authRouter from "./modules/auth/auth.routes.js";
import roomRouter from "./modules/rooms/room.routes.js";
import focusRouter from "./modules/focus/focus.routes.js";
import cookieParser from "cookie-parser";
import { createServer } from "node:http";
import { initializeSocketServer } from "./realtime/socket.js";

const app = express();
const CLIENT_URL =
    process.env.CLIENT_URL ||
    (process.env.NODE_ENV !== "production"
        ? "http://localhost:3000"
        : undefined);
if (!CLIENT_URL) {
    throw new Error("CLIENT_URL is required in production");
}
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
}
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
}

const PORT = Number(process.env.PORT) || 3001;

app.use(
    cors({
        origin: CLIENT_URL,
        credentials: true,
    }),
);

app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/v1/rooms", roomRouter);
app.use("/v1/focus", focusRouter);
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
app.use(notFound);
app.use(apiError);
const httpServer = createServer(app);
// socket io
initializeSocketServer(httpServer, CLIENT_URL);

httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
