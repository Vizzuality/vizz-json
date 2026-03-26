import { Slide, Step, CodeBlock, SlideHeading, SlideText } from '../slide-parts'
import type { SlideProps } from '../slide-types'

export function PainPointSlide({ step }: SlideProps) {
  return (
    <Slide className="items-start">
      <SlideHeading className="mb-4 text-foreground">The problem</SlideHeading>
      <SlideText className="mb-6 text-muted-foreground">
        Every map library has its own config shape. Same data, different specs.
      </SlideText>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            MapLibre
          </p>
          <CodeBlock>
            <code>
              {'{\n'}
              {'  '}
              <span className="token-key">"type"</span>:{' '}
              <span className="token-string">"circle"</span>,{'\n'}
              {'  '}
              <span className="token-key">"paint"</span>: {'{\n'}
              {'    '}
              <span className="token-key">"circle-radius"</span>:{' '}
              <Step visible={step >= 1} inline delay={0}>
                <span className="rounded bg-destructive/20 px-1 font-bold text-destructive">
                  6
                </span>
              </Step>
              {step < 1 && <span className="token-number">6</span>},{'\n'}
              {'    '}
              <span className="token-key">"circle-color"</span>:{' '}
              <Step visible={step >= 1} inline delay={200}>
                <span className="rounded bg-destructive/20 px-1 font-bold text-destructive">
                  "#d7191c"
                </span>
              </Step>
              {step < 1 && <span className="token-string">"#d7191c"</span>}
              ,{'\n'}
              {'    '}
              <span className="token-key">"circle-opacity"</span>:{' '}
              <Step visible={step >= 1} inline delay={400}>
                <span className="rounded bg-destructive/20 px-1 font-bold text-destructive">
                  0.8
                </span>
              </Step>
              {step < 1 && <span className="token-number">0.8</span>}
              {'\n'}
              {'  }'}
              {'\n'}
              {'}'}
            </code>
          </CodeBlock>
        </div>

        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            deck.gl
          </p>
          <CodeBlock>
            <code>
              {'{\n'}
              {'  '}
              <span className="token-key">"type"</span>:{' '}
              <span className="token-string">"ScatterplotLayer"</span>,{'\n'}
              {'  '}
              <span className="token-key">"radiusScale"</span>:{' '}
              <Step visible={step >= 1} inline delay={100}>
                <span className="rounded bg-destructive/20 px-1 font-bold text-destructive">
                  6
                </span>
              </Step>
              {step < 1 && <span className="token-number">6</span>},{'\n'}
              {'  '}
              <span className="token-key">"getFillColor"</span>:{' '}
              <Step visible={step >= 1} inline delay={300}>
                <span className="rounded bg-destructive/20 px-1 font-bold text-destructive">
                  [215, 25, 28]
                </span>
              </Step>
              {step < 1 && (
                <span className="token-number">[215, 25, 28]</span>
              )}
              ,{'\n'}
              {'  '}
              <span className="token-key">"opacity"</span>:{' '}
              <Step visible={step >= 1} inline delay={500}>
                <span className="rounded bg-destructive/20 px-1 font-bold text-destructive">
                  0.8
                </span>
              </Step>
              {step < 1 && <span className="token-number">0.8</span>}
              {'\n'}
              {'}'}
            </code>
          </CodeBlock>
        </div>
      </div>

      <Step visible={step >= 1} className="mt-6">
        <p className="text-sm text-destructive">
          Which values should users control? Which are structural? No standard
          way to separate them.
        </p>
      </Step>
    </Slide>
  )
}
