"use client";
import { API_URL } from "../../lib/config";
import CreateRoom from "@/app/components/CreateRoom";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/app/components/Icon";
import { useAuth } from "@/app/_providers/Authprovider";
import { useActiveRoom } from "@/app/_providers/SocketProvider";
import FocusStatCard from "@/app/components/FocusStatCard";
import { useEffect, useState } from "react";

type FocusSummaryResponse = {
    totalFocusSeconds: number;
    todayFocusSeconds: number;
};

const Dashboard = () => {
    const { user } = useAuth();
    const { activeRoomId } = useActiveRoom();
    const [summary, setSummary] = useState<FocusSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadFocusSummary() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/v1/focus/summary`,
                    {
                        credentials: "include",
                    },
                );

                if (!response.ok) {
                    setError("Unable to load focus summary");
                    return;
                }

                const data: FocusSummaryResponse = await response.json();

                setSummary(data);
            } catch (error) {
                console.error("Failed to load focus summary:", error);

                setError("Unable to load focus summary");
            } finally {
                setLoading(false);
            }
        }

        loadFocusSummary();
    }, []);

    // Read the existing summary as before; this layout only changes its hierarchy.
    return (
        <main
            id="main-content"
            className="mx-auto w-full max-w-[1260px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10"
        >
            <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
                <div>
                    <p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-muted">
                        A FRESH LITTLE START
                    </p>
                    <h1 className="text-[clamp(1.8rem,3vw,2.45rem)] leading-tight font-bold tracking-[-0.035em] wrap-anywhere">
                        Good to see you,{" "}
                        {user?.name?.trim().split(" ")[0] || "friend"}.
                    </h1>
                    <p className="mt-3 text-sm text-muted">
                        Let’s make a little room for what matters.
                    </p>
                </div>
                <CreateRoom />
            </header>
            <section
                className="mb-7 grid overflow-hidden rounded-[28px] border border-white bg-sage-100 shadow-clay-hero sm:grid-cols-[1.15fr_1fr]"
                aria-label="Find your focus space"
            >
                <div className="px-7 py-8 lg:px-9">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-white/60 px-3 py-1.5 text-[10px] font-bold tracking-wide text-sage-700">
                        <Icon name="leaf" size={13} />
                        {activeRoomId
                            ? "YOUR FOCUS ROOM IS WAITING"
                            : "YOUR NEXT SMALL WIN"}
                    </span>
                    <h2 className="mt-4 mb-3 text-[clamp(1.7rem,2.6vw,2.25rem)] leading-tight font-bold tracking-[-0.035em]">
                        Big things start
                        <br />
                        with a little focus.
                    </h2>
                    <p className="max-w-sm text-[13px] leading-7 text-muted">
                        Find a cozy room, settle in with a few good minds, and
                        take it one thing at a time.
                    </p>
                    <Link
                        className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-2xl bg-sage-600 px-5 py-3 text-xs font-semibold text-white shadow-clay-button transition hover:bg-sage-700 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage-600 motion-reduce:transition-none"
                        href={activeRoomId ? `/rooms/${activeRoomId}` : "/"}
                    >
                        {activeRoomId ? "Return to room" : "Find a study room"}
                        <Icon name="arrow" size={17} />
                    </Link>
                </div>
                <Image
                    className="hidden h-full max-h-[330px] w-full self-center object-contain px-3 mix-blend-multiply sm:block"
                    src="/art/study-desk.png"
                    alt=""
                    width={1536}
                    height={1024}
                    sizes="(max-width: 640px) 1px, 450px"
                    priority
                />
            </section>
            <section aria-label="Focus statistics">
                {loading ? (
                    <div
                        className="rounded-3xl bg-surface p-8 text-center text-sm text-muted shadow-clay motion-safe:animate-pulse"
                        role="status"
                    >
                        Loading your focus time…
                    </div>
                ) : error ? (
                    <div
                        className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-800"
                        role="alert"
                    >
                        {error}
                    </div>
                ) : summary ? (
                    <dl className="grid grid-cols-2 gap-3 sm:gap-5">
                        <FocusStatCard
                            label="Today’s focus"
                            seconds={summary.todayFocusSeconds}
                        />
                        <FocusStatCard
                            label="All-time focus"
                            seconds={summary.totalFocusSeconds}
                            total
                        />
                    </dl>
                ) : (
                    <p className="py-8 text-muted">
                        Focus summary unavailable.
                    </p>
                )}
            </section>
        </main>
    );
};
export default Dashboard;
