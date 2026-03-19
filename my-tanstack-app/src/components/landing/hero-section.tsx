import { Link } from "@tanstack/react-router";
import { buttonVariants } from "#/components/ui/button";
import { cn } from "#/lib/utils";

export function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-24">
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
        <p className="mb-4 text-xs font-semibold tracking-wider uppercase text-blue-400">
          Vizzuality — Frontend Team
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
          JSON with{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Superpowers
          </span>
        </h1>
        <p className="max-w-2xl text-base sm:text-lg text-slate-400 mb-10 leading-relaxed">
          The <code className="text-blue-300 font-mono">@@</code> convention for
          turning static JSON into dynamic, parameterized configurations —
          library-agnostic, CMS-ready, runtime-resolved.
        </p>
        <Link
          to="/playground"
          className={cn(buttonVariants({ size: "lg" }), "no-underline")}
        >
          Try the Playground →
        </Link>
      </div>
    </section>
  );
}
