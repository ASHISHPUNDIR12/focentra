"use client";

import { createContext, useEffect, useState } from "react";

type User = {
    id: number;
    name: string | null;
    email: string;
    createdAt: string;
};
type MeResponse = {
    user: User;
};
type AuthProviderProps = {
    children: React.ReactNode;
};
type AuthContextType = {
    user: User | null;
    loading: boolean;
    error: string | null;
    refreshUser: () => Promise<void>;
    clearUser: () => void;
};
export const AuthContext = createContext<AuthContextType | undefined>(
    undefined,
);

async function fetchCurrentUser(): Promise<User | null> {
    const response = await fetch("http://localhost:3001/auth/me", {
        credentials: "include",
    });
    console.log("status", response.status);
    if (response.status === 401) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Auth check failed: ${response.status}`);
    }
    const data: MeResponse = await response.json();
    return data.user;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function refreshUser() {
        setLoading(true);
        try {
            const currentUser = await fetchCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error("Failed to refresh user:", error);
            setError("Unable to check authentication");
        } finally {
            setLoading(false);
        }
    }

    function clearUser() {
        setUser(null);
    }

    useEffect(() => {
        async function loadUser() {
            const currentUser = await fetchCurrentUser();
            setUser(currentUser);
            setLoading(false);
        }
        loadUser();
    }, []);

    return (
        <AuthContext value={{ user, loading, error, refreshUser, clearUser }}>
            {children}
        </AuthContext>
    );
};

export default AuthProvider;
