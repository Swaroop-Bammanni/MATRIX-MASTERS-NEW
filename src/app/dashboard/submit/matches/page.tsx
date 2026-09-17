import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default async function MatchesPage() {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      challenges (
        id,
        title,
        description,
        location,
        status,
        challenge_analyses (
          domain,
          urgency,
          required_skills
        )
      ),
      organizations (
        name,
        location
      )
    `)
    .order("total_score", { ascending: false })
    .limit(20);

  const matchStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Matched Challenges</h1>
        <p className="text-slate-500">
          Challenges matched to universities based on capability analysis.
        </p>
      </div>

      {matches && matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match: any) => {
            const challenge = match.challenges;
            const analysis = challenge?.challenge_analyses;
            const org = match.organizations;

            return (
              <Card key={match.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <CardTitle className="text-base">
                          {challenge?.title || "Unknown Challenge"}
                        </CardTitle>
                        <Badge
                          className={
                            matchStatusColors[match.status] || "bg-slate-100"
                          }
                        >
                          {match.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        📍 {challenge?.location || "Unknown"} · Matched to{" "}
                        <span className="font-medium">{org?.name}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">
                        {match.total_score}%
                      </p>
                      <p className="text-xs text-slate-400">Match Score</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Explanation */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      Why this match?
                    </p>
                    <p className="text-sm text-blue-700">
                      {match.explanation}
                    </p>
                  </div>

                  {/* Skills & Domain */}
                  {analysis && (
                    <div className="flex flex-wrap gap-2">
                      {analysis.domain && (
                        <Badge variant="outline">{analysis.domain}</Badge>
                      )}
                      {analysis.urgency && (
                        <Badge
                          variant="outline"
                          className="text-orange-600"
                        >
                          {analysis.urgency} urgency
                        </Badge>
                      )}
                      {analysis.required_skills?.map(
                        (skill: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        )
                      )}
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Link
                      href={`/dashboard/challenge/${challenge?.id}`}
                      className="text-sm text-blue-600 underline"
                    >
                      View Challenge Details →
                    </Link>
                    <p className="text-xs text-slate-400">
                      Prototype Data · Score based on capability overlap
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-slate-400">
            <p className="text-lg mb-2">No matches yet</p>
            <p className="text-sm">
              Submit and analyze challenges to see university matches.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}