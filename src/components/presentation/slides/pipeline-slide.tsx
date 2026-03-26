import { Step } from '../slide-parts'
import type { SlideProps } from '../slide-types'

const STAGES = [
  {
    label: 'JSON Config',
    desc: 'with @@ prefixes',
    color: 'border-chart-1 bg-chart-1/10',
  },
  {
    label: 'Stage 1',
    desc: 'resolveParams()',
    color: 'border-chart-2 bg-chart-2/10',
  },
  {
    label: 'Stage 2',
    desc: 'JSONConverter',
    color: 'border-chart-3 bg-chart-3/10',
  },
  {
    label: 'Rendered Map',
    desc: 'native objects',
    color: 'border-primary bg-primary/10',
  },
] as const

export function PipelineSlide({ step }: SlideProps) {
  return (
    <div className="slide">
      <h2 className="mb-4 text-foreground">The resolution pipeline</h2>
      <p className="mb-12 text-muted-foreground">
        Two stages. One pass each. No compilation step.
      </p>

      <div className="flex w-full items-center justify-center gap-2">
        {STAGES.map((stage, i) => (
          <Step
            key={stage.label}
            visible={step >= i}
            delay={i * 150}
            className="flex items-center gap-2"
          >
            {i > 0 && (
              <svg
                width="40"
                height="24"
                viewBox="0 0 40 24"
                className="shrink-0"
              >
                <path
                  d="M0 12 L30 12 M24 6 L30 12 L24 18"
                  fill="none"
                  stroke="var(--muted-foreground)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <div
              className={`rounded-lg border-2 px-6 py-5 text-center ${stage.color}`}
            >
              <p
                className="font-semibold text-foreground"
                style={{ fontSize: 'var(--slide-small)' }}
              >
                {stage.label}
              </p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {stage.desc}
              </p>
            </div>
          </Step>
        ))}
      </div>
    </div>
  )
}
