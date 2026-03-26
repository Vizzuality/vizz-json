import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const BEFORE = `"drawMode": "@@#GL.POINTS"`

const AFTER = `"drawMode": 0  // GL.POINTS === 0`

export function EnumSlide() {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-5 uppercase">
        @@#ENUM.X
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Constant resolution
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Reference named constants from an enum registry. Commonly used for WebGL
        constants that deck.gl expects as numeric values.
      </SlideText>

      <div className="flex w-full flex-col items-stretch gap-4 md:flex-row md:items-center md:gap-6">
        <SlideCode value={BEFORE} className="md:flex-1" />
        <span className="text-2xl text-muted-foreground">→</span>
        <SlideCode value={AFTER} className="md:flex-1" />
      </div>
    </Slide>
  )
}
