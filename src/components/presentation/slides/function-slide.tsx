import { Slide, Step, CodeBlock, SlideHeading, SlideText } from '../slide-parts'
import type { SlideProps } from '../slide-types'

export function FunctionSlide({ step }: SlideProps) {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-2 uppercase">
        @@function:
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Named function dispatch
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Reference a registered function by name. The converter looks it up and
        calls it.
      </SlideText>

      <CodeBlock>
        <code>
          {'{\n'}
          {'  '}
          <span className="token-key">"getTileUrl"</span>:{' '}
          <span className="token-param">"@@function:setQueryParams"</span>
          {'\n'}
          {'}'}
        </code>
      </CodeBlock>

      <Step visible={step >= 1} className="mt-6 w-full">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">
              registry = {'{ '}
              <span className="font-mono text-chart-2">setQueryParams</span>
              {': '}
              <span className="font-mono text-muted-foreground">
                (url, params) =&gt; ...
              </span>
              {' }'}
            </p>
          </div>
          <span className="text-2xl text-muted-foreground">→</span>
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <p className="font-mono text-sm text-chart-2">
              ƒ setQueryParams()
            </p>
          </div>
        </div>
      </Step>
    </Slide>
  )
}
