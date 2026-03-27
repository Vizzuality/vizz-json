import { Link } from '@tanstack/react-router'
import { Slide, SlideTitle, SlideText } from '../slide-parts'

export function CtaSlide() {
  return (
    <Slide className="text-center">
      <SlideTitle className="mb-6 text-foreground">
        Try it <span className="text-primary">yourself</span>
      </SlideTitle>
      <SlideText className="mb-12 text-muted-foreground">
        Open the playground, pick an example, and tweak the parameters live.
      </SlideText>
      <Link
        to="/playground"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Open Playground →
      </Link>
    </Slide>
  )
}
