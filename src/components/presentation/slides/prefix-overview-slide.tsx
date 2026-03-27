import { cn } from '#/lib/utils'
import { Slide, SlideHeading, SlideText } from '../slide-parts'

const PREFIXES = [
  {
    prefix: '@@#params.X',
    desc: 'Runtime parameter injection',
    color: 'text-chart-1',
  },
  {
    prefix: '@@function:',
    desc: 'Named function dispatch',
    color: 'text-chart-2',
  },
  {
    prefix: '@@type:',
    desc: 'Class or React component instantiation',
    color: 'text-chart-3',
  },
  {
    prefix: '@@=[...]',
    desc: 'Inline expression → function',
    color: 'text-chart-4',
  },
] as const

export function PrefixOverviewSlide() {
  return (
    <Slide className="items-start">
      <SlideHeading className="mb-4 text-foreground">
        The <code className="font-mono text-primary">@@</code> family
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        One convention, four capabilities. Every string starting with{' '}
        <code className="font-mono text-primary">@@</code> is a directive that
        the resolver knows how to handle — parameters, functions, types, and
        expressions.
      </SlideText>

      <div className="w-full overflow-hidden rounded-lg border border-border bg-card">
        {PREFIXES.map((row, i) => (
          <div key={row.prefix}>
            <div className="flex items-center gap-3 px-4 py-3 md:gap-6 md:px-8 md:py-5">
              <code
                className={cn(
                  'whitespace-nowrap font-mono text-[length:clamp(0.8rem,1.5vw,1.75rem)] font-semibold',
                  row.color,
                )}
              >
                {row.prefix}
              </code>
              <span className="text-[clamp(1rem,1.8vw,2rem)] leading-[1.6] text-muted-foreground">
                {row.desc}
              </span>
            </div>
            {i < PREFIXES.length - 1 && (
              <div className="mx-3 border-t border-border md:mx-6" />
            )}
          </div>
        ))}
      </div>
    </Slide>
  )
}
