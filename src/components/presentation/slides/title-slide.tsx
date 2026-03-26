import { Slide, SlideTitle, SlideText } from '../slide-parts'

export function TitleSlide() {
  return (
    <Slide className="text-center">
      <p className="mb-6 text-sm tracking-widest text-muted-foreground uppercase">
        Vizzuality
      </p>
      <SlideTitle className="mb-6 text-foreground">
        Vizz<span className="text-primary">Json</span>
      </SlideTitle>
      <SlideText className="text-muted-foreground">
        JSON with <code className="font-mono text-primary">@@</code>{' '}
        Superpowers
      </SlideText>
      <div className="mt-16 text-sm text-muted-foreground/60">
        <p>Miguel Barrenechea</p>
        <p>March 2026</p>
      </div>
    </Slide>
  )
}
