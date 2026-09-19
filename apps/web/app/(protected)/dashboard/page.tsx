"use client";
import { useAuth } from "@/app/_providers/Authprovider";
import CreateRoom from "@/app/components/CreateRoom";
import { useRouter } from "next/navigation";

const Dashboard = () => {
    const router = useRouter();

    const { user, clearUser } = useAuth();

    async function handleLogout() {
        try {
            const response = await fetch("http://localhost:3001/auth/logout", {
                method: "POST",
                credentials: "include",
            });
            if (!response.ok) {
                console.log("Logout failed");
                return;
            }
            console.log(response);
            clearUser();
            router.replace("/login");
        } catch (error) {
            console.error("Unable to logout", error);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
            <div className="mx-auto max-w-3xl space-y-6">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-indigo-600">
                            Focentra
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                            Dashboard
                        </h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Log out
                    </button>
                </header>
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-semibold">
                        Welcome, {user?.name || "there"}!
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Here are your account details.
                    </p>
                    <dl className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                        <div>
                            <dt className="text-sm font-medium text-slate-500">
                                Name
                            </dt>
                            <dd className="mt-1 break-words">
                                {user?.name || "Not set"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-slate-500">
                                Email
                            </dt>
                            <dd className="mt-1 break-words">{user?.email}</dd>
                        </div>
                    </dl>
                </section>
                <CreateRoom />
            </div>
        </main>
    );
};
export default Dashboard;

// erenyeager4@example.com
// mikasaaa
