import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardHome() {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

  // Ensure user exists in users table
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingUser) {
    const userName = user.user_metadata?.full_name || user.email || "User";
    const userRole = user.user_metadata?.role || "citizen";
    await supabase.from("users").insert({
      id: user.id,
      email: user.email || "",
      full_name: userName,
      role: userRole,
    });
  }

  // Fetch counts in parallel
  const [
    { count: totalChallenges },
    { count: activeProjects },
    { count: completedCount },
  ] = await Promise.all([
    supabase
      .from("challenges")
      .select("*", { count: "exact", head: true })
      .eq("submitted_by", user.id),
    supabase
      .from("challenges")
      .select("*", { count: "exact", head: true })
      .eq("submitted_by", user.id)
      .in("status", ["in_progress", "funded"]),
    supabase
      .from("challenges")
      .select("*", { count: "exact", head: true })
      .eq("submitted_by", user.id)
      .eq("status", "completed"),
  ]);

  const roleMessages: Record<string, string> = {
    citizen: "Report a societal challenge and track its progress.",
    university: "View matched challenges and submit solutions.",
    industry: "Browse solutions, contribute CSR, and track orders.",
    admin: "Manage CSR funds, verify challenges, and issue orders.",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user.full_name}</h1>
        <p className="text-slate-500">
          {roleMessages[user.role] || "Welcome to SolveBridge."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              My Challenges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalChallenges || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeProjects || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      {user.role === "citizen" && (
        <Link href="/dashboard/submit">
          <Button size="lg">Report a New Problem</Button>
        </Link>
      )}
    </div>
  );
}