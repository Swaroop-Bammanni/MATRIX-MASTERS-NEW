"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";

interface NavProps {
  userName: string;
  userRole: string;
}

const roleLinks: Record<string, { href: string; label: string }[]> = {
  citizen: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/submit", label: "Report Problem" },
    { href: "/dashboard/explore", label: "Explore" },
    { href: "/dashboard/my-challenges", label: "My Challenges" },
  ],
  university: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/matches", label: "Matches" },
    { href: "/dashboard/solutions", label: "Solutions" },
    { href: "/dashboard/projects", label: "Projects" },
  ],
  industry: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/solutions", label: "Browse Solutions" },
    { href: "/dashboard/contributions", label: "Contributions" },
    { href: "/dashboard/orders", label: "Orders" },
  ],
  admin: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/verify", label: "Verify" },
    { href: "/dashboard/csr-fund", label: "CSR Fund" },
    { href: "/dashboard/analytics", label: "Analytics" },
  ],
};

const roleBadgeColors: Record<string, string> = {
  citizen: "bg-green-100 text-green-800",
  university: "bg-blue-100 text-blue-800",
  industry: "bg-purple-100 text-purple-800",
  admin: "bg-red-100 text-red-800",
};

export default function DashboardNav({ userName, userRole }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const links = roleLinks[userRole] || roleLinks.citizen;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="font-bold text-xl text-slate-900"
          >
            SolveBridge
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={roleBadgeColors[userRole] || "bg-slate-100"}>
            {userRole.toUpperCase()}
          </Badge>
          <span className="text-sm text-slate-600 hidden md:block">
            {userName}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}