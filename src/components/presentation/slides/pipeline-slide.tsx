import { cn } from '#/lib/utils'
import { Slide, SlideHeading, SlideText } from '../slide-parts'

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

function ArrowDown() {
  return (
    <svg
      className="shrink-0 lg:hidden"
      width="24"
      height="32"
      viewBox="0 0 24 32"
    >
      <path
        d="M12 0 L12 22 M6 16 L12 22 L18 16"
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg
      className="hidden shrink-0 lg:block"
      width="40"
      height="24"
      viewBox="0 0 40 24"
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
  )
}

export function PipelineSlide() {
  return (
    <Slide>
      <SlideHeading className="mb-4 text-foreground">
        The resolution pipeline
      </SlideHeading>
      <SlideText className="mb-12 text-muted-foreground">
        Two stages. One pass each. No compilation step.
      </SlideText>

      <div className="flex w-full flex-col items-center gap-3 lg:flex-row lg:justify-center lg:gap-2">
        {STAGES.map((stage, i) => (
          <div
            key={stage.label}
            className="flex flex-col items-center gap-2 lg:flex-row"
          >
            {i > 0 && (
              <>
                <ArrowDown />
                <ArrowRight />
              </>
            )}
            <div
              className={cn(
                'rounded-lg border-2 px-4 py-3 text-center lg:px-6 lg:py-5',
                stage.color,
              )}
            >
              <p className="text-[clamp(0.75rem,1.2vw,1.1rem)] font-semibold text-foreground">
                {stage.label}
              </p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {stage.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  )
}
