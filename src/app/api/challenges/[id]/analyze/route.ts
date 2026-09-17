import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractChallengeInfo } from "@/lib/ai/extract";
import { generateEmbedding } from "@/lib/ai/embeddings";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Step 1: AI Extraction
    const analysis = await extractChallengeInfo(
      challenge.title,
      challenge.description
    );

    // Save analysis to database
    const { error: analysisError } = await supabase
      .from("challenge_analyses")
      .upsert({
        challenge_id: id,
        domain: analysis.domain,
        subdomain: analysis.subdomain,
        urgency: analysis.urgency,
        affected_groups: analysis.affected_groups,
        estimated_affected_count: analysis.estimated_affected_count,
        required_skills: analysis.required_skills,
        summary: analysis.summary,
        confidence: analysis.confidence,
      });

    if (analysisError) {
      console.log("Analysis save error:", analysisError);
    }

    // Step 2: Generate Embedding
    const embeddingText = `${challenge.title}. ${challenge.description}. Domain: ${analysis.domain}. Skills: ${analysis.required_skills.join(", ")}`;
    const embedding = await generateEmbedding(embeddingText);

    if (embedding) {
      const { error: embedError } = await supabase
        .from("challenge_embeddings")
        .upsert({
          challenge_id: id,
          embedding: embedding,
        });

      if (embedError) {
        console.log("Embedding save error:", embedError);
      }
    }

    // Step 3: Find similar challenges
    let similarChallenges = [];

    if (embedding) {
      const { data: matches } = await supabase.rpc("match_challenges", {
        query_embedding: embedding,
        match_count: 3,
        match_threshold: 0.7,
      });

      similarChallenges = matches || [];
    }

    // Step 4: Find matching universities
    try {
      const { findMatchingUniversities } = await import("@/lib/matching/engine");
      await findMatchingUniversities(id);
    } catch (matchError) {
      console.log("Matching failed, will retry later:", matchError);
    }

    return NextResponse.json({
      success: true,
      analysis,
      similarChallenges,
    });
  } catch (error) {
    console.log("Analyze error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}