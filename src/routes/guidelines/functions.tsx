import { createFileRoute } from '@tanstack/react-router'
import { SectionHeader } from '#/components/guidelines/section-header'
import { CodeBlock } from '#/components/guidelines/code-block'
import { InteractiveExample } from '#/components/guidelines/interactive-example'
import { Callout } from '#/components/guidelines/callout'

export const Route = createFileRoute('/guidelines/functions')({
  component: GuidelinesFunctions,
})

function GuidelinesFunctions() {
  return (
    <div>
      <SectionHeader
        title="@@function: — Function Dispatch"
        description="Call registered functions from your JSON config to transform values at resolution time."
        syntax='@@function:functionName'
      />

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          How it works
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          When the converter encounters an object with an{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            @@function
          </code>{' '}
          key, it calls the named function with the rest of the object as
          arguments. The function's return value replaces the entire object.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          This is resolved in <strong>Stage 2</strong> by the JSONConverter,
          meaning you can combine it with @@#params references in the arguments
          (which resolve first in Stage 1).
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Syntax</h2>
        <CodeBlock
          title="Function call pattern"
          value={{
            '@@function': 'setQueryParams',
            url: 'https://api.example.com/tiles/{z}/{x}/{y}.png',
            query: { colormap: 'viridis' },
          }}
        />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Registered functions
        </h2>

        <h3 className="mb-2 mt-6 font-mono text-lg font-semibold text-foreground">
          setQueryParams
        </h3>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Builds a URL by appending query parameters. Takes{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            url
          </code>{' '}
          and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            query
          </code>{' '}
          as arguments.
        </p>
        <InteractiveExample
          title="setQueryParams — dynamic tile URL"
          description="The function builds the full URL with query params from the param values."
          config={{
            source: {
              type: 'raster',
              tiles: [
                {
                  '@@function': 'setQueryParams',
                  url: 'https://tiles.example.com/{z}/{x}/{y}.png',
                  query: {
                    colormap: '@@#params.colormap',
                    rescale: '@@#params.rescale',
                  },
                },
              ],
            },
          }}
          paramsConfig={[
            {
              key: 'colormap',
              default: 'viridis',
              options: ['viridis', 'plasma', 'inferno', 'magma'],
            },
            { key: 'rescale', default: '0,3000' },
          ]}
        />

        <h3 className="mb-2 mt-8 font-mono text-lg font-semibold text-foreground">
          ifParam
        </h3>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Conditional value selection. Evaluates{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            condition
          </code>{' '}
          and returns{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            then
          </code>{' '}
          if truthy, otherwise{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            else
          </code>
          .
        </p>
        <InteractiveExample
          title="ifParam — conditional value"
          description="Toggle the switch to see the conditional resolve to different values."
          config={{
            paint: {
              'fill-opacity': {
                '@@function': 'ifParam',
                condition: '@@#params.showLayer',
                then: 0.8,
                else: 0,
              },
            },
          }}
          paramsConfig={[{ key: 'showLayer', default: true }]}
        />
      </section>

      <Callout title="Tips & Gotchas">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Functions must be registered in{' '}
            <code>converter-config.ts</code> before they can be called.
          </li>
          <li>
            The entire object containing{' '}
            <code>@@function</code> is replaced by the
            function's return value.
          </li>
          <li>
            Arguments can use <code>@@#params</code> references — params
            resolve first (Stage 1) before functions are called (Stage 2).
          </li>
        </ul>
      </Callout>
    </div>
  )
}
