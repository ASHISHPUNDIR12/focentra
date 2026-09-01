import express from "express";
import "dotenv/config";
import authRouter from "./modules/auth/auth.routes"
import cookieParser from "cookie-parser";

const app = express();

const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(cookieParser())
app.use("/auth", authRouter)

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
