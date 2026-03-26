import { Step, CodeBlock } from '../slide-parts'
import type { SlideProps } from '../slide-types'

export function TypeSlide({ step }: SlideProps) {
  return (
    <div className="slide items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-3 uppercase">
        @@type:
      </p>
      <h2 className="mb-4 text-foreground">Component instantiation</h2>
      <p className="mb-10 text-muted-foreground">
        Declare a class or React component by name. The converter instantiates
        it with the surrounding properties as props.
      </p>

      <CodeBlock>
        <code>
          {'{\n'}
          {'  '}
          <span className="token-key">"@@type"</span>:{' '}
          <span className="token-param">"BasicLegend"</span>,{'\n'}
          {'  '}
          <span className="token-key">"items"</span>: [{'{ '}
          <span className="token-key">"label"</span>:{' '}
          <span className="token-string">"Forest"</span>,{' '}
          <span className="token-key">"value"</span>:{' '}
          <span className="token-string">"#22c55e"</span>
          {' }'}]{'\n'}
          {'}'}
        </code>
      </CodeBlock>

      <Step visible={step >= 1} className="mt-8 w-full">
        <div className="flex items-center gap-6">
          <span className="text-2xl text-muted-foreground">→</span>
          <div className="rounded-lg border border-border bg-card px-6 py-4">
            <p className="mb-2 text-sm font-semibold text-chart-3">
              {'<BasicLegend />'}
            </p>
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded"
                style={{ background: '#22c55e' }}
              />
              <span className="text-sm text-muted-foreground">Forest</span>
            </div>
          </div>
        </div>
      </Step>
    </div>
  )
}
