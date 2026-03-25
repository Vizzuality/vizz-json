import { createFileRoute } from '@tanstack/react-router'
import { SectionHeader } from '#/components/guidelines/section-header'
import { CodeBlock } from '#/components/guidelines/code-block'
import { InteractiveExample } from '#/components/guidelines/interactive-example'
import { BasicLegend } from '#/components/legends/basic-legend'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import { GradientLegend } from '#/components/legends/gradient-legend'
import type { LegendConfig, LegendItem } from '#/lib/types'

export const Route = createFileRoute('/guidelines/legends')({
  component: GuidelinesLegends,
})

const LEGEND_COMPONENTS = {
  basic: BasicLegend,
  choropleth: ChoroplethLegend,
  gradient: GradientLegend,
} as const

function ResolveLegendPreview({
  resolved,
}: {
  readonly resolved: { value: Record<string, unknown> | null; error: string | null }
}) {
  if (resolved.error || !resolved.value) return null

  const legendConfig = resolved.value.legend_config as LegendConfig | undefined
  if (!legendConfig) return null

  const LegendComponent = LEGEND_COMPONENTS[legendConfig.type]
  if (!LegendComponent) return null

  return (
    <div className="p-4">
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Legend preview
      </div>
      <div className="rounded-lg border border-border p-4">
        <LegendComponent items={legendConfig.items as readonly LegendItem[]} />
      </div>
    </div>
  )
}

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
          title="Parameterized basic legend"
          description="Change the category colors and see the legend update."
          config={{
            legend_config: {
              type: 'basic',
              items: [
                { label: 'Forest', value: '@@#params.forest_color' },
                { label: 'Water', value: '@@#params.water_color' },
                { label: 'Urban', value: '@@#params.urban_color' },
              ],
            },
          }}
          paramsConfig={[
            { key: 'forest_color', default: '#22c55e', group: 'legend' },
            { key: 'water_color', default: '#3b82f6', group: 'legend' },
            { key: 'urban_color', default: '#94a3b8', group: 'legend' },
          ]}
        >
          {(resolved) => <ResolveLegendPreview resolved={resolved} />}
        </InteractiveExample>

        <InteractiveExample
          title="Parameterized choropleth legend"
          description="Change the colors and see both the config output and legend update."
          config={{
            legend_config: {
              type: 'choropleth',
              items: [
                { label: 'Sparse', value: '@@#params.low_color' },
                { label: 'Medium', value: '@@#params.mid_color' },
                { label: 'Dense', value: '@@#params.high_color' },
              ],
            },
          }}
          paramsConfig={[
            { key: 'low_color', default: '#dbeafe', group: 'legend' },
            { key: 'mid_color', default: '#3b82f6', group: 'legend' },
            { key: 'high_color', default: '#1e3a5f', group: 'legend' },
          ]}
        >
          {(resolved) => <ResolveLegendPreview resolved={resolved} />}
        </InteractiveExample>

        <InteractiveExample
          title="Parameterized gradient legend"
          description="Adjust the gradient stops and watch the legend update in real time."
          config={{
            legend_config: {
              type: 'gradient',
              items: [
                { label: 'Cold', value: '@@#params.cold_color' },
                { label: 'Warm', value: '@@#params.warm_color' },
                { label: 'Hot', value: '@@#params.hot_color' },
              ],
            },
          }}
          paramsConfig={[
            { key: 'cold_color', default: '#440154', group: 'legend' },
            { key: 'warm_color', default: '#21918c', group: 'legend' },
            { key: 'hot_color', default: '#fde725', group: 'legend' },
          ]}
        >
          {(resolved) => <ResolveLegendPreview resolved={resolved} />}
        </InteractiveExample>
      </section>

    </div>
  )
}
