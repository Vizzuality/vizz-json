import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const CONFIG = `{
  "@@type": "HexagonLayer",
  "data": [
    { "lat": 0, "lng": 0 },
    { "lat": 0, "lng": 0 },
    { "lat": 0, "lng": 0 },
    { "lat": 1.2, "lng": 1.2 },
    { "lat": 1.2, "lng": 1.2 },
    { "lat": 1.2, "lng": 1.2 }
  ],
  "getPosition": "@@=[lng, lat]"
}`

export function ExpressionSlide() {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-4 uppercase">
        @@=[...]
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Inline <span className="text-primary">expressions</span>
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Embed inline JavaScript expressions directly in the JSON. Each{' '}
        <code className="font-mono text-chart-4">@@=</code> string becomes an
        accessor function — extract coordinates, compute colors, or apply
        conditional logic without leaving the config.
      </SlideText>

      <SlideCode value={CONFIG} />

      <div className="mt-6 rounded-md border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Each <span className="font-mono text-chart-4">@@=</span> value is
          compiled into{' '}
          <span className="font-mono text-chart-4">
            (datum) =&gt; datum.lng, datum.lat
          </span>{' '}
          — a real accessor function at runtime.
        </p>
      </div>
    </Slide>
  )
}
