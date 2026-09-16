"use client";
import { useContext, useEffect } from "react";
import { AuthContext } from "../_providers/Authprovider";
import { useRouter } from "next/navigation";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const auth = useContext(AuthContext);
    if (!auth) {
        throw new Error("AuthContext must be used inside AuthProvider");
    }
    const { user, loading, error } = auth;
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
