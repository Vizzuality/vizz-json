import { Step, CodeBlock } from '../slide-parts'
import type { SlideProps } from '../slide-types'

export function ExpressionSlide({ step }: SlideProps) {
  return (
    <div className="slide items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-4 uppercase">
        @@=[...]
      </p>
      <h2 className="mb-4 text-foreground">Inline expressions</h2>
      <p className="mb-10 text-muted-foreground">
        Embed a functional expression directly in the JSON. Parsed at resolution time into a
        callable function.
      </p>

      <CodeBlock>
        <code>
          {'{\n'}
          {'  '}
          <span className="token-key">"circle-radius"</span>:{' '}
          <span className="token-param">"@@=[*, 2, [get, mag]]"</span>
          {'\n'}
          {'}'}
        </code>
      </CodeBlock>

      <Step visible={step >= 1} className="mt-6 w-full">
        <div className="flex items-center gap-4">
          <span className="text-2xl text-muted-foreground">→</span>
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <p className="font-mono text-sm text-chart-4">
              (feature) =&gt; 2 * feature.properties.mag
            </p>
          </div>
        </div>
      </Step>
    </div>
  )
}
