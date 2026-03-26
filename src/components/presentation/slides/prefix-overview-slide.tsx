import { Step } from '../slide-parts'
import type { SlideProps } from '../slide-types'

const PREFIXES = [
  { prefix: '@@#params.X', desc: 'Runtime parameter injection', color: 'text-chart-1' },
  { prefix: '@@function:', desc: 'Named function dispatch', color: 'text-chart-2' },
  { prefix: '@@type:', desc: 'Class or React component instantiation', color: 'text-chart-3' },
  { prefix: '@@=[...]', desc: 'Inline expression → function', color: 'text-chart-4' },
  { prefix: '@@#ENUM.X', desc: 'Constant/enum resolution', color: 'text-chart-5' },
] as const

export function PrefixOverviewSlide({ step }: SlideProps) {
  return (
    <div className="slide items-start">
      <h2 className="mb-4 text-foreground">
        The <code className="text-primary">@@</code> family
      </h2>
      <p className="mb-10 text-muted-foreground">One convention, five capabilities.</p>

      <div className="w-full overflow-hidden rounded-lg border border-border bg-card">
        {PREFIXES.map((row, i) => (
          <Step key={row.prefix} visible={step >= i} delay={i * 100}>
            <div className="flex items-center gap-6 px-8 py-5">
              <code
                className={`whitespace-nowrap font-mono font-semibold ${row.color}`}
                style={{ fontSize: 'var(--slide-code)' }}
              >
                {row.prefix}
              </code>
              <span className="text-muted-foreground" style={{ fontSize: 'var(--slide-body)' }}>
                {row.desc}
              </span>
            </div>
            {i < PREFIXES.length - 1 && <div className="mx-6 border-t border-border" />}
          </Step>
        ))}
      </div>
    </div>
  )
}
