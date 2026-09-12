import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/summary", requireAuth, async (req, res) => {
    const userId = res.locals.userId;
    // all completed sessions 
    const allCompletedFocusedSession = await prisma.focusSession.findMany({
        where: {
            userId,
            endedAt: { not: null },
        },
        select: {
            startedAt: true,
            endedAt: true,
        },
    });
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    const now = new Date();

    // Shift current time to IST
    const indiaNow = new Date(now.getTime() + IST_OFFSET_MS);

    // Get today's date in India
    const year = indiaNow.getUTCFullYear();
    const month = indiaNow.getUTCMonth();
    const date = indiaNow.getUTCDate();

    // 12:00 AM today in India
    const dayStart = new Date(Date.UTC(year, month, date) - IST_OFFSET_MS);

    // 12:00 AM tomorrow in India
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
// get today all completed focused sessions 
    const todayFocusSessions = await prisma.focusSession.findMany({
        where: {
            userId,

            startedAt: {
                lt: dayEnd,
            },

            endedAt: {
                not: null,
                gt: dayStart,
            },
        },

        select: {
            startedAt: true,
            endedAt: true,
        },
    });
    
    const todayFocusSeconds = todayFocusSessions.reduce((total, session) => {
        if (!session.endedAt) {
            return total;
        }

        const effectiveStart = Math.max(
            session.startedAt.getTime(),
            dayStart.getTime(),
        );

        const effectiveEnd = Math.min(
            session.endedAt.getTime(),
            dayEnd.getTime(),
        );

        const durationInSeconds = (effectiveEnd - effectiveStart) / 1000;

        return total + durationInSeconds;
    }, 0);

    const totalFocusSeconds = allCompletedFocusedSession.reduce(
        (total, session) => {
            if (!session.endedAt) {
                return total;
            }
            const durationInMilliseconds =
                session.endedAt.getTime() - session.startedAt.getTime();
            const durationInSeconds = durationInMilliseconds / 1000;
            return durationInSeconds + total;
        },
        0,
    );

    return res.status(200).json({
        totalFocusSeconds,
        todayFocusSeconds,
    });
});

export default router;
