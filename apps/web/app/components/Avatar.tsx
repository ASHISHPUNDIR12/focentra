import Image from "next/image";

// Stable IDs select one of the original clay portraits. No profile data is inferred.
export default function Avatar({
    id,
    size = 48,
    present = false,
}: {
    id: number;
    size?: 34 | 37 | 48;
    present?: boolean;
}) {
    const variant = Math.abs(id * 7 + 3) % 6;
    const sizes = { 34: "size-[34px]", 37: "size-[37px]", 48: "size-12" };
    const columns = ["left-0", "-left-full", "-left-[200%]"];
    const tones = ["bg-sage-200", "bg-peach", "bg-lavender"];
    return (
        <span
            className={`relative inline-block shrink-0 rounded-[35%] align-middle shadow-clay-icon ${sizes[size]} ${tones[variant % 3]}`}
            aria-hidden="true"
        >
            <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
                <Image
                    src="/art/clay-avatars.png"
                    alt=""
                    width={1254}
                    height={1254}
                    sizes={`${size * 3}px`}
                    className={`absolute size-[300%] max-w-none object-fill ${columns[variant % 3]} ${variant > 2 ? "-top-[151%]" : "-top-[12%]"}`}
                />
            </span>
            {present && (
                <span className="absolute -right-px bottom-0 size-2.5 rounded-full border-2 border-surface bg-sage-500 ring-2 ring-sage-500/10" />
            )}
        </span>
    );
}
