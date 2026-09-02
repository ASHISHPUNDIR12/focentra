import z from "zod";

export const createRoomSchema = z.object({
    title: z.string().min(1),
});
