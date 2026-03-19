export function ProblemSection() {
  return (
    <section className="w-full bg-slate-900 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <p className="mb-3 text-xs font-semibold tracking-wider uppercase text-orange-400">
          The Problem
        </p>
        <h2 className="text-3xl font-bold text-white mb-12">
          Static configs don&apos;t scale.
        </h2>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Before */}
          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
            <p className="mb-3 text-sm font-semibold text-red-400 uppercase tracking-wider">
              Before — Static JSON
            </p>
            <pre className="text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <code>{`{
  "type": "fill",
  "paint": {
    "fill-opacity": 0.8,
    "fill-color": "#3b82f6"
  }
}`}</code>
            </pre>
            <p className="mt-4 text-xs text-red-300/80">
              Hardcoded. Need a new API endpoint for every variation.
            </p>
          </div>

          {/* After */}
          <div className="rounded-xl border border-green-900/50 bg-green-950/20 p-6">
            <p className="mb-3 text-sm font-semibold text-green-400 uppercase tracking-wider">
              After — Dynamic JSON
            </p>
            <pre className="text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <code>{`{
  "type": "fill",
  "paint": {
    "fill-opacity": "@@#params.opacity",
    "fill-color": "@@#params.color"
  }
}`}</code>
            </pre>
            <p className="mt-4 text-xs text-green-300/80">
              One config, infinite variations. Resolved at runtime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
