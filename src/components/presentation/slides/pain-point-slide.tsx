import {
  Slide,
  SlideCallout,
  SlideCode,
  SlideHeading,
  SlideText,
} from '../slide-parts'

const LAYER_JSON = `{
  "id": "deforestation-alerts",
  "type": "circle",
  "source": "alerts-source",
  "source-layer": "alerts_2024",
  "filter": ["all",
    [">=", "confidence", 80],
    ["==", "alert_type", "DEFOR"]
  ],
  "paint": {
    "circle-radius": 5,
    "circle-color": "#d7191c",
    "circle-opacity": 0.8,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff"
  },
  "layout": {
    "visibility": "visible"
  }
}`

export function PainPointSlide() {
  return (
    <Slide className="items-start">
      <SlideHeading className="mb-4 text-foreground">
        A single layer
      </SlideHeading>
      <SlideText className="mb-6 text-muted-foreground">
        Even one MapLibre/Mapbox layer is a wall of config. Paint, layout,
        filters, source — all interleaved.
      </SlideText>

      <SlideCode value={LAYER_JSON} />

      <SlideCallout>
        Filters, paint properties, layout — all hardcoded. Which values should a
        user be able to tweak?
      </SlideCallout>
    </Slide>
  )
}
