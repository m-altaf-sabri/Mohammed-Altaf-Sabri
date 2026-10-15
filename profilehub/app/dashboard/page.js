import { Suspense } from "react";
import { connection } from "next/server";
import { getLoggedInUser } from "@/lib/auth";

async function DashboardContent() {
    await connection();

    const user = await getLoggedInUser();

    if (!user) {
        return <p>Please log in to continue.</p>;
    }

    return (
        <main>
            <h1>Welcome to ProfileHub</h1>
            <p>Hello, {user.name || user.email}!</p>
            <p>You are successfully logged in.</p>
        </main>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<p>Loading your dashboard...</p>}>
            <DashboardContent />
        </Suspense>
    );
}