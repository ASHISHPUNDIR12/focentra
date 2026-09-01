import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);

        if (typeof decoded === "string" || !decoded.sub) {
            return res.status(401).json({
                message: "Invalid token",
            });
        }

        res.locals.userId = decoded.sub;

        next();
    } catch {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}
