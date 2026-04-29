import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const CONFIG = `{
  "source": {
    "type": "raster",
    "tiles": [{
      "@@function": "setQueryParams",
      "url": "https://titiler.example.com/cog/tiles/{z}/{x}/{y}.png",
      "query": {
        "url": "https://data.example.com/raster.tif",
        "expression": "@@#params.expression",
        "colormap_name": "@@#params.colormap",
        "rescale": "@@#params.rescale",
        "nodata": 0
      }
    }],
    "tileSize": 256
  }
}`

export function FunctionSlide() {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-2 uppercase">
        @@function:
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Named function <span className="text-primary">dispatch</span>
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Reference a registered function by name. Ideal for logic that depends on
        external packages or runtime APIs — URL builders, data transforms, auth
        headers — things that plain JSON can never express.
      </SlideText>

      <SlideCode value={CONFIG} />

      <div className="mt-6 rounded-md border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          The <span className="font-mono text-chart-2">tiles</span> array needs
          a dynamic URL — the function appends{' '}
          <span className="font-mono text-chart-2">query</span> params
          (including the COG source URL) to the titiler endpoint.
        </p>
      </div>
    </Slide>
  )
}
