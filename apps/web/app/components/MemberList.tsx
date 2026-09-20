import Avatar from "./Avatar";
type Member = { id: number; name: string | null };

// Portraits and counts are drawn from the existing presence event, never placeholders.
export default function MemberList({
    members,
    activeMembers,
    currentUserId,
}: {
    members: Member[];
    activeMembers: number;
    currentUserId?: number;
}) {
    return (
        <section
            className="min-w-0 rounded-[26px] border border-white bg-surface p-6 shadow-clay"
            aria-labelledby="members-heading"
        >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2
                    id="members-heading"
                    className="text-lg font-bold tracking-tight"
                >
                    In good company
                </h2>
                <span
                    className="rounded-lg bg-sage-100 px-2.5 py-1 text-[11px] font-semibold text-sage-800"
                    aria-live="polite"
                >
                    {activeMembers} present
                </span>
            </div>
            <p className="text-[11px] leading-6 text-muted">
                A little focus feels better together.
            </p>
            <ul className="mt-5 grid gap-1">
                {members.map((member) => (
                    <li
                        key={member.id}
                        className={`flex min-w-0 items-center gap-3 rounded-xl px-2 py-3 ${member.id === currentUserId ? "bg-sage-50" : ""}`}
                    >
                        <Avatar id={member.id} present />
                        <div className="min-w-0 flex-1">
                            <strong className="block text-xs font-semibold wrap-anywhere">
                                {member.name || "Focus member"}
                                {member.id === currentUserId && (
                                    <span className="ml-1 font-normal text-muted">
                                        (you)
                                    </span>
                                )}
                            </strong>
                            <span className="mt-1 block text-[10px] text-muted">
                                Here to focus
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
            {members.length === 0 && (
                <p className="mt-5 text-sm text-muted">
                    No members to show yet.
                </p>
            )}
        </section>
    );
}
