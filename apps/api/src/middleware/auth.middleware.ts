import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../modules/auth/auth.token";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    try {
        const userId = verifyAccessToken(token);

        res.locals.userId = userId;

        next();
    } catch {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}
