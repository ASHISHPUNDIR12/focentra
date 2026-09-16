"use client";
import { useEffect } from "react";
import { useAuth } from "../_providers/Authprovider";
import { useRouter } from "next/navigation";

const GuestLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const { user, loading, error } = useAuth();
    useEffect(() => {
        if (user && !loading && !error) {
            router.replace("/dashboard");
        }
    }, [user, loading, error, router]);

    if (loading) {
        return <>loading....</>;
    }
    if (error) {
        return <p>Unable to verify authentication. Please try again.</p>;
    }
    if (user) {
        return null;
    }
    return <>{children}</>;
};
export default GuestLayout;
