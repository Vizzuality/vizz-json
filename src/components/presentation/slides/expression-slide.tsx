import { Slide, Step, CodeBlock, SlideHeading, SlideText } from '../slide-parts'
import type { SlideProps } from '../slide-types'

export function ExpressionSlide({ step }: SlideProps) {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-4 uppercase">
        @@=[...]
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Inline expressions
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Embed a functional expression directly in the JSON. Parsed at resolution
        time into a callable function.
      </SlideText>

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
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-4">
          <span className="text-2xl text-muted-foreground">→</span>
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <p className="font-mono text-sm text-chart-4">
              (feature) =&gt; 2 * feature.properties.mag
            </p>
          </div>
        </div>
      </Step>
    </Slide>
  )
}
