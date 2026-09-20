"use client";

import { useEffect, useId, useRef, useState } from "react";
import Icon, { type IconName } from "./Icon";

type SoundOption = {
    id: string;
    name: string;
    description: string;
    icon: IconName;
    tone: string;
};

export default function SoundSelect({ options, value, disabled, onChange }: {
    options: SoundOption[];
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
}) {
    const id = useId();
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const list = useRef<HTMLDivElement>(null);
    const search = useRef({ text: "", time: 0 });
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const [height, setHeight] = useState(320);
    const selected = options.find((option) => option.id === value) ?? options[0];

    function show() {
        const rect = trigger.current?.getBoundingClientRect();
        if (rect) {
            const above = rect.top - 16;
            setHeight(Math.max(100, Math.min(340, above)));
        }
        setActive(Math.max(0, options.findIndex((option) => option.id === value)));
        search.current = { text: "", time: 0 };
        setOpen(true);
    }

    function choose(index: number) {
        if (disabled || !options[index]) return;
        setOpen(false);
        trigger.current?.focus();
        onChange(options[index].id);
    }

    useEffect(() => {
        if (!open) return;
        function outside(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        }
        function close() { setOpen(false); }
        document.addEventListener("pointerdown", outside);
        window.addEventListener("resize", close);
        return () => {
            document.removeEventListener("pointerdown", outside);
            window.removeEventListener("resize", close);
        };
    }, [open]);

    useEffect(() => {
        if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
    }, [active, open]);

    return (
        <div ref={root} className="relative">
            <label id={`${id}-label`} htmlFor={`${id}-trigger`} className="mb-2 block text-xs font-semibold text-ink">Room sound</label>
            <button ref={trigger} id={`${id}-trigger`} type="button" role="combobox"
                aria-labelledby={`${id}-label`} aria-describedby="room-sound-description"
                aria-expanded={open} aria-controls={`${id}-list`} aria-haspopup="listbox"
                aria-activedescendant={open ? `${id}-option-${active}` : undefined}
                disabled={disabled} aria-busy={disabled}
                onClick={() => open ? setOpen(false) : show()}
                onBlur={(event) => { if (!root.current?.contains(event.relatedTarget)) setOpen(false); }}
                onKeyDown={(event) => {
                    if (event.key === "Escape" || event.key === "Tab") {
                        setOpen(false);
                        if (event.key === "Escape" && open) event.preventDefault();
                    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                        event.preventDefault();
                        if (!open) { show(); return; }
                        setActive((current) => event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
                    } else if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (open) choose(active); else show();
                    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                        event.preventDefault();
                        if (!open) show();
                        const now = Date.now();
                        const text = now - search.current.time < 700 ? search.current.text + event.key : event.key;
                        search.current = { text, time: now };
                        const match = options.findIndex((option) => option.name.toLowerCase().startsWith(text.toLowerCase()));
                        if (match >= 0) setActive(match);
                    }
                }}
                className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-canvas px-4 py-3 text-left shadow-clay-inset transition-colors hover:border-sage-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 disabled:cursor-wait disabled:opacity-60 ${open ? "border-sage-400 ring-2 ring-sage-100" : "border-sage-200"}`}>
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${selected.tone}`}><Icon name={selected.icon} size={19} /></span>
                <span className="flex-1 text-sm font-semibold text-ink">{selected.name}</span>
                <Icon name="chevron" size={17} className={`text-sage-600 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
            </button>
            {open && <div className={`absolute inset-x-0 z-50 overflow-hidden rounded-[22px] border border-sage-200 bg-surface p-2 shadow-[0_16px_40px_-12px_#344d3a40,0_2px_8px_#344d3a0a] bottom-[calc(100%-18px)]`}>
                <div ref={list} id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`}
                    style={{ maxHeight: height }} className="overflow-y-auto overscroll-contain p-1">
                    {options.map((option, index) => {
                        const chosen = option.id === value;
                        return <div key={option.id} id={`${id}-option-${index}`} role="option" aria-selected={chosen}
                            onPointerMove={() => setActive(index)}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => choose(index)}
                            className={`mb-1 flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors last:mb-0 ${index === active ? "border-sage-200 bg-sage-100/70" : chosen ? "border-transparent bg-sage-50" : "border-transparent"}`}>
                            <span className={`grid size-10 shrink-0 place-items-center rounded-xl shadow-clay-icon ${option.tone}`}><Icon name={option.icon} size={20} /></span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-ink">{option.name}</span>
                                <span className="mt-0.5 block text-xs leading-5 text-muted">{option.description}</span>
                            </span>
                            {chosen && <span className="grid size-5 shrink-0 place-items-center rounded-full bg-sage-600 text-white"><Icon name="check" size={12} /></span>}
                        </div>;
                    })}
                </div>
            </div>}
        </div>
    );
}
