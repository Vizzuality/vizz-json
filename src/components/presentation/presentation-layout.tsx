import type { ReactNode } from 'react'
import './presentation.css'

type PresentationLayoutProps = {
  readonly children: ReactNode
  readonly slide: number
  readonly totalSlides: number
  readonly progress: number
}

export function PresentationLayout({
  children,
  slide,
  totalSlides,
  progress,
}: PresentationLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="fixed top-0 left-0 z-50 h-0.5 bg-primary transition-[width] duration-300 ease-out"
        style={{ width: `${progress * 100}%` }}
      />

      <main
        className="animate-in fade-in-0 slide-in-from-bottom-5 duration-300"
        key={slide}
      >
        {children}
      </main>

      <div className="fixed bottom-4 left-4 z-50 text-xs tabular-nums text-muted-foreground md:bottom-8 md:left-8 md:text-sm">
        {slide + 1} / {totalSlides}
      </div>
    </div>
  )
}
