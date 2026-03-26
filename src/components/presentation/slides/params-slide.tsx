import { Step, CodeBlock } from '../slide-parts'
import type { SlideProps } from '../slide-types'

export function ParamsSlide({ step }: SlideProps) {
  return (
    <div className="slide items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-1 uppercase">
        @@#params.X
      </p>
      <h2 className="mb-4 text-foreground">Runtime parameter injection</h2>
      <p className="mb-10 text-muted-foreground">
        Reference a named parameter anywhere in the JSON. At resolution time, the string is
        replaced with the actual value.
      </p>

      <CodeBlock>
        <code>
          {'{\n'}
          {'  '}
          <span className="token-key">"paint"</span>: {'{\n'}
          {'    '}
          <span className="token-key">"raster-opacity"</span>:{' '}
          <span className="token-param">"@@#params.opacity"</span>
          {'\n'}
          {'  }'}
          {'\n'}
          {'}'}
        </code>
      </CodeBlock>

      <Step visible={step >= 1} className="mt-6 w-full">
        <div className="flex items-center gap-4">
          <div className="rounded-md border border-border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">
              params = {'{ '}
              <span className="font-mono text-primary">opacity: 0.75</span>
              {' }'}
            </p>
          </div>
          <span className="text-2xl text-muted-foreground">→</span>
          <CodeBlock className="flex-1">
            <code>
              <span className="token-key">"raster-opacity"</span>:{' '}
              <span className="token-number">0.75</span>
            </code>
          </CodeBlock>
        </div>
      </Step>
    </div>
  )
}
