import { createFileRoute, Link } from '@tanstack/react-router'
import { SectionHeader } from '#/containers/guidelines/section-header'
import { InteractiveExample } from '#/containers/guidelines/interactive-example'

export const Route = createFileRoute('/guidelines/')({
  component: GuidelinesOverview,
})

const PREFIXES = [
  {
    prefix: '@@#params.X',
    description: 'Inject runtime parameter values',
    example: '"raster-opacity": "@@#params.opacity"',
    link: '/guidelines/params',
  },
  {
    prefix: '@@function:name',
    description: 'Call a registered function',
    example: '"@@function": "setQueryParams"',
    link: '/guidelines/functions',
  },
  {
    prefix: '@@type: ClassName',
    description: 'Instantiate a class or React component',
    example: '"@@type": "BasicLegend"',
    link: '/guidelines/types',
  },
  {
    prefix: '@@=[expression]',
    description: 'Evaluate an inline expression',
    example: '"@@=geometry.coordinates"',
    link: '/guidelines/expressions',
  },
] as const

const DEMO_CONFIG = {
  paint: {
    'raster-opacity': '@@#params.opacity',
  },
  layout: {
    visibility: '@@#params.visibility',
  },
}

const DEMO_PARAMS = [
  { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
  { key: 'visibility', default: 'visible', options: ['visible', 'none'] },
]

function GuidelinesOverview() {
  return (
    <div>
      <SectionHeader
        title="VizzJson"
        description="Transform static JSON into dynamic, parameterized map configurations using the @@ prefix convention."
      />

      {/* What is @@? */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          What is the @@ convention?
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Instead of hardcoding values in your map configuration JSON, you use{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            @@
          </code>{' '}
          prefixes to reference parameters, call functions, instantiate layers,
          and evaluate expressions — all from JSON. At runtime, these references
          are resolved into concrete values that MapLibre can render.
        </p>
      </section>

      {/* Resolution Pipeline */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Resolution Pipeline
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Configs are resolved in two stages:
        </p>
        <div className="flex items-center gap-3 overflow-x-auto rounded-lg border border-border p-4 text-sm">
          <div className="rounded bg-muted px-3 py-2 font-mono text-foreground">
            JSON Config
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="rounded bg-blue-500/10 px-3 py-2 text-blue-400">
            <div className="font-mono font-semibold">Stage 1</div>
            <div className="text-xs">resolveParams()</div>
            <div className="text-xs text-muted-foreground">@@#params.*</div>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="rounded bg-purple-500/10 px-3 py-2 text-purple-400">
            <div className="font-mono font-semibold">Stage 2</div>
            <div className="text-xs">JSONConverter</div>
            <div className="text-xs text-muted-foreground">
              @@function: @@type: @@=
            </div>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="rounded bg-primary/10 px-3 py-2 text-primary">
            Rendered Map
          </div>
        </div>
      </section>

      {/* Prefix Reference Table */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Prefix Reference
        </h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-foreground">
                  Prefix
                </th>
                <th className="px-4 py-2 text-left font-medium text-foreground">
                  Purpose
                </th>
                <th className="px-4 py-2 text-left font-medium text-foreground">
                  Example
                </th>
              </tr>
            </thead>
            <tbody>
              {PREFIXES.map((p) => (
                <tr
                  key={p.prefix}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-2">
                    <Link
                      to={p.link}
                      className="font-mono text-primary no-underline hover:underline"
                    >
                      {p.prefix}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {p.description}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {p.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive demo */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Try it out
        </h2>
        <InteractiveExample
          title="Simple parameter resolution"
          description="Adjust the controls to see how @@#params references resolve to concrete values."
          config={DEMO_CONFIG}
          paramsConfig={DEMO_PARAMS}
        />
      </section>

      {/* Explore links */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Explore each prefix
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PREFIXES.map((p) => (
            <Link
              key={p.prefix}
              to={p.link}
              className="rounded-lg border border-border p-4 no-underline transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              <div className="mb-1 font-mono text-sm font-semibold text-primary">
                {p.prefix}
              </div>
              <div className="text-sm text-muted-foreground">
                {p.description}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
