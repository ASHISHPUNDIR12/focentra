import type { Response } from "express";
import jwt from "jsonwebtoken";
export const createAccessToken = (user: number) => {
    const accessToken = jwt.sign(
        {
            sub: String(user),
        },
        process.env.JWT_ACCESS_SECRET!,
        {
            expiresIn: "15m",
        },
    );
    return accessToken;
};

export const setAccessTokenCookie = (res: Response, accessToken: string) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
    });
};

export const clearAccessTokenCookie = (res: Response) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
};
