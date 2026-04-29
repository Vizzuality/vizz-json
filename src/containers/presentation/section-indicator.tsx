import { useEffect, useRef, useState } from 'react'
import { ACTS, getCurrentAct } from './slide-registry'

type SectionIndicatorProps = {
  readonly slide: number
}

export function SectionIndicator({ slide }: SectionIndicatorProps) {
  const currentAct = getCurrentAct(slide)
  const prevActIdRef = useRef<string | undefined>(currentAct?.id)
  const [ghostActId, setGhostActId] = useState<string | null>(null)

  useEffect(() => {
    if (!currentAct) return
    if (currentAct.id === prevActIdRef.current) return

    prevActIdRef.current = currentAct.id
    setGhostActId(currentAct.id)
  }, [currentAct])

  return (
    <nav className="fixed top-5 left-1/2 z-50 -translate-x-1/2 md:top-7">
      <ol className="flex items-center gap-0">
        {ACTS.map((act, index) => {
          const isActive = currentAct?.id === act.id
          const isPast = currentAct
            ? act.endSlide < currentAct.startSlide
            : false

          return (
            <li key={act.id} className="flex items-center">
              {/* Connector line */}
              {index > 0 && (
                <div className="relative h-px w-6 md:w-10">
                  <div className="absolute inset-0 bg-muted-foreground/15" />
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/60 transition-all duration-700 ease-out"
                    style={{
                      width: isPast || isActive ? '100%' : '0%',
                      boxShadow:
                        isPast || isActive
                          ? '0 0 6px hsl(var(--primary) / 0.4)'
                          : 'none',
                    }}
                  />
                </div>
              )}

              {/* Label with ghost clone */}
              <span className="relative flex items-center justify-center">
                <span
                  className="whitespace-nowrap px-4 py-2 text-sm tracking-wide transition-all duration-500 md:px-5 md:py-2.5 md:text-base"
                  style={
                    isActive
                      ? {
                          background:
                            'linear-gradient(to right, var(--primary), oklch(0.72 0.2 250))',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }
                      : {
                          color: isPast
                            ? 'hsl(var(--muted-foreground) / 0.6)'
                            : 'hsl(var(--muted-foreground) / 0.3)',
                        }
                  }
                >
                  {act.label}
                </span>
                {/* Ghost — scales up from center and fades on section change */}
                {ghostActId === act.id && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex animate-ping items-center justify-center whitespace-nowrap text-sm tracking-wide md:text-base"
                    style={{
                      background:
                        'linear-gradient(to right, var(--primary), oklch(0.72 0.2 250))',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      transformOrigin: 'center center',
                      animationIterationCount: 1,
                      animationDuration: '800ms',
                      animationFillMode: 'forwards',
                    }}
                    onAnimationEnd={() => setGhostActId(null)}
                  >
                    {act.label}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
