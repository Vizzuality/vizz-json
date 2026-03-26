import { Slide, CodeBlock, SlideHeading, SlideText } from '../slide-parts'
import type { SlideProps } from '../slide-types'

export function EnumSlide(_props: SlideProps) {
  return (
    <Slide className="items-start">
      <p className="mb-2 text-sm font-semibold tracking-wider text-chart-5 uppercase">
        @@#ENUM.X
      </p>
      <SlideHeading className="mb-4 text-foreground">
        Constant resolution
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        Reference named constants from an enum registry. Commonly used for WebGL
        constants that deck.gl expects as numeric values.
      </SlideText>

      <div className="flex w-full flex-col items-stretch gap-4 md:flex-row md:items-center md:gap-6">
        <CodeBlock className="md:flex-1">
          <code>
            <span className="token-key">"drawMode"</span>:{' '}
            <span className="token-param">"@@#GL.POINTS"</span>
          </code>
        </CodeBlock>

        <span className="text-2xl text-muted-foreground">→</span>

        <CodeBlock className="md:flex-1">
          <code>
            <span className="token-key">"drawMode"</span>:{' '}
            <span className="token-number">0</span>
            {'  '}
            <span className="token-comment">// GL.POINTS === 0</span>
          </code>
        </CodeBlock>
      </div>
    </Slide>
  )
}
