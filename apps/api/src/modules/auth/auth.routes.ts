import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { loginSchema, registerSchema } from "./auth.schema";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth.middleware";
import {
    clearAccessTokenCookie,
    createAccessToken,
    setAccessTokenCookie,
} from "./auth.token";

const router = Router();

router.post("/register", async (req, res) => {
    // validating through zod
    const result = registerSchema.safeParse(req.body);
    // if invalid input
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }
    const { name, email, password } = result.data;
    // if email already exists
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (user) {
        return res.status(409).json({
            message: "email already exist",
        });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        },
    });
    // create access token
    const accessToken = jwt.sign(
        {
            sub: String(newUser.id),
        },
        process.env.JWT_ACCESS_SECRET!,
        {
            expiresIn: "15m",
        },
    );
    // set the token as cookie
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
    });
    return res.status(201).json({
        message: "user created successfully",
        newUser,
    });
});

router.post("/login", async (req, res) => {
    // get the data
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "invalid inputs",
            error: result.error.flatten(),
        });
    }
    const { email, password } = result.data;
    // find the user
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (!user) {
        return res.status(400).json({
            message: "User does not exist",
        });
    }
    // compare the password
    const isVerified = await bcrypt.compare(password, user.passwordHash);
    if (!isVerified) {
        return res.status(401).json({
            message: "Invalid credentials",
        });
    }
    // create jwt and set as cookie
    const accessToken = createAccessToken(user.id);
    setAccessTokenCookie(res, accessToken);
    return res.status(200).json({
        message: "Logged in successfully",
        user,
    });
});

router.post("/logout", async (req, res) => {
    clearAccessTokenCookie(res);
    return res.status(200).json({
        message: "logged out successfully",
    });
});

router.get("/me", requireAuth, async (req, res) => {
    const userId = Number(res.locals.userId);

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        },
    });

    if (!user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    return res.json({
        user,
    });
});

export default router;
