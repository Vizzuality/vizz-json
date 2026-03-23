import { createFileRoute } from '@tanstack/react-router'
import { SectionHeader } from '#/components/guidelines/section-header'
import { CodeBlock } from '#/components/guidelines/code-block'
import { InteractiveExample } from '#/components/guidelines/interactive-example'
import { Callout } from '#/components/guidelines/callout'

export const Route = createFileRoute('/guidelines/expressions')({
  component: GuidelinesExpressions,
})

function GuidelinesExpressions() {
  return (
    <div>
      <SectionHeader
        title="@@=[...] — Inline Expressions"
        description="Evaluate MapLibre expressions for data-driven styling and dynamic accessors."
        syntax="@@=[expression]"
      />

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          How it works
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Strings starting with{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            @@=
          </code>{' '}
          are treated as inline expressions. The converter strips the prefix and
          converts the value into a function or expression that MapLibre
          evaluates at render time.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          This is commonly used for <strong>accessor functions</strong> (e.g.,
          extracting coordinates from GeoJSON features) and for{' '}
          <strong>data-driven styling</strong> with MapLibre expressions.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Syntax</h2>
        <CodeBlock
          title="Property accessor"
          value={{ getPosition: '@@=geometry.coordinates' }}
        />
        <div className="mt-4" />
        <CodeBlock
          title="MapLibre case expression"
          value={{
            'fill-color': [
              'case',
              ['>', ['get', 'pop_est'], 50000000],
              '#dc2626',
              '#3b82f6',
            ],
          }}
        />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Examples</h2>

        <InteractiveExample
          title="Conditional styling with case expression"
          description="Combine @@#params with MapLibre expressions for parameterized data-driven styles."
          config={{
            paint: {
              'fill-color': [
                'case',
                ['>', ['get', 'pop_est'], '@@#params.threshold'],
                '@@#params.above_color',
                '@@#params.below_color',
              ],
              'fill-opacity': '@@#params.opacity',
            },
          }}
          paramsConfig={[
            {
              key: 'threshold',
              default: 50000000,
              min: 1000000,
              max: 1000000000,
              step: 1000000,
            },
            { key: 'above_color', default: '#dc2626' },
            { key: 'below_color', default: '#3b82f6' },
            { key: 'opacity', default: 0.7, min: 0, max: 1, step: 0.05 },
          ]}
        />
      </section>

      <Callout title="Tips & Gotchas">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Expressions follow <strong>MapLibre expression syntax</strong> — the
            same format used in MapLibre style specs.
          </li>
          <li>
            <code>@@=</code> is resolved in <strong>Stage 2</strong> by the
            JSONConverter.
          </li>
          <li>
            For accessors, the expression after <code>@@=</code> is converted
            into a function that receives each data feature.
          </li>
        </ul>
      </Callout>
    </div>
  )
}
