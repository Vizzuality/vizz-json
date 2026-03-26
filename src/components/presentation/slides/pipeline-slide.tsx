import { cn } from '#/lib/utils'
import { Slide, SlideHeading, SlideText } from '../slide-parts'

const STAGES = [
  {
    label: 'JSON Config',
    desc: 'with @@ prefixes',
    detail: 'Raw config with @@#params, @@function, @@type, and @@= directives',
    color: 'border-chart-1 bg-chart-1/10',
  },
  {
    label: 'resolveConfig(config, params)',
    desc: '',
    detail: '',
    color: 'border-chart-2 bg-chart-2/10',
  },
  {
    label: 'Resolved JSON',
    desc: 'native objects & callables',
    detail: '',
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
        The resolution <span className="text-primary">pipeline</span>
      </SlideHeading>
      <SlideText className="mb-12 text-muted-foreground">
        One function, two stages.{' '}
        <code className="font-mono">resolveConfig(config, params)</code> first
        merges params_config defaults with the app's current settings, then
        passes the result to the converter for @@function, @@type, and @@=
        resolution.
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
                'w-full rounded-lg border-2 px-6 py-5 text-center lg:h-56 lg:w-80 lg:px-8 lg:py-7',
                stage.color,
              )}
            >
              <p className="text-[clamp(1rem,1.6vw,1.5rem)] font-semibold text-foreground">
                {stage.label}
              </p>
              {stage.desc && (
                <p className="mt-2 font-mono text-[clamp(0.8rem,1.2vw,1.1rem)] text-muted-foreground">
                  {stage.desc}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Slide>
  )
}
