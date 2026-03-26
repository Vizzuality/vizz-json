import type { SlideProps } from '../slide-types'

export function TitleSlide(_props: SlideProps) {
  return (
    <div className="slide text-center">
      <p className="mb-6 text-sm tracking-widest text-muted-foreground uppercase">
        Vizzuality
      </p>
      <h1 className="mb-6 text-foreground">
        Vizz<span className="text-primary">Json</span>
      </h1>
      <p className="text-muted-foreground" style={{ fontSize: 'var(--slide-body)' }}>
        JSON with <code className="text-primary font-mono">@@</code> Superpowers
      </p>
      <div className="mt-16 text-sm text-muted-foreground/60">
        <p>Miguel Barrenechea</p>
        <p>March 2026</p>
      </div>
    </div>
  )
}
