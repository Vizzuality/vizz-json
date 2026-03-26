import { cn } from '#/lib/utils'
import type { ReactNode } from 'react'

type SlideProps = {
  readonly children: ReactNode
  readonly className?: string
}

export function Slide({ children, className }: SlideProps) {
  return (
    <div
      className={cn(
        'mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-[4vw] py-[4vh] md:px-[6vw] md:py-[8vh]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SlideTitle({ children, className }: SlideProps) {
  return (
    <h1
      className={cn(
        'text-[clamp(1.75rem,4vw,4.5rem)] font-bold leading-[1.15] tracking-[-0.02em]',
        className,
      )}
    >
      {children}
    </h1>
  )
}

export function SlideHeading({ children, className }: SlideProps) {
  return (
    <h2
      className={cn(
        'text-[clamp(1.75rem,3vw,3rem)] font-bold leading-[1.2]',
        className,
      )}
    >
      {children}
    </h2>
  )
}

export function SlideText({ children, className }: SlideProps) {
  return (
    <p
      className={cn(
        'text-[clamp(1rem,1.8vw,2rem)] leading-[1.6]',
        className,
      )}
    >
      {children}
    </p>
  )
}

type StepComponentProps = {
  readonly visible: boolean
  readonly children: ReactNode
  readonly className?: string
  readonly delay?: number
  readonly inline?: boolean
}

export function Step({
  visible,
  children,
  className,
  delay = 0,
  inline = false,
}: StepComponentProps) {
  const Tag = inline ? 'span' : 'div'
  const visibilityClasses = inline
    ? visible
      ? 'opacity-100 transition-opacity duration-300 ease-out'
      : 'opacity-0'
    : visible
      ? 'opacity-100 translate-y-0 transition-[opacity,transform] duration-[400ms] ease-out'
      : 'opacity-0 translate-y-3'

  return (
    <Tag
      className={cn(visibilityClasses, className)}
      style={visible ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}

type CodeBlockProps = {
  readonly children: ReactNode
  readonly className?: string
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  return (
    <pre
      className={cn(
        'w-full overflow-x-auto rounded-lg bg-[oklch(0.145_0.008_326)] p-[clamp(1rem,2vw,2.5rem)] font-mono text-[length:clamp(0.8rem,1.5vw,1.75rem)] leading-[1.7] text-[oklch(0.985_0_0)]',
        className,
      )}
    >
      {children}
    </pre>
  )
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
