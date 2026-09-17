import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">SolveBridge</h1>
        <Link href="/login">
          <Button>Get Started</Button>
        </Link>
      </nav>

      <section className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Real problems deserve the right people to solve them.
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
          Submit a societal challenge. Our AI understands it, matches it
          with universities and industry, and tracks the solution to real
          impact.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">Report a Problem</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Explore Challenges
            </Button>
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-slate-400">
        SolveBridge — SIH26043 | Matrix Masters
      </footer>
    </div>
  );
}