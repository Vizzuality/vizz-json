interface Step {
  label: string;
  sublabel: string;
  borderColor: string;
  textColor: string;
  emphasized?: boolean;
}

const STEPS: Step[] = [
  {
    label: "CMS / API",
    sublabel: "Static JSON",
    borderColor: "border-green-600",
    textColor: "text-green-400",
  },
  {
    label: "@@ Placeholders",
    sublabel: "+ params[]",
    borderColor: "border-purple-600",
    textColor: "text-purple-400",
  },
  {
    label: "json-converter",
    sublabel: "Recursive resolve",
    borderColor: "border-blue-500",
    textColor: "text-blue-400",
    emphasized: true,
  },
  {
    label: "Plain JS Objects",
    sublabel: "Fully resolved",
    borderColor: "border-yellow-600",
    textColor: "text-yellow-400",
  },
  {
    label: "ANY Consumer",
    sublabel: "MapLibre, deck.gl, ...",
    borderColor: "border-cyan-600",
    textColor: "text-cyan-400",
  },
];

export function HowItWorksSection() {
  return (
    <section className="w-full bg-slate-900 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <p className="mb-3 text-xs font-semibold tracking-wider uppercase text-blue-400">
          How It Works
        </p>
        <h2 className="text-3xl font-bold text-white mb-12">
          A single recursive pass.
        </h2>

        {/* Desktop: horizontal flow */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap justify-center">
          {STEPS.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className={`rounded-lg border ${step.borderColor} ${step.emphasized ? "bg-blue-950/40 ring-1 ring-blue-500/30" : "bg-slate-800"} px-4 py-3 text-center min-w-[120px]`}
              >
                <p className={`text-sm font-semibold ${step.textColor}`}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{step.sublabel}</p>
              </div>
              {index < STEPS.length - 1 && (
                <span className="text-slate-500 text-lg font-light">→</span>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical flow */}
        <div className="flex sm:hidden flex-col items-center gap-2">
          {STEPS.map((step, index) => (
            <div
              key={step.label}
              className="flex flex-col items-center gap-2 w-full max-w-xs"
            >
              <div
                className={`w-full rounded-lg border ${step.borderColor} ${step.emphasized ? "bg-blue-950/40 ring-1 ring-blue-500/30" : "bg-slate-800"} px-4 py-3 text-center`}
              >
                <p className={`text-sm font-semibold ${step.textColor}`}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{step.sublabel}</p>
              </div>
              {index < STEPS.length - 1 && (
                <span className="text-slate-500 text-lg font-light">↓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
