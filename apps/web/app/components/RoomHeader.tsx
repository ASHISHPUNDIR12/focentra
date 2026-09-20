import Icon from "./Icon";
export default function RoomHeader({
    onLeave,
    isLeaving,
    disabled = false,
}: {
    onLeave: () => void;
    isLeaving: boolean;
    disabled?: boolean;
}) {
    return (
        <button
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-[#ead8d0] bg-[#f8eee7] px-4 py-3 text-xs font-semibold text-[#925b46] transition-colors hover:bg-[#f1e1d7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#925b46] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            onClick={onLeave}
            disabled={isLeaving || disabled}
        >
            <Icon name="logout" size={16} />
            {isLeaving ? "Leaving…" : "Leave room"}
        </button>
    );
}
