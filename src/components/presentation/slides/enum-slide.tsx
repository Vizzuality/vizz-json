import { CodeBlock } from '../slide-parts'
import type { SlideProps } from '../slide-types'

export function EnumSlide(_props: SlideProps) {
  return (
    <div className="slide items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-5 uppercase">
        @@#ENUM.X
      </p>
      <h2 className="mb-4 text-foreground">Constant resolution</h2>
      <p className="mb-10 text-muted-foreground">
        Reference named constants from an enum registry. Commonly used for WebGL
        constants that deck.gl expects as numeric values.
      </p>

      <div className="flex w-full items-center gap-6">
        <CodeBlock className="flex-1">
          <code>
            <span className="token-key">"drawMode"</span>:{' '}
            <span className="token-param">"@@#GL.POINTS"</span>
          </code>
        </CodeBlock>

        <span className="text-2xl text-muted-foreground">→</span>

        <CodeBlock className="flex-1">
          <code>
            <span className="token-key">"drawMode"</span>:{' '}
            <span className="token-number">0</span>
            {'  '}
            <span className="token-comment">// GL.POINTS === 0</span>
          </code>
        </CodeBlock>
      </div>
    </div>
  )
}
