"use client";
import {  useEffect } from "react";
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
        return <p>loading........</p>;
    }
    if (error) {
        return <p>Unable to verify authentication. Please try again.</p>;
    }
    if (!user) {
        return null;
    }
    return <>{children}</>;
};

export default ProtectedLayout;
