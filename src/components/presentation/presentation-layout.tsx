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
    <div className="presentation relative min-h-screen overflow-hidden bg-background">
      <div
        className="presentation-progress"
        style={{ width: `${progress * 100}%` }}
      />

      <main className="slide-enter" key={slide}>
        {children}
      </main>

      <div className="slide-counter">
        {slide + 1} / {totalSlides}
      </div>
    </div>
  )
}
