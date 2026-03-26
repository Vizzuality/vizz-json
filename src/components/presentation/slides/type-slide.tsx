import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const CONFIG = `{
  "@@type": "BasicLegend",
  "items": [{ "label": "Forest", "value": "#22c55e" }]
}`

export function TypeSlide() {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-3 uppercase">
        @@type:
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Component instantiation
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Declare a class or React component by name. The converter instantiates
        it with the surrounding properties as props.
      </SlideText>

      <SlideCode value={CONFIG} />

      <div className="mt-8 flex w-full flex-col items-start gap-3 md:flex-row md:items-center md:gap-6">
        <span className="text-2xl text-muted-foreground">→</span>
        <div className="rounded-lg border border-border bg-card px-6 py-4">
          <p className="mb-2 text-sm font-semibold text-chart-3">
            {'<BasicLegend />'}
          </p>
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded"
              style={{ background: '#22c55e' }}
            />
            <span className="text-sm text-muted-foreground">Forest</span>
          </div>
        </div>
      </div>
    </Slide>
  )
}
