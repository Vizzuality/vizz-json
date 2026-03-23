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
        description="Instantiate registered classes and React components directly from JSON."
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
          title="Component instantiation"
          value={{
            '@@type': 'BasicLegend',
            items: [
              { label: 'Forest', value: '#22c55e' },
              { label: 'Water', value: '#3b82f6' },
            ],
          }}
        />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Registered types
        </h2>

        <h3 className="mb-2 mt-4 text-lg font-semibold text-foreground">
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
        <h2 className="mb-4 text-xl font-semibold text-foreground">Examples</h2>

        <InteractiveExample
          title="BasicLegend"
          description="A legend component with parameterized colors."
          config={{
            '@@type': 'BasicLegend',
            items: [
              { label: 'Category A', value: '@@#params.color_a' },
              { label: 'Category B', value: '@@#params.color_b' },
            ],
          }}
          paramsConfig={[
            { key: 'color_a', default: '#22c55e' },
            { key: 'color_b', default: '#3b82f6' },
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
            You can combine <code>@@type</code> with <code>@@#params</code> and{' '}
            <code>@@=</code> in the same object — params resolve first, then the
            converter instantiates the class with resolved values.
          </li>
        </ul>
      </Callout>
    </div>
  )
}
