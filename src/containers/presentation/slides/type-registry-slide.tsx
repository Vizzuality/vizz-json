import { Slide, SlideCode, SlideHeading, SlideText } from '../slide-parts'

const COMPONENT_CODE = `// choropleth-legend.tsx
export function ChoroplethLegend({ items }) {
  return (
    <div>
      <ColorBar items={items} />
      <Labels items={items} />
    </div>
  )
}`

const CONVERTER_CODE = `// converter-config.ts
import { ChoroplethLegend } from './legends/choropleth-legend'
import { BasicLegend } from './legends/basic-legend'

export function createConverter() {
  return createVizzJson({
    components: { ChoroplethLegend, BasicLegend },
    functions: { ...registeredFunctions },
  })
}`

export function TypeRegistrySlide() {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-3 uppercase">
        @@type:
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Registering <span className="text-primary">custom</span> components
      </SlideHeading>
      <SlideText className="mb-6 text-muted-foreground">
        Build a React component, register it by name in the converter, and the
        JSON can instantiate it. The surrounding keys become props — no glue
        code, no imperative wiring.
      </SlideText>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Define the component
          </p>
          <SlideCode value={COMPONENT_CODE} language="typescript" />
        </div>
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Register in the converter
          </p>
          <SlideCode value={CONVERTER_CODE} language="typescript" />
        </div>
      </div>
    </Slide>
  )
}
