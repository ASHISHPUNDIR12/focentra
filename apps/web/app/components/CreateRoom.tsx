"use client";

import { SubmitEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveRoom } from "../_providers/SocketProvider";
import Icon from "./Icon";

const CreateRoom = ({ onCreated }: { onCreated?: () => void }) => {
    const router = useRouter();
    const { rememberRoom } = useActiveRoom();
    const [open, setOpen] = useState(false);
    const dialog = useRef<HTMLDialogElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const headingId = useId();
    const inputId = useId();

    // The native dialog makes the rest of the page inert and restores focus on close.
    useEffect(() => {
        if (!open) return;
        const modal = dialog.current;
        const hadScrollLock =
            document.body.classList.contains("overflow-hidden");
        modal?.showModal();
        input.current?.focus();
        document.body.classList.add("overflow-hidden");
        return () => {
            modal?.close();
            if (!hadScrollLock)
                document.body.classList.remove("overflow-hidden");
        };
    }, [open]);

    const [title, setTitle] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState("");
    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setIsSubmitting(true);

        try {
            const response = await fetch("http://localhost:3001/v1/rooms", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                setError(data.message || "Unable to create room");
                return;
            }

            setTitle("");
            rememberRoom(data.room.id);
            dialog.current?.close();
            onCreated?.();
            router.push(`/rooms/${data.room.id}`);
        } catch (error) {
            console.error(error);

            setError("Unable to reach server");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                ref={trigger}
                type="button"
                onClick={() => {
                    setError("");
                    setOpen(true);
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-sage-600 px-5 py-3 text-xs font-semibold text-white shadow-clay-button transition hover:bg-sage-700 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage-600 motion-reduce:transition-none"
            >
                <Icon name="plus" size={16} />
                Create a room
            </button>
            <dialog
                ref={dialog}
                aria-labelledby={headingId}
                onClose={() => {
                    setOpen(false);
                    trigger.current?.focus();
                }}
                onKeyDown={(event) => {
                    // Keep Tab cycling through controls instead of leaving the modal.
                    if (event.key !== "Tab") return;
                    const controls = Array.from(
                        event.currentTarget.querySelectorAll<HTMLElement>(
                            "button:not(:disabled), input:not(:disabled), a[href]",
                        ),
                    );
                    const first = controls[0],
                        last = controls[controls.length - 1];
                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last?.focus();
                    }
                    if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first?.focus();
                    }
                }}
                className="fixed inset-0 m-auto max-h-[calc(100svh-32px)] w-[calc(100%-32px)] max-w-md overflow-y-auto rounded-[28px] border border-white bg-surface p-6 text-ink shadow-2xl backdrop:bg-ink/25 backdrop:backdrop-blur-sm sm:p-8"
            >
                <div className="mb-5 flex items-start justify-between gap-4">
                    <span className="grid size-12 place-items-center rounded-2xl bg-sage-100 text-sage-700 shadow-clay-icon">
                        <Icon name="rooms" size={23} />
                    </span>
                    <button
                        type="button"
                        aria-label="Close create room"
                        onClick={() => dialog.current?.close()}
                        className="grid size-11 place-items-center rounded-xl text-muted hover:bg-sage-100 focus-visible:outline-2 focus-visible:outline-sage-600"
                    >
                        <Icon name="close" size={18} />
                    </button>
                </div>
                <h2
                    id={headingId}
                    className="text-2xl font-bold tracking-tight"
                >
                    A little space to focus.
                </h2>
                <form onSubmit={handleSubmit} className="mt-3">
                    <p className="mb-6 text-sm leading-7 text-muted">
                        Choose a name that sets the tone. A quiet corner for you
                        and a few good minds.
                    </p>
                    <label
                        className="mb-2 block text-xs font-semibold"
                        htmlFor={inputId}
                    >
                        Room title
                    </label>
                    <input
                        ref={input}
                        id={inputId}
                        className="min-h-12 w-full rounded-xl border border-sage-200 bg-canvas px-4 py-3 text-base shadow-clay-inset outline-none placeholder:text-muted/80 focus:border-sage-400 focus:ring-2 focus:ring-sage-300"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        name="title"
                        placeholder="e.g. A quiet afternoon"
                        required
                    />
                    {error && (
                        <p
                            className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => dialog.current?.close()}
                            className="min-h-11 rounded-xl border border-sage-200 px-4 py-2 text-xs font-semibold text-muted hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-sage-600"
                        >
                            Cancel
                        </button>
                        <button
                            className="min-h-11 rounded-2xl bg-sage-600 px-5 py-3 text-xs font-semibold text-white shadow-clay-button transition hover:bg-sage-700 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage-600 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
                            disabled={isSubmitting}
                            type="submit"
                        >
                            {isSubmitting ? "Creating…" : "Create room"}
                        </button>
                    </div>
                </form>
            </dialog>
        </>
    );
};
export default CreateRoom;
