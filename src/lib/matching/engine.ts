import { createClient } from "@supabase/supabase-js";

interface ChallengeAnalysis {
  domain: string;
  required_skills: string[];
  subdomain: string;
}

interface UniversityData {
  org_id: string;
  org_name: string;
  org_location: string;
  departments: string[];
  research_domains: string[];
  laboratories: string[];
  past_projects: string[];
}

interface MatchResult {
  organization_id: string;
  organization_name: string;
  total_score: number;
  explanation: string;
  factors: {
    department: number;
    research: number;
    facility: number;
    project: number;
    location: number;
  };
}

function calculateOverlap(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) return 0;
  const lower1 = arr1.map((s) => s.toLowerCase());
  const lower2 = arr2.map((s) => s.toLowerCase());
  const matches = lower1.filter((item) =>
    lower2.some((target) => target.includes(item) || item.includes(target))
  );
  return matches.length / Math.max(arr1.length, 1);
}

function calculateLocationScore(
  challengeLocation: string,
  uniLocation: string
): number {
  if (!challengeLocation || !uniLocation) return 0.3;
  const c = challengeLocation.toLowerCase();
  const u = uniLocation.toLowerCase();
  if (c.includes(u) || u.includes(c)) return 1.0;
  const cParts = c.split(",").map((s) => s.trim());
  const uParts = u.split(",").map((s) => s.trim());
  const stateMatch = cParts.some((part) =>
    uParts.some((uPart) => uPart.includes(part) || part.includes(uPart))
  );
  if (stateMatch) return 0.7;
  return 0.3;
}

function buildExplanation(
  uniName: string,
  factors: MatchResult["factors"],
  matchedDepts: string[],
  matchedLabs: string[],
  matchedProjects: string[]
): string {
  const reasons: string[] = [];

  if (factors.department > 0.5) {
    reasons.push(
      `Strong department match: ${matchedDepts.slice(0, 3).join(", ")}`
    );
  }
  if (factors.research > 0.3) {
    reasons.push("Relevant research domain expertise");
  }
  if (factors.facility > 0.3) {
    reasons.push(
      `Required facilities available: ${matchedLabs.slice(0, 2).join(", ")}`
    );
  }
  if (factors.project > 0.2) {
    reasons.push(
      `Related past projects: ${matchedProjects.slice(0, 2).join(", ")}`
    );
  }
  if (factors.location > 0.6) {
    reasons.push("Geographic proximity to challenge location");
  }

  if (reasons.length === 0) {
    reasons.push("General institutional capability match");
  }

  return `${uniName} is recommended because: ${reasons.join(". ")}.`;
}

export async function findMatchingUniversities(
  challengeId: string
): Promise<MatchResult[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get challenge analysis
  const { data: analysis } = await supabase
    .from("challenge_analyses")
    .select("*")
    .eq("challenge_id", challengeId)
    .single();

  if (!analysis) {
    return [];
  }

  // Get challenge location
  const { data: challenge } = await supabase
    .from("challenges")
    .select("location")
    .eq("id", challengeId)
    .single();

  const challengeLocation = challenge?.location || "";

  // Get all university profiles with organization data
  const { data: universities } = await supabase
    .from("university_profiles")
    .select(`
      organization_id,
      departments,
      research_domains,
      laboratories,
      past_projects,
      organizations!inner (
        id,
        name,
        location
      )
    `);

  if (!universities || universities.length === 0) {
    return [];
  }

  const requiredSkills: string[] = analysis.required_skills || [];
  const challengeDomain: string = analysis.domain || "";

  const results: MatchResult[] = [];

  for (const uni of universities) {
    const org = uni.organizations as unknown as {
      id: string;
      name: string;
      location: string;
    };
    const departments: string[] = uni.departments || [];
    const researchDomains: string[] = uni.research_domains || [];
    const laboratories: string[] = uni.laboratories || [];
    const pastProjects: string[] = uni.past_projects || [];

    // Calculate individual scores
    const deptScore = calculateOverlap(requiredSkills, departments);
    const researchScore = calculateOverlap(
      [challengeDomain, analysis.subdomain || ""],
      researchDomains
    );
    const facilityScore = calculateOverlap(requiredSkills, laboratories);
    const projectScore = Math.min(pastProjects.length / 3, 1.0) * 0.8;
    const locationScore = calculateLocationScore(
      challengeLocation,
      org.location
    );

    // Weighted total
    const totalScore =
      deptScore * 0.35 +
      researchScore * 0.25 +
      facilityScore * 0.15 +
      projectScore * 0.15 +
      locationScore * 0.1;

    const normalizedScore = Math.min(Math.round(totalScore * 100), 99);

    // Find matched items for explanation
    const matchedDepts = departments.filter((d) =>
      requiredSkills.some(
        (s) =>
          d.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(d.toLowerCase())
      )
    );
    const matchedLabs = laboratories.filter((l) =>
      requiredSkills.some(
        (s) =>
          l.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(l.toLowerCase())
      )
    );

    const factors = {
      department: Math.round(deptScore * 100),
      research: Math.round(researchScore * 100),
      facility: Math.round(facilityScore * 100),
      project: Math.round(projectScore * 100),
      location: Math.round(locationScore * 100),
    };

    const explanation = buildExplanation(
      org.name,
      factors,
      matchedDepts,
      matchedLabs,
      pastProjects
    );

    results.push({
      organization_id: org.id,
      organization_name: org.name,
      total_score: normalizedScore,
      explanation,
      factors,
    });
  }

  // Sort by score descending and take top 5
  results.sort((a, b) => b.total_score - a.total_score);
  const topMatches = results.slice(0, 5);

  // Save matches to database
  for (const match of topMatches) {
    await supabase.from("matches").upsert({
      challenge_id: challengeId,
      organization_id: match.organization_id,
      total_score: match.total_score,
      explanation: match.explanation,
      status: "pending",
    });
  }

  // Update challenge status
  if (topMatches.length > 0) {
    await supabase
      .from("challenges")
      .update({ status: "matched" })
      .eq("id", challengeId);
  }

  return topMatches;
}