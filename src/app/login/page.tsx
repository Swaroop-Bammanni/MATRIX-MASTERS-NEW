"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("citizen");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Helper for quick demo login
  const handleQuickDemoLogin = async (
    demoEmail: string,
    demoPass: string,
    demoName: string,
    demoRole: string,
    demoOrgId?: string
  ) => {
    setLoading(true);
    setError("");

    try {
      // 1. Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPass,
      });

      // 2. If user doesn't exist yet, automatically create it
      if (signInError) {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: demoEmail,
            password: demoPass,
            options: {
              data: { full_name: demoName, role: demoRole },
            },
          });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          await supabase.from("users").upsert({
            id: signUpData.user.id,
            email: demoEmail,
            full_name: demoName,
            role: demoRole,
            organization_id: demoOrgId || null,
          });
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Demo login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: name.trim(),
              role: role,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          await supabase.from("users").upsert({
            id: data.user.id,
            email: email.trim(),
            full_name: name.trim(),
            role: role,
          });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (signInError) throw signInError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignup ? "Create Account" : "SolveBridge Sign In"}
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">SIH26043 — Matrix Masters</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Demo Logins for Hackathon Presentations */}
          <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2 text-center">
              ⚡ 1-CLICK DEMO ACCOUNTS (FOR JUDGES & TESTING)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-white text-green-700 hover:bg-green-50"
                disabled={loading}
                onClick={() =>
                  handleQuickDemoLogin(
                    "citizen@solvebridge.in",
                    "demo123456",
                    "Ramesh Kumar (Citizen)",
                    "citizen"
                  )
                }
              >
                👤 Citizen
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-white text-blue-700 hover:bg-blue-50"
                disabled={loading}
                onClick={() =>
                  handleQuickDemoLogin(
                    "nitbhopal@solvebridge.in",
                    "demo123456",
                    "Prof. Sharma (NIT Bhopal)",
                    "university",
                    "a1111111-1111-1111-1111-111111111111"
                  )
                }
              >
                🎓 University
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-white text-purple-700 hover:bg-purple-50"
                disabled={loading}
                onClick={() =>
                  handleQuickDemoLogin(
                    "geospatial@solvebridge.in",
                    "demo123456",
                    "Anita Roy (GeoSpatial Pvt Ltd)",
                    "industry",
                    "b1111111-1111-1111-1111-111111111111"
                  )
                }
              >
                🏭 Industry
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-white text-red-700 hover:bg-red-50"
                disabled={loading}
                onClick={() =>
                  handleQuickDemoLogin(
                    "admin@solvebridge.gov.in",
                    "demo123456",
                    "Dr. Verma (Govt Admin)",
                    "admin"
                  )
                }
              >
                🏛️ Govt Admin
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">
                Or enter credentials
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignup && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value || "")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">Citizen / Public</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                      <SelectItem value="industry">Industry</SelectItem>
                      <SelectItem value="admin">Government Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Processing..."
                : isSignup
                ? "Create Account"
                : "Sign In"}
            </Button>

            <p className="text-center text-xs text-slate-500 pt-1">
              {isSignup ? "Already have an account?" : "Need a new account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError("");
                }}
                className="text-blue-600 underline font-medium"
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}