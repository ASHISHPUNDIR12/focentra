"use client";

import { useAuth } from "@/app/_providers/Authprovider";
import Link from "next/link";
import AuthLayout from "@/app/components/AuthLayout";
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
    // The shared scene changes presentation only; submission stays with this page.
    return (
        <AuthLayout>
            <form
                className="mx-auto w-full max-w-md rounded-[28px] border border-white bg-surface p-6 shadow-clay sm:p-8 [@media(max-height:700px)]:p-6"
                onSubmit={handleSubmit}
            >
                <p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-muted">
                    A FRESH START
                </p>
                <h1 className="mb-2 text-[27px] leading-tight font-bold tracking-[-0.035em]">
                    Make yourself at home.
                </h1>
                <p className="mb-6 text-xs leading-6 text-muted [@media(max-height:700px)]:mb-4">
                    A quieter space to do your best work.
                </p>
                <div className="mt-4 [@media(max-height:700px)]:mt-3 [&>label]:mb-2 [&>label]:block [&>label]:text-xs [&>label]:font-semibold">
                    <label htmlFor="name">Your name</label>
                    <input
                        className="min-h-12 w-full rounded-xl border border-sage-200/70 bg-canvas px-4 py-3 text-base shadow-clay-inset outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-300 motion-reduce:transition-none"
                        id="name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="name"
                    />
                </div>
                <div className="mt-4 [@media(max-height:700px)]:mt-3 [&>label]:mb-2 [&>label]:block [&>label]:text-xs [&>label]:font-semibold">
                    <label htmlFor="email">Email address</label>
                    <input
                        className="min-h-12 w-full rounded-xl border border-sage-200/70 bg-canvas px-4 py-3 text-base shadow-clay-inset outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-300 motion-reduce:transition-none"
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />
                </div>
                <div className="mt-4 [@media(max-height:700px)]:mt-3 [&>label]:mb-2 [&>label]:block [&>label]:text-xs [&>label]:font-semibold">
                    <label htmlFor="password">Password</label>
                    <input
                        className="min-h-12 w-full rounded-xl border border-sage-200/70 bg-canvas px-4 py-3 text-base shadow-clay-inset outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-300 motion-reduce:transition-none"
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                    />
                </div>
                {error && (
                    <p
                        role="alert"
                        className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800"
                    >
                        {error}
                    </p>
                )}
                <button
                    className="mt-6 min-h-12 w-full cursor-pointer rounded-2xl bg-sage-600 px-5 py-3 text-sm font-semibold text-white shadow-clay-button transition hover:bg-sage-700 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage-600 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none [@media(max-height:700px)]:mt-4"
                    disabled={isSubmitting}
                    type="submit"
                >
                    {isSubmitting ? "Creating account…" : "Create account"}
                </button>
                <p className="mt-6 text-center text-xs leading-6 text-muted [@media(max-height:700px)]:mt-4">
                    Already have an account?{" "}
                    <Link
                        className="rounded font-semibold text-sage-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-sage-600"
                        href="/login"
                    >
                        Log in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};
export default RegisterPage;
