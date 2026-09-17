import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const statusColors: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-700",
  under_review: "bg-yellow-100 text-yellow-700",
  verified: "bg-blue-100 text-blue-700",
  matched: "bg-purple-100 text-purple-700",
  solution_selected: "bg-indigo-100 text-indigo-700",
  funded: "bg-green-100 text-green-700",
  in_progress: "bg-cyan-100 text-cyan-700",
  completed: "bg-emerald-100 text-emerald-700",
};

export default async function MyChallengesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: challenges } = await supabase
    .from("challenges")
    .select("*")
    .eq("submitted_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Challenges</h1>
          <p className="text-slate-500">
            Track the status of problems you reported.
          </p>
        </div>
        <Link href="/dashboard/submit">
          <Button>Report New Problem</Button>
        </Link>
      </div>

      {challenges && challenges.length > 0 ? (
        <div className="space-y-3">
          {challenges.map((c) => (
            <Link key={c.id} href={`/dashboard/challenge/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold truncate">{c.title}</h3>
                      <Badge
                        className={
                          statusColors[c.status] || "bg-slate-100 shrink-0"
                        }
                      >
                        {c.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      📍 {c.location || "No location"} · 📅{" "}
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-slate-300 ml-4">→</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-slate-400">
            <p className="text-lg mb-2">No challenges yet</p>
            <p className="text-sm mb-4">
              Report a societal problem to get started.
            </p>
            <Link href="/dashboard/submit">
              <Button>Report Your First Problem</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}