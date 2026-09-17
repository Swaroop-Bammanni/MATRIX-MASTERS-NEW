import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

const urgencyColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const STATUS_STEPS = [
  "submitted",
  "verified",
  "matched",
  "solution_selected",
  "funded",
  "in_progress",
  "completed",
];

export default async function ChallengeDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();

  if (!challenge) {
    notFound();
  }

  const { data: analysis } = await supabase
    .from("challenge_analyses")
    .select("*")
    .eq("challenge_id", id)
    .single();

  // Find related challenges using vector similarity
  let relatedChallenges: {
    challenge_id: string;
    title: string;
    location: string;
    similarity: number;
  }[] = [];

  const { data: embeddingData } = await supabase
    .from("challenge_embeddings")
    .select("embedding")
    .eq("challenge_id", id)
    .single();

  if (embeddingData?.embedding) {
    const { data: matches } = await supabase.rpc("match_challenges", {
      query_embedding: embeddingData.embedding,
      match_count: 3,
      match_threshold: 0.65,
    });
    relatedChallenges = matches || [];
  }

  // Fetch matches before rendering JSX
  const { data: challengeMatches } = await supabase
    .from("matches")
    .select("*, organizations(name, location)")
    .eq("challenge_id", id)
    .order("total_score", { ascending: false })
    .limit(5);

  const currentStepIndex = STATUS_STEPS.indexOf(challenge.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{challenge.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
            <span>📍 {challenge.location || "No location"}</span>
            <span>
              📅 {new Date(challenge.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Badge className={statusColors[challenge.status] || "bg-slate-100"}>
          {challenge.status.replace(/_/g, " ").toUpperCase()}
        </Badge>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Original Submission */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Original Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700 leading-relaxed">
              {challenge.description}
            </p>
            {challenge.image_url && (
              <img
                src={challenge.image_url}
                alt="Evidence"
                className="w-full rounded-lg border"
              />
            )}
          </CardContent>
        </Card>

        {/* Right - AI Analysis */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">🧠 AI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Domain</p>
                    <p className="font-medium text-sm">
                      {analysis.domain || "Pending"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Subdomain</p>
                    <p className="font-medium text-sm">
                      {analysis.subdomain || "Pending"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Urgency</p>
                    {analysis.urgency && (
                      <Badge
                        className={
                          urgencyColors[analysis.urgency] || "bg-slate-100"
                        }
                      >
                        {analysis.urgency.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Affected</p>
                    <p className="font-medium text-sm">
                      ~{analysis.estimated_affected_count || "Unknown"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-slate-400 mb-1">AI Summary</p>
                  <p className="text-sm text-slate-600">
                    {analysis.summary || "No summary yet"}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-slate-400 mb-1">
                    Required Expertise
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.required_skills &&
                    analysis.required_skills.length > 0 ? (
                      analysis.required_skills.map(
                        (skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        )
                      )
                    ) : (
                      <span className="text-sm text-slate-400">
                        Pending analysis
                      </span>
                    )}
                  </div>
                </div>

                {analysis.confidence && (
                  <p className="text-xs text-slate-400">
                    Confidence: {(analysis.confidence * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p className="text-lg mb-1">⏳</p>
                <p className="text-sm">AI analysis pending...</p>
                <p className="text-xs mt-1">
                  Results will appear after processing
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Related Challenges */}
      {relatedChallenges.length > 0 && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-base">🔗 Related Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {relatedChallenges.map((rel) => (
                <a
                  key={rel.challenge_id}
                  href={`/dashboard/challenge/${rel.challenge_id}`}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{rel.title}</p>
                    <p className="text-xs text-slate-400">
                      📍 {rel.location || "Unknown"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-purple-600">
                    {(rel.similarity * 100).toFixed(0)}% similar
                  </Badge>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* University Matches */}
      {challengeMatches && challengeMatches.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-base">
              🎓 Top University Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {challengeMatches.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-start justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">
                        {m.organizations?.name}
                      </p>
                      <Badge
                        className={
                          m.status === "accepted"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }
                      >
                        {m.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">
                      📍 {m.organizations?.location}
                    </p>
                    <p className="text-xs text-blue-700">{m.explanation}</p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-2xl font-bold text-blue-600">
                      {m.total_score}%
                    </p>
                    <p className="text-xs text-slate-400">match</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Prototype data · Scores based on department, research, facility
              and location overlap
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_STEPS.map((step, i) => {
              const isActive = step === challenge.status;
              const isDone = i < currentStepIndex;
              return (
                <div key={step} className="flex items-center gap-1">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isDone
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {step.replace(/_/g, " ")}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <span className="text-slate-300 text-xs">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}