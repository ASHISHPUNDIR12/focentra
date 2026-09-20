"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";
import { readApiResponse } from "../lib/api-response";
import Icon, { type IconName } from "./Icon";
import SoundSelect from "./SoundSelect";

type Track = { id: string; name: string; description: string; src: string };
type Music = {
    roomId: number;
    trackId: string | null;
    startedAt: string | null;
    revision: number;
    serverTime: string;
};

const trackStyles: Record<string, { icon: IconName; tone: string }> = {
    bonfire: { icon: "fire", tone: "bg-[#f5e8da] text-[#a76e40]" },
    rain: { icon: "rain", tone: "bg-[#e5edf3] text-[#64859e]" },
    jazz: { icon: "music", tone: "bg-[#ede7f2] text-[#8b72a3]" },
    ocean: { icon: "waves", tone: "bg-[#e0efec] text-[#568c84]" },
    forest: { icon: "leaf", tone: "bg-sage-100 text-sage-600" },
    "brown-noise": { icon: "noise", tone: "bg-[#eee7e2] text-[#937c69]" },
};

export default function RoomMusic({
    roomId,
    userId,
}: {
    roomId: number;
    userId: number | undefined;
}) {
    const audio = useRef<HTMLAudioElement>(null);
    const clockOffset = useRef(0);
    const [music, setMusic] = useState<Music | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [creatorId, setCreatorId] = useState<number>();
    const [available, setAvailable] = useState(true);
    const [volume, setVolume] = useState(0.4);
    const [muted, setMuted] = useState(false);
    const [playback, setPlayback] = useState("loading");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    const track = tracks.find((item) => item.id === music?.trackId);
    const trackSrc = track?.src;
    const isCreator = creatorId === userId && userId !== undefined;

    useEffect(() => {
        const controller = new AbortController();
        function receive(next: Music) {
            if (next.roomId !== roomId) return;
            setMusic((current) =>
                !current || next.revision > current.revision ? next : current,
            );
        }
        async function refresh() {
            const sentAt = Date.now();
            try {
                const response = await fetch(
                    `http://localhost:3001/v1/rooms/${roomId}/music`,
                    {
                        credentials: "include",
                        signal: controller.signal,
                    },
                );
                if (response.status === 403) setAvailable(false);
                const data = await readApiResponse<{
                    music: Music;
                    tracks: Track[];
                    creatorId: number;
                }>(response, "Room sounds couldn’t load. Please try again.");
                if (!data.music || !Array.isArray(data.tracks))
                    throw new Error(
                        "Room sounds couldn’t load. Please try again.",
                    );
                if (controller.signal.aborted) return;
                clockOffset.current =
                    Date.parse(data.music.serverTime) -
                    (sentAt + Date.now()) / 2;
                receive(data.music);
                setTracks(data.tracks);
                setCreatorId(data.creatorId);
                setAvailable(true);
                setError("");
            } catch (error) {
                if (!controller.signal.aborted)
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load room sound",
                    );
            }
        }
        function onDeparture(data: {
            roomId: number;
            userId: number;
            action: string;
        }) {
            if (
                data.roomId === roomId &&
                data.userId === userId &&
                data.action === "left"
            ) {
                audio.current?.pause();
                setAvailable(false);
            }
        }
        socket.on("room-music", receive);
        socket.on("connect", refresh);
        socket.on("room-notification", onDeparture);
        window.addEventListener("focus", refresh);
        // Recover missed events even if a connection stayed open during an API restart.
        const interval = setInterval(refresh, 30000);
        void refresh();
        return () => {
            controller.abort();
            clearInterval(interval);
            socket.off("room-music", receive);
            socket.off("connect", refresh);
            socket.off("room-notification", onDeparture);
            window.removeEventListener("focus", refresh);
        };
    }, [roomId, userId, retry]);

    useEffect(() => {
        const player = audio.current;
        if (!player) return;
        player.volume = volume;
        player.muted = muted;
    }, [volume, muted]);

    useEffect(() => {
        const player = audio.current;
        if (!player || !trackSrc || !music?.startedAt || !available) {
            player?.pause();
            return;
        }
        let disposed = false;
        const startedAt = Date.parse(music.startedAt);
        function synchronize() {
            if (
                !player ||
                !Number.isFinite(player.duration) ||
                !player.duration
            )
                return;
            const position =
                Math.max(
                    0,
                    (Date.now() + clockOffset.current - startedAt) / 1000,
                ) % player.duration;
            if (Math.abs(player.currentTime - position) > 1.5)
                player.currentTime = position;
        }
        async function start() {
            synchronize();
            try {
                await player!.play();
            } catch (error) {
                if (disposed) return;
                setPlayback(
                    error instanceof DOMException &&
                        error.name === "NotAllowedError"
                        ? "blocked"
                        : "error",
                );
            }
        }
        player.addEventListener("loadedmetadata", start);
        player.src = trackSrc;
        player.load();
        const interval = setInterval(synchronize, 15000);
        window.addEventListener("focus", synchronize);
        return () => {
            disposed = true;
            clearInterval(interval);
            window.removeEventListener("focus", synchronize);
            player.removeEventListener("loadedmetadata", start);
            player.pause();
            player.removeAttribute("src");
            player.load();
        };
    }, [trackSrc, music?.startedAt, music?.revision, available]);

    async function enableSound() {
        try {
            await audio.current?.play();
        } catch {
            setPlayback("error");
        }
    }

    async function chooseSound(trackId: string | null) {
        if (saving || trackId === music?.trackId) return;
        setSaving(true);
        setError("");
        try {
            const response = await fetch(
                `http://localhost:3001/v1/rooms/${roomId}/music`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ trackId }),
                },
            );
            const data = await readApiResponse<{ music: Music }>(
                response,
                "That sound couldn’t start. Please try selecting it again.",
            );
            if (!data.music)
                throw new Error("That sound couldn’t start. Please try again.");
            setMusic((current) =>
                !current || data.music.revision > current.revision
                    ? data.music
                    : current,
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to change room sound",
            );
        } finally {
            setSaving(false);
        }
    }

    const listening = playback === "playing" && !muted && volume > 0;
    const currentStyle = track ? trackStyles[track.id] : undefined;

    return (
        <section
            aria-labelledby="room-sound-heading"
            className="mt-6 rounded-[26px] border border-white bg-surface shadow-clay"
        >
            <audio
                ref={audio}
                loop
                preload="auto"
                onPlaying={() => setPlayback("playing")}
                onLoadStart={() => setPlayback("loading")}
                onError={() => setPlayback("error")}
            />
            <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-sage-600">
                            SET THE MOOD
                        </p>
                        <h2
                            id="room-sound-heading"
                            className="text-xl font-bold tracking-tight"
                        >
                            A soundtrack for your focus.
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-muted">
                            {isCreator
                                ? "Pick a sound. Settle in together."
                                : "One shared sound, a little focus for everyone."}
                        </p>
                    </div>
                    {music && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-sage-200 bg-sage-50 px-3 py-2 text-[11px] font-medium text-sage-700">
                            <Icon
                                name={isCreator ? "music" : "users"}
                                size={14}
                            />
                            {isCreator
                                ? "You control the sound"
                                : "Selected by the creator"}
                        </span>
                    )}
                </div>
                {!available ? (
                    <p className="mt-5 text-sm text-muted" role="status">
                        You’ve left this room.
                    </p>
                ) : !music && !error ? (
                    <div
                        className="mt-6 h-14 rounded-2xl bg-sage-50 motion-safe:animate-pulse"
                        role="status"
                        aria-label="Loading sounds"
                    />
                ) : (
                    music &&
                    isCreator && (
                        <div className="mt-6 max-w-xl">
                            <SoundSelect
                                value={music.trackId ?? ""}
                                disabled={saving}
                                onChange={(value) =>
                                    void chooseSound(value || null)
                                }
                                options={[
                                    {
                                        id: "",
                                        name: "Quiet room",
                                        description:
                                            "A little silence, shared with everyone",
                                        icon: "mute",
                                        tone: "bg-sage-100 text-sage-600",
                                    },
                                    ...tracks.map((item) => ({
                                        ...item,
                                        ...(trackStyles[item.id] ??
                                            trackStyles["brown-noise"]),
                                    })),
                                ]}
                            />
                            <p
                                id="room-sound-description"
                                role="status"
                                className="mt-2 text-xs leading-5 text-muted"
                            >
                                {saving
                                    ? "Changing the sound for everyone…"
                                    : (track?.description ??
                                      "A little silence, shared with everyone.")}
                            </p>
                            <p className="mt-3 text-xs leading-5 text-muted">
                                Your choice keeps playing when you leave. You
                                keep control when you return.
                            </p>
                        </div>
                    )
                )}
                {error && (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3">
                        <p className="text-sm text-rose-800" role="alert">
                            {error}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                setRetry((value) => value + 1);
                            }}
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-rose-800 focus-visible:outline-2 focus-visible:outline-rose-700"
                        >
                            <Icon name="refresh" size={14} /> Try again
                        </button>
                    </div>
                )}
            </div>
            {music && available && (
                <div className="flex flex-wrap items-center justify-between gap-5 rounded-b-[26px] border-t border-sage-200/60 bg-sage-50/70 px-6 py-5 sm:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <span
                            className={`grid size-11 shrink-0 place-items-center rounded-2xl ${currentStyle?.tone ?? "bg-sage-100 text-sage-600"}`}
                        >
                            <Icon
                                name={currentStyle?.icon ?? "headphones"}
                                size={22}
                            />
                        </span>
                        <div role="status" className="min-w-0">
                            <p className="text-[9px] font-semibold tracking-[0.14em] text-sage-600">
                                {track
                                    ? "ROOM SOUNDTRACK"
                                    : "A MOMENT OF QUIET"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-ink">
                                {track?.name ?? "No sound selected"}
                            </p>
                            {track && (
                                <p className="mt-0.5 text-xs text-muted">
                                    {listening
                                        ? "Playing for you"
                                        : muted || volume === 0
                                          ? "Muted for you"
                                          : playback === "error"
                                            ? "Playback interrupted"
                                            : "Ready when you are"}
                                </p>
                            )}
                        </div>
                    </div>
                    {track && (
                        <div className="flex flex-wrap items-center gap-3">
                            {playback !== "playing" && (
                                <button
                                    type="button"
                                    onClick={() => void enableSound()}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sage-600 px-4 text-xs font-semibold text-white shadow-clay-button hover:bg-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600"
                                >
                                    <Icon
                                        name={
                                            playback === "error"
                                                ? "refresh"
                                                : "play"
                                        }
                                        size={15}
                                    />
                                    {playback === "error"
                                        ? "Retry sound"
                                        : "Enable sound"}
                                </button>
                            )}
                            <button
                                type="button"
                                aria-pressed={muted}
                                aria-label={
                                    muted ? "Unmute for me" : "Mute for me"
                                }
                                title={muted ? "Unmute for me" : "Mute for me"}
                                onClick={() => setMuted((current) => !current)}
                                className="grid size-11 place-items-center rounded-xl border border-sage-200 bg-surface text-sage-700 hover:bg-sage-100 focus-visible:outline-2 focus-visible:outline-sage-600"
                            >
                                <Icon
                                    name={
                                        muted || volume === 0
                                            ? "mute"
                                            : "volume"
                                    }
                                    size={19}
                                />
                            </button>
                            <label className="flex items-center gap-3 text-xs text-muted">
                                <span className="sr-only">My volume</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={volume}
                                    aria-label="My volume"
                                    aria-valuetext={`${Math.round(volume * 100)} percent`}
                                    onChange={(event) =>
                                        setVolume(Number(event.target.value))
                                    }
                                    className="min-h-11 w-24 accent-sage-600 sm:w-28"
                                />
                                <span className="w-8 tabular-nums">
                                    {Math.round(volume * 100)}%
                                </span>
                            </label>
                        </div>
                    )}
                    {track && playback === "blocked" && (
                        <p className="w-full text-xs text-muted">
                            Tap Enable sound to start listening. Volume and mute
                            only affect you.
                        </p>
                    )}
                    {track && playback === "error" && (
                        <p
                            className="w-full text-xs text-rose-800"
                            role="alert"
                        >
                            Sound couldn’t play. Check your connection and
                            retry.
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}
