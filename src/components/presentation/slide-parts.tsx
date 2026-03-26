import { cn } from '#/lib/utils'
import Editor from '@monaco-editor/react'
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

const LINE_HEIGHT = 22
const PADDING = 16
const FONT_SIZE = 15

const EDITOR_OPTIONS = {
  readOnly: true,
  domReadOnly: true,
  minimap: { enabled: false },
  fontSize: FONT_SIZE,
  lineHeight: LINE_HEIGHT,
  lineNumbers: 'off' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  scrollbar: { vertical: 'hidden' as const, horizontal: 'hidden' as const },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  renderLineHighlight: 'none' as const,
  folding: false,
  glyphMargin: false,
  lineDecorationsWidth: PADDING,
  contextmenu: false,
  padding: { top: PADDING, bottom: PADDING },
} as const

type SlideCodeProps = {
  readonly value: string
  readonly className?: string
  readonly language?: string
}

export function SlideCode({
  value,
  className,
  language = 'json',
}: SlideCodeProps) {
  const lineCount = value.split('\n').length
  const height = lineCount * LINE_HEIGHT + PADDING * 2

  return (
    <div
      className={cn('w-full overflow-hidden rounded-lg', className)}
      style={{ height }}
    >
      <Editor
        defaultLanguage={language}
        theme="vs-dark"
        value={value}
        options={EDITOR_OPTIONS}
      />
    </div>
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
