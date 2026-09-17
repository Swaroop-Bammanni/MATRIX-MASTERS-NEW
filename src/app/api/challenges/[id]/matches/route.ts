import { NextResponse } from "next/server";
import { findMatchingUniversities } from "@/lib/matching/engine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matches = await findMatchingUniversities(id);

    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error) {
    console.log("Matching error:", error);
    return NextResponse.json(
      { error: "Matching failed" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { createClient } = await import("@supabase/supabase-js");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: matches } = await supabase
      .from("matches")
      .select("*, organizations(name, location, type)")
      .eq("challenge_id", id)
      .order("total_score", { ascending: false });

    return NextResponse.json({ matches: matches || [] });
  } catch (error) {
    console.log("Fetch matches error:", error);
    return NextResponse.json({ matches: [] });
  }
}