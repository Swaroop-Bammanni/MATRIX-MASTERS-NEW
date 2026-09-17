import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || "User",
      role: user.user_metadata?.role || "citizen",
    };
  }

  return profile;
}