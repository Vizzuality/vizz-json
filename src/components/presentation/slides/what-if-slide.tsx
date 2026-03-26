import { cn } from '#/lib/utils'
import { Slide, Step, CodeBlock, SlideHeading, SlideText } from '../slide-parts'
import type { SlideProps } from '../slide-types'

export function WhatIfSlide({ step }: SlideProps) {
  return (
    <Slide className="items-start">
      <SlideHeading className="mb-8 text-foreground">What if...</SlideHeading>
      <SlideText className="mb-8 text-muted-foreground">
        ...the JSON could reference runtime parameters?
      </SlideText>

      <div className={cn('grid w-full gap-6', step >= 1 && 'md:grid-cols-2')}>
        <div>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">
            Before
          </p>
          <CodeBlock>
            <code>
              <span className="token-key">"circle-opacity"</span>:{' '}
              <span className="token-number">0.8</span>,{'\n'}
              <span className="token-key">"circle-color"</span>:{' '}
              <span className="token-string">"#d7191c"</span>,{'\n'}
              <span className="token-key">"circle-radius"</span>:{' '}
              <span className="token-number">16</span>
            </code>
          </CodeBlock>
        </div>

        <Step visible={step >= 1}>
          <p className="mb-3 text-sm font-semibold text-primary">After</p>
          <CodeBlock>
            <code>
              <span className="token-key">"circle-opacity"</span>:{' '}
              <span className="token-param">"@@#params.opacity"</span>,{'\n'}
              <span className="token-key">"circle-color"</span>:{' '}
              <span className="token-param">"@@#params.color"</span>,{'\n'}
              <span className="token-key">"circle-radius"</span>:{' '}
              <span className="token-param">"@@#params.radius"</span>
            </code>
          </CodeBlock>
        </Step>
      </div>
    </Slide>
  )
}
