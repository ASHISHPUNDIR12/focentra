import type { Response } from "express";
import jwt from "jsonwebtoken";

export const verifyAccessToken = (token: string): number => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (typeof decoded === "string" || !decoded.sub) {
        throw new Error("Invalid access token");
    }
    const userId = Number(decoded.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error("Invalid access token");
    }
    return userId;
};

export const createAccessToken = (user: number) => {
    const accessToken = jwt.sign(
        {
            sub: String(user),
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "120m",
        },
    );
    return accessToken;
};

export const setAccessTokenCookie = (res: Response, accessToken: string) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 120 * 60 * 1000,
    });
};

export const clearAccessTokenCookie = (res: Response) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
};
