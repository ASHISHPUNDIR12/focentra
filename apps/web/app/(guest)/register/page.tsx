"use client";

import { useAuth } from "@/app/_providers/Authprovider";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";


const RegisterPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const { refreshUser } = useAuth();
    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            const response = await fetch(
                "http://localhost:3001/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                    }),
                },
            );
            const data = await response.json();
            console.log(data);
            if (!response.ok) {
                setError(data.message || "Registeration failed");
                return;
            }
            console.log("Register success");
            await refreshUser();
            router.replace("/dashboard");
        } catch (error) {
            console.log(error);
            setError("Unable to connect to the server");
        } finally {
            setIsSubmitting(false);
        }
    }
    return (
        <>
            <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 text-slate-900">
                <form
                    className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                    onSubmit={handleSubmit}
                >
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-indigo-600">
                            Focentra
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Welcome
                        </h1>
                        <p className="text-sm text-slate-600">
                            Register to access your dashboard.
                        </p>
                    </div>
                    <label className="block text-sm font-medium" htmlFor="name">
                        Name
                    </label>
                    <input
                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        id="name"
                        name="name"

                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="name"
                    />
                    <label
                        className="block text-sm font-medium"
                        htmlFor="email"
                    >
                        Email
                    </label>
                    <input
                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />

                    <label
                        className="block text-sm font-medium"
                        htmlFor="password"
                    >
                        Password
                    </label>
                    <input
                        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                    />
                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}
                    <button
                        className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? "registering…" : "register"}
                    </button>
                </form>
            </main>
        </>
    );
};

export default RegisterPage;
