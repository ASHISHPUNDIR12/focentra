export default function ClayClock() {
    return (
        <div
            className="relative hidden h-72 w-80 shrink-0 md:block"
            aria-hidden="true"
        >
            <div className="absolute top-3 left-6 size-64 rounded-full border border-sage-200/60" />
            <div className="absolute top-9 left-2 size-8 rounded-xl bg-sage-300 shadow-clay-icon -rotate-12" />
            <div className="absolute right-4 bottom-16 size-6 rounded-full bg-purple-300 shadow-clay-icon" />
            <div className="absolute bottom-5 left-4 h-14 w-72 rounded-[50%] bg-sage-100 shadow-clay" />
            <div className="absolute top-7 left-12 flex size-56 -rotate-12 items-center justify-center rounded-[64px] bg-sage-300 shadow-[12px_18px_26px_#67419e30,inset_5px_5px_9px_#ffffffb3,inset_-8px_-8px_14px_#7241b440]">
                <div className="relative size-40 rounded-full bg-surface shadow-clay-inset">
                    <span className="absolute top-3 left-1/2 h-3 w-1 -translate-x-1/2 rounded-full bg-sage-300" />
                    <span className="absolute right-3 top-1/2 h-1 w-3 -translate-y-1/2 rounded-full bg-sage-300" />
                    <span className="absolute bottom-3 left-1/2 h-3 w-1 -translate-x-1/2 rounded-full bg-sage-300" />
                    <span className="absolute left-3 top-1/2 h-1 w-3 -translate-y-1/2 rounded-full bg-sage-300" />
                    <span className="absolute left-1/2 top-1/2 h-10 w-2 origin-top -rotate-55 rounded-full bg-sage-500 shadow-sm" />
                    <span className="absolute left-1/2 bottom-1/2 h-12 w-2 rounded-full bg-sage-600 shadow-sm" />
                    <span className="absolute top-1/2 left-1/2 size-4 -translate-x-1/4 -translate-y-1/2 rounded-full bg-sage-600 shadow-clay-button" />
                </div>
            </div>
            <span className="absolute top-0 right-4 text-5xl text-sage-400 drop-shadow-sm">
                ✦
            </span>
        </div>
    );
}
