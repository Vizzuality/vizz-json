import { cn } from '#/lib/utils'
import type { ReactNode } from 'react'

type StepProps = {
  readonly visible: boolean
  readonly children: ReactNode
  readonly className?: string
  readonly delay?: number
}

export function Step({ visible, children, className, delay = 0 }: StepProps) {
  return (
    <div
      className={cn(visible ? 'step-visible' : 'step-hidden', className)}
      style={visible ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

type CodeBlockProps = {
  readonly children: ReactNode
  readonly className?: string
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  return <pre className={cn('slide-code-block', className)}>{children}</pre>
}

type SlideAccentProps = {
  readonly color: string
  readonly children: ReactNode
}

export function SlideAccent({ color, children }: SlideAccentProps) {
  return (
    <span className={cn('font-mono font-semibold', color)}>{children}</span>
  )
}
