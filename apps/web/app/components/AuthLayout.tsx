import Image from "next/image";

// Flex fills available height; short screens can still scroll to every form field.
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main
            id="main-content"
            className="mx-auto grid w-full max-w-[1040px] flex-1 items-center gap-8 px-5 py-5 sm:grid-cols-2 sm:px-8 lg:gap-[75px]"
        >
            <section
                className="hidden sm:block"
                aria-label="Welcome to Focentra"
            >
                <p className="text-[10px] font-bold tracking-[0.16em] text-muted">
                    A LITTLE SPACE FOR BIG IDEAS
                </p>
                <h2 className="mt-4 mb-5 text-[clamp(2rem,4vw,3rem)] leading-[1.2] font-bold tracking-[-0.035em]">
                    Find your focus.
                    <br />
                    Feel a little more
                    <br />
                    at home.
                </h2>
                <p className="max-w-[350px] text-sm leading-7 text-muted">
                    A calm corner of the internet to study, create, and make
                    progress together.
                </p>
                <Image
                    src="/art/study-desk.png"
                    alt=""
                    width={1536}
                    height={1024}
                    sizes="450px"
                    priority
                    className="mt-3.5 h-[clamp(130px,27svh,250px)] w-full object-contain mix-blend-multiply"
                />
            </section>
            {children}
        </main>
    );
}
