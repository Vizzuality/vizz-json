import {
  Slide,
  SlideCallout,
  SlideCode,
  SlideHeading,
  SlideText,
} from '../slide-parts'

const CIRCLE = `{
  "type": "circle",
  "paint": {
    "circle-radius": 5,
    "circle-color": "#d7191c",
    "circle-opacity": 0.8
  }
}`

const FILL = `{
  "type": "fill",
  "paint": {
    "fill-color": "#2b8cbe",
    "fill-opacity": 0.6,
    "fill-outline-color": "#000"
  }
}`

const LINE = `{
  "type": "line",
  "paint": {
    "line-color": "#fc8d59",
    "line-width": 2,
    "line-dasharray": [2, 4]
  }
}`

export function MultiLayerSlide() {
  return (
    <Slide className="items-start">
      <SlideHeading className="mb-4 text-foreground">
        Now multiply that
      </SlideHeading>
      <SlideText className="mb-6 text-muted-foreground">
        Real maps stack layers. Each type has its own property names and shapes.
      </SlideText>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Circle layer
          </p>
          <SlideCode value={CIRCLE} />
        </div>

        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Fill layer
          </p>
          <SlideCode value={FILL} />
        </div>

        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Line layer
          </p>
          <SlideCode value={LINE} />
        </div>
      </div>

      <SlideCallout>
        circle-radius, fill-color, line-width — every layer type speaks a
        different dialect. No standard way to parameterize them.
      </SlideCallout>
    </Slide>
  )
}
