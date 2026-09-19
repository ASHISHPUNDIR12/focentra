import express from "express";
import cors from "cors";
import "dotenv/config";
import authRouter from "./modules/auth/auth.routes";
import roomRouter from "./modules/rooms/room.routes";
import focusRouter from "./modules/focus/focus.routes";
import cookieParser from "cookie-parser";
import { createServer } from "node:http";
import { initializeSocketServer } from "./realtime/socket";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
    cors({
        origin: "http://localhost:3000",
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
const httpServer = createServer(app);
// socket io
initializeSocketServer(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
