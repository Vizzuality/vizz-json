import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

const CONSUMERS = [
  {
    name: "MapLibre",
    detail: "Vector + Raster",
    symbol: "GL",
  },
  {
    name: "deck.gl",
    detail: "WebGL layers",
    symbol: "D",
  },
  {
    name: "Charts",
    detail: "Vega-Lite, etc.",
    symbol: "C",
  },
  {
    name: "Any JSON",
    detail: "Generic configs",
    symbol: "{}",
  },
] as const;

export function WorksWithSection() {
  return (
    <section className="w-full bg-slate-950 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <p className="mb-3 text-xs font-semibold tracking-wider uppercase text-cyan-400">
          Works With Everything
        </p>
        <h2 className="text-3xl font-bold text-white mb-12">
          If it consumes JSON, it works.
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CONSUMERS.map((item) => (
            <Card
              key={item.name}
              className="bg-slate-800 border-slate-700 ring-slate-700"
            >
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center mb-2">
                  <span className="text-sm font-mono font-bold text-slate-300">
                    {item.symbol}
                  </span>
                </div>
                <CardTitle className="text-white text-sm">{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
