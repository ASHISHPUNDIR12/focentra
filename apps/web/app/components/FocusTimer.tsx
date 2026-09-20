import Icon from "./Icon";
import Avatar from "./Avatar";

function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

// The room page still owns the existing clock; this component only renders it.
export default function FocusTimer({
    seconds,
    user,
}: {
    seconds: number;
    user?: { id: number; name: string | null } | null;
}) {
    return (
        <section
            className="min-w-0 rounded-[28px] border border-white bg-[#f0f2e9] px-5 py-8 text-center shadow-clay sm:px-7 sm:py-10"
            aria-labelledby="timer-heading"
        >
            <span className="mx-auto mb-6 grid size-[76px] place-items-center rounded-[25px] bg-sage-200 text-sage-600 shadow-clay-icon">
                <Icon name="headphones" size={32} />
            </span>
            <h2
                id="timer-heading"
                className="text-[10px] font-bold tracking-[0.18em] text-sage-700"
            >
                A LITTLE TIME, WELL SPENT
            </h2>
            <p
                role="timer"
                aria-live="off"
                aria-label="Elapsed focus time"
                className="mt-4 mb-2 text-[clamp(2.5rem,5.2vw,4.6rem)] leading-tight font-bold tracking-[-0.06em] tabular-nums"
            >
                {formatTime(seconds)}
            </p>
            <p className="text-xs text-muted">Your current focus session</p>
            {user && (
                <div className="mx-auto mt-7 mb-6 inline-flex max-w-full items-center gap-3 rounded-2xl bg-surface py-2 pr-5 pl-2 text-left">
                    <Avatar id={user.id} size={37} />
                    <div className="min-w-0">
                        <strong className="block text-xs wrap-anywhere">
                            {user.name || "You"}
                        </strong>
                        <span className="text-[11px] text-muted">
                            Making a little progress
                        </span>
                    </div>
                </div>
            )}
            <p className="mt-5 border-t border-sage-200 pt-5 text-[11px] leading-6 text-muted">
                One thing at a time. You’re right where you need to be.
            </p>
        </section>
    );
}
