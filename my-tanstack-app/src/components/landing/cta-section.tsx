import { Link } from "@tanstack/react-router";
import { buttonVariants } from "#/components/ui/button";
import { cn } from "#/lib/utils";

export function CtaSection() {
  return (
    <section className="w-full bg-slate-900 py-24">
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
        <Link
          to="/playground"
          className={cn(buttonVariants({ size: "lg" }), "no-underline")}
        >
          Open the Playground →
        </Link>
        <p className="mt-4 text-sm text-slate-500">
          Edit JSON. Tweak params. See it resolve live.
        </p>
      </div>
    </section>
  );
}
