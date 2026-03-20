import { Badge } from '#/components/ui/badge'
import { Separator } from '#/components/ui/separator'

const PREFIXES = [
  {
    prefix: '@@#params.X',
    description: 'Runtime parameter injection',
    example: '"raster-opacity": "@@#params.opacity"',
    colorClass: 'text-chart-1',
  },
  {
    prefix: '@@function:',
    description: 'Named function dispatch',
    example: '"@@function:setQueryParams"',
    colorClass: 'text-chart-2',
  },
  {
    prefix: '@@type:',
    description: 'Class or React component instantiation',
    example: '"@@type": "ScatterplotLayer"',
    colorClass: 'text-chart-3',
  },
  {
    prefix: '@@=[...]',
    description: 'Inline expression → function',
    example: '"@@=[case, [">", ...], ...]"',
    colorClass: 'text-chart-4',
  },
  {
    prefix: '@@#ENUM.X',
    description: 'Constant/enum resolution',
    example: '"@@#GL.POINTS"',
    colorClass: 'text-chart-5',
  },
] as const

export function PrefixFamilySection() {
  return (
    <section className="w-full landing-bg py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Badge variant="secondary" className="mb-3">
          The @@ Prefix Family
        </Badge>
        <h2 className="mb-12 text-3xl font-bold text-foreground">
          One convention, five capabilities.
        </h2>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {PREFIXES.map((row, index) => (
            <div key={row.prefix}>
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4">
                <code
                  className={`whitespace-nowrap font-mono text-sm font-semibold ${row.colorClass}`}
                >
                  {row.prefix}
                </code>
                <span className="text-sm text-muted-foreground">
                  {row.description}
                </span>
                <code className="hidden whitespace-nowrap text-right font-mono text-xs text-muted-foreground sm:block">
                  {row.example}
                </code>
              </div>
              {index < PREFIXES.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
