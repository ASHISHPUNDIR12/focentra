import { z } from "zod";

export const roomTracks = [
    { id: "bonfire", name: "Bonfire", description: "Warm crackles and a gentle glow", src: "/audio/bonfire.mp3" },
    { id: "rain", name: "Soft rain", description: "A steady rainy afternoon", src: "/audio/rain.mp3" },
    { id: "jazz", name: "Chill jazz", description: "Mellow keys, bass and a soft beat", src: "/audio/jazz.mp3" },
    { id: "ocean", name: "Ocean waves", description: "Slow waves rolling onto the shore", src: "/audio/ocean.mp3" },
    { id: "forest", name: "Forest morning", description: "A light breeze and birdsong", src: "/audio/forest.mp3" },
    { id: "brown-noise", name: "Brown noise", description: "A soft, low wash for deep focus", src: "/audio/brown-noise.mp3" },
] as const;

export const updateMusicSchema = z.object({
    trackId: z.string().refine((id) => roomTracks.some((track) => track.id === id)).nullable(),
}).strict();

export function musicState(room: {
    id: number;
    musicTrack: string | null;
    musicStartedAt: Date | null;
    musicRevision: number;
}) {
    return {
        roomId: room.id,
        trackId: room.musicTrack,
        startedAt: room.musicStartedAt?.toISOString() ?? null,
        revision: room.musicRevision,
        serverTime: new Date().toISOString(),
    };
}
export type RoomMusicState = ReturnType<typeof musicState>;
