import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const CONFIG = `{
  "circle-radius": "@@=[*, 2, [get, mag]]"
}`

export function ExpressionSlide() {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-4 uppercase">
        @@=[...]
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Inline expressions
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Embed a functional expression directly in the JSON. Parsed at resolution
        time into a callable function.
      </SlideText>

      <SlideCode value={CONFIG} />

      <div className="mt-6 flex w-full flex-col items-start gap-3 md:flex-row md:items-center md:gap-4">
        <span className="text-2xl text-muted-foreground">→</span>
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <p className="font-mono text-sm text-chart-4">
            (feature) =&gt; 2 * feature.properties.mag
          </p>
        </div>
      </div>
    </Slide>
  )
}
