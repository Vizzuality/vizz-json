import { createFileRoute } from '@tanstack/react-router'
import { SectionHeader } from '#/components/guidelines/section-header'
import { CodeBlock } from '#/components/guidelines/code-block'
import { InteractiveExample } from '#/components/guidelines/interactive-example'
import { Callout } from '#/components/guidelines/callout'

export const Route = createFileRoute('/guidelines/types')({
  component: GuidelinesTypes,
})

function GuidelinesTypes() {
  return (
    <div>
      <SectionHeader
        title="@@type: — Class Instantiation"
        description="Instantiate deck.gl layers and React components directly from JSON."
        syntax='"@@type": "ClassName"'
      />

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          How it works
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          When the converter encounters an object with an{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            @@type
          </code>{' '}
          key, it looks up the class in the registry and instantiates it. All
          sibling keys in the same object become constructor props.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Syntax</h2>
        <CodeBlock
          title="Layer instantiation"
          value={{
            '@@type': 'ScatterplotLayer',
            id: 'earthquakes',
            data: 'https://example.com/data.geojson',
            getPosition: '@@=geometry.coordinates',
            getRadius: 5000,
            getFillColor: [239, 68, 68],
          }}
        />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Registered types
        </h2>

        <h3 className="mb-2 mt-4 text-lg font-semibold text-foreground">
          deck.gl Layers
        </h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Class</th>
                <th className="px-4 py-2 text-left font-medium">Package</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="px-4 py-2 font-mono">ScatterplotLayer</td>
                <td className="px-4 py-2">@deck.gl/layers</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 font-mono">ColumnLayer</td>
                <td className="px-4 py-2">@deck.gl/layers</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono">GeoJsonLayer</td>
                <td className="px-4 py-2">@deck.gl/layers</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="mb-2 mt-6 text-lg font-semibold text-foreground">
          React Components
        </h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Component</th>
                <th className="px-4 py-2 text-left font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="px-4 py-2 font-mono">BasicLegend</td>
                <td className="px-4 py-2">Simple color + label list</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 font-mono">ChoroplethLegend</td>
                <td className="px-4 py-2">Color ramps with boundaries</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono">GradientLegend</td>
                <td className="px-4 py-2">Continuous color gradient</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Examples
        </h2>

        <InteractiveExample
          title="ScatterplotLayer"
          description="A deck.gl scatterplot with parameterized radius and color."
          config={{
            '@@type': 'ScatterplotLayer',
            id: 'earthquakes',
            data: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson',
            getPosition: '@@=geometry.coordinates',
            getRadius: '@@#params.radius',
            getFillColor: '@@#params.point_color',
            opacity: '@@#params.opacity',
            radiusMinPixels: 2,
            radiusMaxPixels: 20,
          }}
          paramsConfig={[
            { key: 'radius', default: 5000, min: 1000, max: 50000, step: 1000 },
            { key: 'point_color', default: '#ef4444' },
            { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
          ]}
        />
      </section>

      <Callout title="Tips & Gotchas">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            The <code>@@type</code> key triggers class instantiation — all other
            keys in the same object become constructor props/options.
          </li>
          <li>
            Types must be registered in <code>converter-config.ts</code>. The
            converter maps the string name to the actual class.
          </li>
          <li>
            You can combine <code>@@type</code> with <code>@@#params</code>{' '}
            and <code>@@=</code> in the same object — params resolve first,
            then the converter instantiates the class with resolved values.
          </li>
        </ul>
      </Callout>
    </div>
  )
}
