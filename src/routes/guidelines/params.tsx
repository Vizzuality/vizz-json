import { createFileRoute } from '@tanstack/react-router'
import { SectionHeader } from '#/components/guidelines/section-header'
import { CodeBlock } from '#/components/guidelines/code-block'
import { InteractiveExample } from '#/components/guidelines/interactive-example'
import { LiveExample } from '#/components/guidelines/live-example'
import { Callout } from '#/components/guidelines/callout'

export const Route = createFileRoute('/guidelines/params')({
  component: GuidelinesParams,
})

function GuidelinesParams() {
  return (
    <div>
      <SectionHeader
        title="@@#params — Parameter References"
        description="Inject runtime values into your JSON configs using dot-notation parameter references."
        syntax="@@#params.<key>"
      />

      {/* How it works */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          How it works
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Any string value starting with{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            @@#params.
          </code>{' '}
          is replaced with the corresponding parameter value at runtime. This is
          Stage 1 of the resolution pipeline — params are resolved before any
          other prefixes.
        </p>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Parameters are defined in the{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            params_config
          </code>{' '}
          array alongside your config. Each parameter specifies a key, a default
          value, and optional constraints (min, max, step, options) that
          determine which UI control is rendered.
        </p>
      </section>

      {/* Syntax reference */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Syntax</h2>
        <CodeBlock
          title="Basic reference"
          value={{
            paint: { 'raster-opacity': '@@#params.opacity' },
          }}
        />
        <div className="mt-4" />
        <CodeBlock
          title="Dot notation for nested access"
          value={{
            paint: { 'fill-color': '@@#params.style.fillColor' },
          }}
        />
      </section>

      {/* params_config shape */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          params_config shape
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          The system auto-detects which UI control to render based on the
          parameter definition:
        </p>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Config</th>
                <th className="px-4 py-2 text-left font-medium">Control</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="px-4 py-2 font-mono text-xs">
                  {'{ default: 0.8, min: 0, max: 1, step: 0.05 }'}
                </td>
                <td className="px-4 py-2">Slider</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 font-mono text-xs">
                  {'{ default: true }'}
                </td>
                <td className="px-4 py-2">Switch</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 font-mono text-xs">
                  {'{ default: "#ef4444" }'}
                </td>
                <td className="px-4 py-2">Color picker</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 font-mono text-xs">
                  {'{ default: "visible", options: ["visible", "none"] }'}
                </td>
                <td className="px-4 py-2">Select dropdown</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">
                  {'{ default: "hello" }'}
                </td>
                <td className="px-4 py-2">Text input</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive examples */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Examples</h2>

        <InteractiveExample
          title="Opacity slider"
          description="A number default with min/max/step renders a slider control."
          config={{
            paint: { 'raster-opacity': '@@#params.opacity' },
          }}
          paramsConfig={[
            { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
          ]}
        />

        <InteractiveExample
          title="Visibility toggle"
          description="An options array renders a select dropdown."
          config={{
            layout: { visibility: '@@#params.visibility' },
          }}
          paramsConfig={[
            {
              key: 'visibility',
              default: 'visible',
              options: ['visible', 'none'],
            },
          ]}
        />

        <InteractiveExample
          title="Color picker"
          description="A hex color string default is auto-detected and renders a color picker."
          config={{
            paint: { 'fill-color': '@@#params.fillColor' },
          }}
          paramsConfig={[{ key: 'fillColor', default: '#3b82f6' }]}
        />

        <InteractiveExample
          title="Nested dot notation"
          description="Use dots to access nested parameter structures."
          config={{
            paint: {
              'fill-color': '@@#params.style.color',
              'fill-opacity': '@@#params.style.opacity',
            },
          }}
          paramsConfig={[
            { key: 'style.color', default: '#dc2626' },
            { key: 'style.opacity', default: 0.7, min: 0, max: 1, step: 0.1 },
          ]}
        />
      </section>

      {/* Hero example with map */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Live preview
        </h2>
        <LiveExample
          title="Raster layer with multiple params"
          description="Combines opacity slider and visibility toggle on a satellite imagery layer."
          config={{
            source: {
              type: 'raster',
              tiles: [
                'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg',
              ],
              tileSize: 256,
            },
            styles: [
              {
                type: 'raster',
                paint: { 'raster-opacity': '@@#params.opacity' },
                layout: { visibility: '@@#params.visibility' },
              },
            ],
          }}
          paramsConfig={[
            { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
            {
              key: 'visibility',
              default: 'visible',
              options: ['visible', 'none'],
            },
          ]}
        />
      </section>

      {/* Tips */}
      <Callout title="Tips & Gotchas">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Params are resolved in <strong>Stage 1</strong>, before any other @@
            prefixes. This means you can use @@#params values inside @@function
            arguments.
          </li>
          <li>
            Every parameter <strong>must have a default</strong> value — it
            determines both the initial state and the inferred control type.
          </li>
          <li>
            Dot notation (<code>@@#params.style.opacity</code>) walks nested
            objects in the params map. The key in params_config should match the
            full dot path.
          </li>
        </ul>
      </Callout>
    </div>
  )
}
