import { EventEmitter } from "node:events";

// Emitted only after a membership change has committed.
export const roomEvents = new EventEmitter();
export type RoomMembershipChange = {
    roomId: number;
    userId: number;
    name: string | null;
    action: "joined" | "left";
};
