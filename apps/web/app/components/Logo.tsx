import Link from "next/link";
import Icon from "./Icon";

export default function Logo({ linked = true }: { linked?: boolean }) {
    const brand = (
        <>
            <span
                className="flex size-10 items-center justify-center rounded-[15px] bg-sage-400 text-white shadow-clay-icon"
                aria-hidden="true"
            >
                <Icon name="leaf" className="size-6" />
            </span>
            <span>
                focentra<span className="text-sage-400">.</span>
            </span>
        </>
    );
    const className =
        "inline-flex shrink-0 items-center gap-3 rounded-lg text-[25px] font-semibold tracking-[-1.3px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage-600";
    return linked ? (
        <Link className={className} href="/" aria-label="Focentra home">
            {brand}
        </Link>
    ) : (
        <span className={className}>{brand}</span>
    );
}
