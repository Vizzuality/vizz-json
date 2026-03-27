import {
  Slide,
  SlideCallout,
  SlideCode,
  SlideHeading,
  SlideText,
} from '../slide-parts'

const FILL_LAYER = `{
  "id": "country-gdp-fill",
  "type": "fill",
  "source": "countries",
  "source-layer": "boundaries",
  "filter": ["==", "$type", "Polygon"],
  "paint": {
    "fill-color": ["interpolate", ["linear"],
      ["get", "gdp_per_capita"],
      1000,  "#f1eef6",
      5000,  "#bdc9e1",
      15000, "#74a9cf",
      30000, "#2b8cbe",
      60000, "#045a8d"
    ],
    "fill-opacity": 0.85
  }
}`

const LINE_LAYER = `{
  "id": "country-gdp-borders",
  "type": "line",
  "source": "countries",
  "source-layer": "boundaries",
  "filter": ["==", "$type", "Polygon"],
  "paint": {
    "line-color": "#1a1a2e",
    "line-width": ["interpolate", ["linear"],
      ["zoom"],
      2, 0.5,
      6, 1.5
    ],
    "line-opacity": 0.6
  }
}`

export function ChoroplethSlide() {
  return (
    <Slide className="items-start">
      <SlideHeading className="mb-4 text-foreground">
        Now make it <span className="text-primary">real</span>
      </SlideHeading>
      <SlideText className="mb-6 text-muted-foreground">
        A choropleth needs two layers for the same data — a fill for the color
        ramp and a line for the borders. Add data-driven expressions, zoom
        interpolation, and filters, and the config doubles in complexity.
      </SlideText>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Fill layer — color ramp
          </p>
          <SlideCode value={FILL_LAYER} />
        </div>

        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Line layer — borders
          </p>
          <SlideCode value={LINE_LAYER} />
        </div>
      </div>

      <SlideCallout>
        Two layers, one dataset. The color stops, border width, and opacity are
        all buried in nested expressions — and none of it is parameterized.
      </SlideCallout>
    </Slide>
  )
}
