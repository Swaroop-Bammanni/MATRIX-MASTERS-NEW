import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import DashboardNav from "@/components/dashboards/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav
        userName={user.full_name}
        userRole={user.role}
      />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}