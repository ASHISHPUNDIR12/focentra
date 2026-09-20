import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFound: RequestHandler = (_req, res) => {
    res.status(404).json({ message: "This service is unavailable. Please refresh and try again." });
};

// Express's default handler sends HTML. All API failures must remain JSON.
export const apiError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    console.error("API request failed:", error);
    if (error?.type === "entity.parse.failed") {
        res.status(400).json({ message: "Invalid request body" });
        return;
    }
    res.status(500).json({ message: "Unable to complete the request. Please try again shortly." });
};
