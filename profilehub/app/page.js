import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getLoggedInUser } from "../lib/auth";
import DashboardContent from "../components/DashboardContent";

async function DashboardData() {
  await connection();

  const user = await getLoggedInUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardContent user={user} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardData />
    </Suspense>
  );
}