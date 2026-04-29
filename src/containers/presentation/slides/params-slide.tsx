import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const CONFIG = `{
  "paint": {
    "raster-opacity": "@@#params.opacity"
  }
}`

const RESOLVED = `"raster-opacity": 0.75`

export function ParamsSlide() {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-1 uppercase">
        @@#params.X
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Runtime parameter <span className="text-primary">injection</span>
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Place a named parameter reference anywhere in the JSON. At resolution
        time, the placeholder is swapped for the real value — a number, color,
        boolean, or any type the UI control provides.
      </SlideText>

      <SlideCode value={CONFIG} />

      <div className="mt-6 flex w-full flex-col gap-4 md:flex-row md:items-center">
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            params = {'{ '}
            <span className="font-mono text-primary">opacity: 0.75</span>
            {' }'}
          </p>
        </div>
        <SlideCode value={RESOLVED} className="md:flex-1" />
      </div>
    </Slide>
  )
}
