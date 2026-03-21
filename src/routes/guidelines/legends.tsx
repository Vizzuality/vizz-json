import { createFileRoute } from '@tanstack/react-router'
import { SectionHeader } from '#/components/guidelines/section-header'
import { CodeBlock } from '#/components/guidelines/code-block'
import { InteractiveExample } from '#/components/guidelines/interactive-example'
import { Callout } from '#/components/guidelines/callout'
import { BasicLegend } from '#/components/legends/basic-legend'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import { GradientLegend } from '#/components/legends/gradient-legend'

export const Route = createFileRoute('/guidelines/legends')({
  component: GuidelinesLegends,
})

function GuidelinesLegends() {
  return (
    <div>
      <SectionHeader
        title="Legend Configuration"
        description="Define map legends alongside your config using legend_config to render visual keys that stay in sync with your parameters."
      />

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          How it works
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          The{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            legend_config
          </code>{' '}
          object sits alongside{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            config
          </code>{' '}
          and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            params_config
          </code>{' '}
          in your JSON. It specifies a legend type and an array of items. Legend
          item values can use{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            @@#params
          </code>{' '}
          references, keeping the legend in sync with your parameter controls.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Structure
        </h2>
        <CodeBlock
          title="legend_config shape"
          value={{
            legend_config: {
              type: 'basic | choropleth | gradient',
              items: [
                { label: 'Category A', value: '#dc2626' },
                { label: 'Category B', value: '#3b82f6' },
              ],
            },
          }}
        />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Legend types
        </h2>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground">
          Basic
        </h3>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Simple color swatches with labels. Best for categorical data.
        </p>
        <div className="mb-4 rounded-lg border border-border p-4">
          <BasicLegend
            items={[
              { label: 'Forest', value: '#22c55e' },
              { label: 'Water', value: '#3b82f6' },
              { label: 'Urban', value: '#94a3b8' },
            ]}
          />
        </div>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground">
          Choropleth
        </h3>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Color ramps with boundary labels. Best for classified/binned data.
        </p>
        <div className="mb-4 rounded-lg border border-border p-4">
          <ChoroplethLegend
            items={[
              { label: 'Low', value: '#dbeafe' },
              { label: 'Medium', value: '#3b82f6' },
              { label: 'High', value: '#1e3a5f' },
            ]}
          />
        </div>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground">
          Gradient
        </h3>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Continuous color gradient. Best for interpolated/continuous data.
        </p>
        <div className="mb-4 rounded-lg border border-border p-4">
          <GradientLegend
            items={[
              { label: 'Low', value: '#440154' },
              { label: 'High', value: '#fde725' },
            ]}
          />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Parameterized legends
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Legend item values can reference parameters. When a param has{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            {"group: 'legend'"}
          </code>
          , its control appears inside the legend card, keeping color selection
          and legend display in sync.
        </p>

        <InteractiveExample
          title="Parameterized choropleth legend"
          description="Change the colors and see both the config output and legend update."
          config={{
            paint: {
              'fill-color': [
                'case',
                ['>', ['get', 'pop_est'], 50000000],
                '@@#params.above_color',
                '@@#params.below_color',
              ],
            },
          }}
          paramsConfig={[
            { key: 'above_color', default: '#dc2626', group: 'legend' },
            { key: 'below_color', default: '#3b82f6', group: 'legend' },
          ]}
        />
      </section>

      <Callout title="Tips & Gotchas">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <code>legend_config</code> is not resolved by the converter — it
            uses its own rendering pipeline with the legend React components.
          </li>
          <li>
            Use <code>{"group: 'legend'"}</code> on params to co-locate their
            controls inside the legend card.
          </li>
          <li>
            Legend item values with <code>@@#params</code> references are
            resolved alongside the map config, keeping them in sync.
          </li>
        </ul>
      </Callout>
    </div>
  )
}
