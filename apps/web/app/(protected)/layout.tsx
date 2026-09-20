"use client";
import { useEffect } from "react";
import { useAuth } from "../_providers/Authprovider";
import { useRouter } from "next/navigation";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();

    const { user, loading, error } = useAuth();
    useEffect(() => {
        if (!user && !loading && !error) {
            router.replace("/login");
        }
    }, [user, loading, router, error]);

    if (loading) {
        return (
            <main
                className="mx-auto max-w-lg px-6 py-24 text-center text-muted"
                role="status"
            >
                Getting your space ready…
            </main>
        );
    }
    if (error) {
        return (
            <main
                className="mx-auto max-w-lg px-6 py-24 text-center text-muted"
                role="alert"
            >
                Unable to verify authentication. Please try again.
            </main>
        );
    }
    if (!user) {
        return null;
    }
    return <>{children}</>;
};

export default ProtectedLayout;
