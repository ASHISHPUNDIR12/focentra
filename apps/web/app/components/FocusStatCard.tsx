import Icon from "./Icon";

export default function FocusStatCard({
    label,
    seconds,
    total = false,
}: {
    label: string;
    seconds: number;
    total?: boolean;
}) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return (
        <div className="flex min-w-0 flex-col gap-4 rounded-[22px] border border-white bg-surface p-5 shadow-clay sm:flex-row sm:items-center sm:gap-5 sm:p-6">
            <span
                className={`grid size-11 shrink-0 place-items-center rounded-2xl shadow-clay-icon sm:size-14 ${total ? "bg-lavender text-[#8672a0]" : "bg-peach text-[#a77751]"}`}
            >
                <Icon name={total ? "clock" : "sun"} size={25} />
            </span>
            <div>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="my-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                    {hours > 0 && (
                        <>
                            {hours}
                            <span className="ml-1 text-sm font-normal text-muted">
                                h
                            </span>{" "}
                        </>
                    )}
                    {minutes}
                    <span className="ml-1 text-sm font-normal text-muted">
                        min
                    </span>
                </dd>
                <p className="text-[10px] leading-5 text-muted">
                    {total
                        ? "Every focused moment adds up."
                        : "Time well spent, today."}
                </p>
            </div>
        </div>
    );
}
