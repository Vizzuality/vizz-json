import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const CONFIG = `{
  "@@type": "ChoroplethLegend",
  "items": [
    { "label": "Low",    "value": "#f1eef6" },
    { "label": "Medium", "value": "#74a9cf" },
    { "label": "High",   "value": "#045a8d" }
  ]
}`

export function TypeSlide() {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-3 uppercase">
        @@type:
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Component <span className="text-primary">instantiation</span>
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Declare a React component or deck.gl layer class by name. The converter
        instantiates it with the surrounding properties as props — turning
        plain JSON into live, interactive UI without any imperative code.
      </SlideText>

      <SlideCode value={CONFIG} />

      <div className="mt-8 flex w-full flex-col items-start gap-3 md:flex-row md:items-center md:gap-6">
        <div className="w-full max-w-xs rounded-lg border border-border bg-card px-6 py-4">
          <p className="mb-3 text-sm font-semibold text-chart-3">
            {'<ChoroplethLegend />'}
          </p>
          <div className="flex h-4 w-full overflow-hidden rounded-sm">
            <div className="flex-1" style={{ background: '#f1eef6' }} />
            <div className="flex-1" style={{ background: '#74a9cf' }} />
            <div className="flex-1" style={{ background: '#045a8d' }} />
          </div>
          <div className="mt-1 flex">
            <span className="flex-1 text-center text-[10px] text-muted-foreground">
              Low
            </span>
            <span className="flex-1 text-center text-[10px] text-muted-foreground">
              Medium
            </span>
            <span className="flex-1 text-center text-[10px] text-muted-foreground">
              High
            </span>
          </div>
        </div>
      </div>
    </Slide>
  )
}
