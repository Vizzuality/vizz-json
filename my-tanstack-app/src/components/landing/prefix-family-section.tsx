import { Separator } from "#/components/ui/separator";

const PREFIXES = [
  {
    prefix: "@@#params.X",
    description: "Runtime parameter injection",
    example: '"@@#params.opacity" → 0.8',
  },
  {
    prefix: "@@function",
    description: "Named function dispatch",
    example: '"@@function": "setQueryParams" → URL',
  },
  {
    prefix: "@@type",
    description: "Class or React component instantiation",
    example: '"@@type": "ScatterplotLayer" → new()',
  },
  {
    prefix: "@@=",
    description: "Inline expression → function",
    example: '"@@=[lng, lat]" → (d) => [d.lng, d.lat]',
  },
  {
    prefix: "@@#ENUM.X",
    description: "Constant/enum resolution",
    example: '"@@#GL.ONE" → 1',
  },
] as const;

export function PrefixFamilySection() {
  return (
    <section className="w-full bg-slate-950 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <p className="mb-3 text-xs font-semibold tracking-wider uppercase text-purple-400">
          The @@ Prefix Family
        </p>
        <h2 className="text-3xl font-bold text-white mb-12">
          One convention, five capabilities.
        </h2>

        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          {PREFIXES.map((row, index) => (
            <div key={row.prefix}>
              <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center px-6 py-4">
                <code className="font-mono text-sm text-yellow-400 whitespace-nowrap">
                  {row.prefix}
                </code>
                <span className="text-sm text-slate-300">{row.description}</span>
                <code className="font-mono text-xs text-slate-500 text-right whitespace-nowrap hidden sm:block">
                  {row.example}
                </code>
              </div>
              {index < PREFIXES.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
