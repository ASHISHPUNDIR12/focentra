"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../_providers/Authprovider";
import Logo from "./Logo";
import Icon from "./Icon";

export default function AppHeader({ minimal = false }: { minimal?: boolean }) {
    const { user, loading, clearUser } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState("");
    const workspace = Boolean(user) && !minimal;

    async function logout() {
        setLoggingOut(true);
        setError("");
        try {
            const response = await fetch("http://localhost:3001/auth/logout", {
                method: "POST",
                credentials: "include",
            });
            if (!response.ok) throw new Error("Logout failed");
            clearUser();
            router.replace("/login");
        } catch {
            setError("Unable to log out. Please try again.");
        } finally {
            setLoggingOut(false);
        }
    }

    const navClass =
        "flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted hover:bg-sage-100 aria-[current=page]:bg-sage-200/80 aria-[current=page]:text-ink focus-visible:outline-2 focus-visible:outline-sage-600";

    const navigation = (
        <>
            <Link
                className={navClass}
                href="/dashboard"
                aria-current={pathname === "/dashboard" ? "page" : undefined}
            >
                <Icon name="dashboard" />
                Dashboard
            </Link>
            <Link
                className={navClass}
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
            >
                <Icon name="rooms" />
                Study rooms
            </Link>
        </>
    );

    return (
        <>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-white focus:p-3"
            >
                Skip to content
            </a>
            {workspace && (
                <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sage-200/60 bg-sidebar px-6 py-8 md:flex xl:w-64">
                    <Logo />
                    <p className="mt-14 mb-4 px-3 text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">
                        Your workspace
                    </p>
                    <nav
                        className="space-y-2"
                        aria-label="Workspace navigation"
                    >
                        {navigation}
                    </nav>
                    <div className="mt-auto pt-8">
                        <div className="rounded-[22px] bg-sage-100 px-5 py-6">
                            <Icon
                                name="leaf"
                                className="mb-4 size-6 text-sage-600"
                            />
                            <p className="text-sm leading-6 font-medium">
                                A little focus. A little growth.
                            </p>
                            <p className="mt-2 text-xs leading-5 text-muted">
                                Make room for what matters, one session at a
                                time.
                            </p>
                        </div>
                        <p className="mt-5 px-2 text-[10px] text-muted">
                            A quieter space to do your best work.
                        </p>
                    </div>
                </aside>
            )}
            <header
                className={
                    workspace
                        ? "px-5 md:ml-60 md:px-8 lg:px-12 xl:ml-64"
                        : "mx-auto max-w-7xl px-5 sm:px-8"
                }
            >
                <div
                    className={`flex min-h-20 flex-wrap items-center justify-between gap-4 py-4 ${workspace ? "border-b border-sage-200/70" : ""}`}
                >
                    {workspace ? (
                        <>
                            <div className="md:hidden">
                                <Logo />
                            </div>
                            <p className="hidden items-center gap-3 text-xs text-muted md:flex">
                                Your workspace<span>/</span>
                                <span className="font-semibold text-ink">
                                    {pathname === "/dashboard"
                                        ? "Dashboard"
                                        : "Study rooms"}
                                </span>
                            </p>
                        </>
                    ) : (
                        <Logo />
                    )}
                    <div className="flex items-center gap-4 text-sm sm:gap-6">
                        {workspace ? (
                            <>
                                <span className="hidden items-center gap-2.5 sm:flex">
                                    <span
                                        className="flex size-8 items-center justify-center rounded-xl bg-sage-200 text-xs font-semibold text-sage-800 shadow-clay-icon"
                                        aria-hidden="true"
                                    >
                                        {(user?.name || "You")
                                            .slice(0, 1)
                                            .toUpperCase()}
                                    </span>
                                    <span className="max-w-28 truncate text-xs font-semibold">
                                        {user?.name || "Your workspace"}
                                    </span>
                                </span>
                                <button
                                    className="min-h-10 cursor-pointer rounded-lg px-2 text-xs text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-sage-600 disabled:cursor-wait"
                                    onClick={logout}
                                    disabled={loggingOut}
                                >
                                    {loggingOut ? "Logging out…" : "Log out"}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    className="rounded py-2 text-xs hover:text-sage-600 focus-visible:outline-2 focus-visible:outline-sage-600 sm:text-sm"
                                    href="/"
                                >
                                    Study rooms
                                </Link>
                                {!minimal && !loading && (
                                    <Link
                                        className="rounded py-2 text-xs hover:text-sage-600 focus-visible:outline-2 focus-visible:outline-sage-600 sm:text-sm"
                                        href="/login"
                                    >
                                        Log in
                                    </Link>
                                )}
                                {!minimal && !loading && (
                                    <Link
                                        className="rounded-2xl bg-sage-600 px-4 py-3 text-xs font-semibold text-white shadow-clay-button hover:bg-sage-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage-600 sm:px-5 sm:text-sm"
                                        href="/register"
                                    >
                                        Get started
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                    {workspace && (
                        <nav
                            className="flex w-full gap-2 md:hidden"
                            aria-label="Mobile workspace navigation"
                        >
                            {navigation}
                        </nav>
                    )}
                </div>
                {error && (
                    <p className="pb-3 text-xs text-rose-800" role="alert">
                        {error}
                    </p>
                )}
            </header>
        </>
    );
}
