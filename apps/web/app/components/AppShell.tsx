"use client";

import { API_URL } from "../lib/config";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../_providers/Authprovider";
import { useActiveRoom } from "../_providers/SocketProvider";
import Avatar from "./Avatar";
import Icon, { type IconName } from "./Icon";

function Brand({ href, mobile = false }: { href: string; mobile?: boolean }) {
    return (
        <Link
            className={`items-center gap-2.5 rounded-lg text-[25px] font-bold tracking-[-1.3px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage-600 ${mobile ? "inline-flex md:hidden" : "inline-flex"}`}
            href={href}
            aria-label="Focentra home"
        >
            <span className="grid size-10 place-items-center rounded-[15px] bg-sage-400 text-white shadow-clay-icon">
                <Icon name="leaf" size={23} />
            </span>
            focentra<span className="-ml-2 text-sage-400">.</span>
        </Link>
    );
}

// Presentation only: the existing root providers still own authentication and sockets.
export default function AppShell({ children }: { children: React.ReactNode }) {
    const {
        user,
        loading,
        clearUser,
        error: authError,
        refreshUser,
    } = useAuth();
    const { activeRoomId } = useActiveRoom();
    const [busy, setBusy] = useState(false);
    const [logoutError, setLogoutError] = useState("");
    const account = useRef<HTMLDetailsElement>(null);
    const pathname = usePathname();
    const router = useRouter();
    useEffect(() => {
        function dismiss(event: PointerEvent) {
            if (
                account.current &&
                !account.current.contains(event.target as Node)
            )
                account.current.open = false;
        }
        function escape(event: KeyboardEvent) {
            if (event.key === "Escape" && account.current?.open) {
                account.current.open = false;
                account.current.querySelector("summary")?.focus();
            }
        }
        document.addEventListener("pointerdown", dismiss);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("pointerdown", dismiss);
            document.removeEventListener("keydown", escape);
        };
    }, []);
    useEffect(() => {
        if (account.current) account.current.open = false;
    }, [pathname]);
    async function logout() {
        if (busy) return;
        setBusy(true);
        setLogoutError("");
        try {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
            if (!response.ok) throw new Error("Logout failed");
            clearUser();
            router.replace("/login");
        } catch {
            setLogoutError("Unable to log out. Please try again.");
        } finally {
            setBusy(false);
        }
    }
    const links: {
        href: string;
        label: string;
        icon: IconName;
        selected: boolean;
    }[] = [
        {
            href: "/dashboard",
            label: "Dashboard",
            icon: "grid",
            selected: pathname === "/dashboard",
        },
        {
            href: "/",
            label: "Study rooms",
            icon: "rooms",
            selected: pathname === "/",
        },
    ];
    const navigation = links.map((link) => (
        <Link
            key={link.href}
            href={link.href}
            className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-muted transition-colors hover:bg-sage-100 aria-[current=page]:bg-sage-200/80 aria-[current=page]:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-sm"
            aria-current={link.selected ? "page" : undefined}
        >
            <Icon name={link.icon} />
            <span>{link.label}</span>
        </Link>
    ));
    return (
        <div
            // Reserve the fixed sidebar's width once for every authenticated page.
            className={`min-h-svh ${user ? "pb-24 md:pb-0 md:pl-[236px]" : ""}`}
        >
            <a
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-white focus:p-3"
                href="#main-content"
            >
                Skip to content
            </a>
            {user && (
                <aside className="fixed inset-y-0 left-0 hidden w-[236px] flex-col overflow-y-auto border-r border-sage-200/60 bg-sidebar px-6 py-8 md:flex">
                    <Brand href="/dashboard" />
                    <p className="mt-14 mb-4 px-3 text-[10px] font-bold tracking-[0.16em] text-muted">
                        YOUR WORKSPACE
                    </p>
                    <nav className="grid gap-2" aria-label="Main navigation">
                        {navigation}
                    </nav>
                    <div className="mt-auto rounded-[22px] bg-sage-100 p-5 text-sage-800 [&>strong]:mt-4 [&>strong]:block [&>strong]:text-sm [&>p]:mt-2 [&>p]:text-xs [&>p]:leading-6 [&>p]:text-muted">
                        <Icon name="leaf" size={27} />
                        <strong>A little focus. A little growth.</strong>
                        <p>
                            Make room for what matters, one session at a time.
                        </p>
                    </div>
                    <p className="mt-5 text-center text-[10px] leading-5 text-muted">
                        A softer space to do your best work.
                    </p>
                </aside>
            )}
            <div className="flex min-h-svh min-w-0 flex-col">
                {user ? (
                    <header className="mx-5 flex min-h-20 items-center justify-between gap-4 border-b border-sage-200/70 py-4 sm:mx-8 lg:mx-12">
                        <Brand href="/dashboard" mobile />
                        <div className="hidden items-center gap-3 text-xs text-muted md:flex [&>strong]:text-ink">
                            <span>Your workspace</span>
                            <span>/</span>
                            <strong>
                                {pathname === "/dashboard"
                                    ? "Dashboard"
                                    : pathname === "/"
                                      ? "Study rooms"
                                      : "Focus room"}
                            </strong>
                        </div>
                        <div className="ml-auto flex items-center gap-4">
                            <details className="relative" ref={account}>
                                <summary
                                    aria-label="Account menu"
                                    className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage-600 [&::-webkit-details-marker]:hidden"
                                >
                                    <Avatar id={user.id} size={37} />
                                    <span className="hidden max-w-36 truncate text-xs font-semibold sm:inline">
                                        {user.name || "Your account"}
                                    </span>
                                    <Icon name="chevron" size={14} />
                                </summary>
                                <div className="absolute top-full right-0 z-40 mt-3 w-64 max-w-[calc(100vw-40px)] rounded-2xl border border-sage-200 bg-surface p-5 shadow-xl [&>strong]:block [&>strong]:text-sm [&>strong]:wrap-anywhere [&>p]:mt-1 [&>p]:text-xs [&>p]:text-muted [&>p]:wrap-anywhere">
                                    <strong>
                                        {user.name || "Focus member"}
                                    </strong>
                                    <p>{user.email}</p>
                                    <button
                                        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-sage-200 bg-sage-50 px-4 py-2 text-xs font-semibold transition-colors hover:bg-sage-100 focus-visible:outline-2 focus-visible:outline-sage-600 disabled:cursor-wait disabled:opacity-60"
                                        disabled={busy}
                                        onClick={logout}
                                    >
                                        <Icon name="logout" size={16} />
                                        {busy ? "Logging out…" : "Log out"}
                                    </button>
                                </div>
                            </details>
                        </div>
                    </header>
                ) : (
                    <header className="mx-auto flex w-full max-w-[1250px] shrink-0 items-center justify-between gap-4 px-5 py-5 sm:px-9 sm:py-6 [@media(max-height:700px)]:py-3.5">
                        <Brand href="/" />
                        <nav
                            aria-label="Main navigation"
                            className="flex items-center gap-3 text-xs sm:gap-6 sm:text-sm [&_a]:rounded-lg [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4 [&_a]:focus-visible:outline-sage-600"
                        >
                            <Link
                                className="hidden text-muted hover:text-ink sm:inline"
                                href="/"
                            >
                                Study rooms
                            </Link>
                            {!loading && (
                                <>
                                    <Link
                                        href="/login"
                                        aria-current={
                                            pathname === "/login"
                                                ? "page"
                                                : undefined
                                        }
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        className="inline-flex min-h-10 items-center justify-center rounded-2xl! bg-sage-600 px-4 py-2.5 text-xs font-semibold text-white shadow-clay-button transition-colors hover:bg-sage-700 active:translate-y-px motion-reduce:transition-none"
                                        href="/register"
                                    >
                                        Get started
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>
                )}
                {/* Session shortcut belongs below the header, outside workspace navigation. */}
                {user &&
                    activeRoomId &&
                    pathname !== `/rooms/${activeRoomId}` && (
                        <div className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-x-4 rounded-xl bg-sage-100/60 px-4 py-1 text-xs sm:mx-8 lg:mx-12">
                            <span className="flex items-center gap-2 text-muted">
                                <Icon name="headphones" size={15} />
                                Your focus room
                            </span>
                            <Link
                                href={`/rooms/${activeRoomId}`}
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-sage-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600"
                            >
                                Return to room
                                <Icon name="arrow" size={15} />
                            </Link>
                        </div>
                    )}
                {authError && (
                    <div
                        className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:mx-8 lg:mx-12"
                        role="alert"
                    >
                        <span>{authError}</span>
                        <button
                            className="rounded px-2 py-1 font-semibold underline focus-visible:outline-2"
                            onClick={() =>
                                void refreshUser().catch(() => undefined)
                            }
                        >
                            Retry
                        </button>
                    </div>
                )}
                {logoutError && (
                    <div
                        className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:mx-8 lg:mx-12"
                        role="alert"
                    >
                        {logoutError}
                    </div>
                )}
                {children}
            </div>
            {user && (
                <nav
                    className="fixed inset-x-0 bottom-0 z-30 flex justify-evenly gap-2 border-t border-sage-200 bg-surface/95 px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-sm md:hidden"
                    aria-label="Mobile navigation"
                >
                    {navigation}
                </nav>
            )}
        </div>
    );
}
