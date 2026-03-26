import { Step } from '../slide-parts'
import type { SlideProps } from '../slide-types'

const TAKEAWAYS = [
  { title: 'JSON as a config language', desc: 'Declarative map configurations without imperative code' },
  { title: 'The @@ prefix convention', desc: 'Five prefixes covering params, functions, types, expressions, and constants' },
  { title: 'Two-stage resolution pipeline', desc: 'Params first, then deck.gl converter — clean separation of concerns' },
  { title: 'Immutable by design', desc: 'Original config never mutated — safe to re-resolve with different params' },
] as const

export function RecapSlide({ step }: SlideProps) {
  return (
    <div className="slide items-start">
      <h2 className="mb-10 text-foreground">Key takeaways</h2>

      <div className="flex w-full flex-col gap-6">
        {TAKEAWAYS.map((item, i) => (
          <Step key={item.title} visible={step >= i} delay={i * 100}>
            <div className="flex items-start gap-4">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-foreground" style={{ fontSize: 'var(--slide-body)' }}>
                  {item.title}
                </p>
                <p className="mt-1 text-muted-foreground" style={{ fontSize: 'var(--slide-small)' }}>
                  {item.desc}
                </p>
              </div>
            </div>
          </Step>
        ))}
      </div>
    </div>
  )
}
