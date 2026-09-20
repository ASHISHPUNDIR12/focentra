import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./_providers/Authprovider";
import SocketProvider from "./_providers/SocketProvider";
import AppShell from "./components/AppShell";

export const metadata: Metadata = {
    title: "Focentra — A little space to focus",
    description:
        "Find a focus room, settle in, and make time for what matters.",
    icons: {
        icon: "/icon.svg",
    },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en">
            <body className="min-h-svh bg-canvas font-sans leading-relaxed text-ink antialiased selection:bg-sage-200">
                <AuthProvider>
                    <SocketProvider>
                        <AppShell>{children}</AppShell>
                    </SocketProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
