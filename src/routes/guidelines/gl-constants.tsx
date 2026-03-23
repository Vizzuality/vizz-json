import { createFileRoute } from '@tanstack/react-router'
import { SectionHeader } from '#/components/guidelines/section-header'
import { CodeBlock } from '#/components/guidelines/code-block'
import { InteractiveExample } from '#/components/guidelines/interactive-example'
import { Callout } from '#/components/guidelines/callout'

export const Route = createFileRoute('/guidelines/gl-constants')({
  component: GuidelinesGLConstants,
})

function GuidelinesGLConstants() {
  return (
    <div>
      <SectionHeader
        title="@@#GL. — WebGL Constants"
        description="Reference WebGL constants by name instead of numeric values."
        syntax="@@#GL.CONSTANT_NAME"
      />

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          How it works
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Some layer properties expect raw WebGL constant values (integers).
          Instead of using magic numbers, you can reference them by name using
          the{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            @@#GL.
          </code>{' '}
          prefix. The converter resolves these to their numeric values at Stage
          2.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Syntax</h2>
        <CodeBlock
          title="GL constant reference"
          value={{
            parameters: {
              depthTest: false,
              blend: true,
              blendFunc: ['@@#GL.SRC_ALPHA', '@@#GL.ONE_MINUS_SRC_ALPHA'],
            },
          }}
        />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Common constants
        </h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Constant</th>
                <th className="px-4 py-2 text-left font-medium">Use case</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="px-4 py-2 font-mono">@@#GL.POINTS</td>
                <td className="px-4 py-2">Point draw mode</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 font-mono">@@#GL.LINES</td>
                <td className="px-4 py-2">Line draw mode</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 font-mono">@@#GL.SRC_ALPHA</td>
                <td className="px-4 py-2">Blend function source</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono">
                  @@#GL.ONE_MINUS_SRC_ALPHA
                </td>
                <td className="px-4 py-2">Blend function destination</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Example</h2>
        <InteractiveExample
          title="GL constants in blend parameters"
          description="GL constants are resolved to their numeric values. Adjust the opacity to see how it combines with the blend parameters."
          config={{
            opacity: '@@#params.opacity',
            parameters: {
              blend: true,
              blendFunc: ['@@#GL.SRC_ALPHA', '@@#GL.ONE_MINUS_SRC_ALPHA'],
            },
          }}
          paramsConfig={[
            { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
          ]}
        />
      </section>

      <Callout title="Tips & Gotchas">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Useful for layers that require raw GL constants. MapLibre styles
            don't typically use this prefix.
          </li>
          <li>
            Constants are resolved in <strong>Stage 2</strong> by the
            JSONConverter.
          </li>
          <li>
            The full list of WebGL constants is available in the{' '}
            <strong>WebGL spec</strong>.
          </li>
        </ul>
      </Callout>
    </div>
  )
}
