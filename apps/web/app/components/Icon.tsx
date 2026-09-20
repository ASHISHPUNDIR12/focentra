import type { CSSProperties } from "react";
const paths = {
    fire: "M12 3c1 5 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 4-7 0 3 1 4 2 4 1-2 1-5 0-8Z M12 14c-3 3-2 6 0 6s3-3 0-6Z",
    rain: "M7 14H6a4 4 0 1 1 1-7 6 6 0 0 1 11 2 3 3 0 0 1 0 6 M8 17l-1 3 M13 16l-1 3 M18 18l-1 3",
    music: "M9 18V5l11-2v13 M9 9l11-2 M9 18a3 2 0 1 1-6 0 3 2 0 0 1 6 0 M20 16a3 2 0 1 1-6 0 3 2 0 0 1 6 0",
    waves: "M2 6c3-3 5 3 8 0s5 3 8 0 4 0 4 0 M2 12c3-3 5 3 8 0s5 3 8 0 4 0 4 0 M2 18c3-3 5 3 8 0s5 3 8 0 4 0 4 0",
    noise: "M4 10v4 M8 6v12 M12 3v18 M16 7v10 M20 10v4",
    play: "m9 5 11 7-11 7Z",
    volume: "m11 4-6 5H2v6h3l6 5V4Z M15 8a6 6 0 0 1 0 8 M18 5a10 10 0 0 1 0 14",
    mute: "m11 4-6 5H2v6h3l6 5V4Z M16 9l6 6 M22 9l-6 6",

    dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    rooms: "M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16 M2 21h20 M9 21v-6h6v6 M8 7h1 M15 7h1 M8 11h1 M15 11h1",
    clock: "M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
    arrow: "M5 12h14 M13 6l6 6-6 6",
    back: "M19 12H5 M11 6l-6 6 6 6",
    plus: "M12 5v14 M5 12h14",
    search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    refresh: "M20 7V3l-3 3a9 9 0 1 0 3 11 M20 3h-5",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    leaf: "M20 3C8 1 1 9 6 16s16 1 14-13Z M4 21L16 9",
    close: "M6 6l12 12 M6 18 18 6",
    chevron: "m6 9 6 6 6-6",
    logout: "M9 4H4v16h5 M14 8l4 4-4 4 M8 12h13",
    check: "m5 12 4 4L19 6",
    sun: "M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5 19 19 M5 19l1.5-1.5 M17.5 6.5 19 5 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
    headphones: "M4 14v-3a8 8 0 0 1 16 0v3 M4 13H3v7h4v-7H4 M20 13h1v7h-4v-7h3",
    book: "M12 5v16 M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1",
} as const;
export type IconName = keyof typeof paths;
export default function Icon({
    name,
    size = 20,
    style,
    className,
}: {
    name: IconName;
    size?: number;
    style?: CSSProperties;
    className?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={style}
            className={className}
        >
            <path d={paths[name]} />
        </svg>
    );
}
