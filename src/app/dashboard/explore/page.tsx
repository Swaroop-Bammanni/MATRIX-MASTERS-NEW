import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const statusColors: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-700",
  verified: "bg-blue-100 text-blue-700",
  matched: "bg-purple-100 text-purple-700",
  funded: "bg-green-100 text-green-700",
  in_progress: "bg-cyan-100 text-cyan-700",
  completed: "bg-emerald-100 text-emerald-700",
};

export default async function ExplorePage() {
  const supabase = await createClient();

  const { data: challenges } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Explore Challenges</h1>
        <p className="text-slate-500">
          Browse societal challenges reported by citizens.
        </p>
      </div>

      {challenges && challenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((c) => (
            <Link key={c.id} href={`/dashboard/challenge/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                {c.image_url && (
                  <img
                    src={c.image_url}
                    alt={c.title}
                    className="w-full h-36 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold line-clamp-2">
                      {c.title}
                    </CardTitle>
                    <Badge
                      className={
                        statusColors[c.status] || "bg-slate-100 shrink-0"
                      }
                    >
                      {c.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {c.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    📍 {c.location || "Unknown"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-slate-400">
            <p className="text-lg mb-2">No challenges yet</p>
            <p className="text-sm">Be the first to report a problem!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}