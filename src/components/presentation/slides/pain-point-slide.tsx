import { Step, CodeBlock } from '../slide-parts'
import type { SlideProps } from '../slide-types'

export function PainPointSlide({ step }: SlideProps) {
  return (
    <div className="slide items-start">
      <h2 className="mb-8 text-foreground">The problem</h2>
      <p className="mb-8 text-muted-foreground">
        A typical MapLibre layer config — verbose, repetitive, hardcoded.
      </p>

      <CodeBlock>
        <code>
          {'{\n'}
          {'  '}<span className="token-key">"type"</span>: <span className="token-string">"circle"</span>,{'\n'}
          {'  '}<span className="token-key">"paint"</span>: {'{\n'}
          {'    '}<span className="token-key">"circle-radius"</span>: [<span className="token-string">"interpolate"</span>, [<span className="token-string">"linear"</span>], [<span className="token-string">"get"</span>, <span className="token-string">"mag"</span>],{'\n'}
          {'      '}1, <Step visible={step >= 1} className="inline" delay={0}><span className="rounded bg-destructive/20 px-1 font-bold text-destructive">4</span></Step>{step < 1 && <span className="token-number">4</span>}, 3, <Step visible={step >= 1} className="inline" delay={200}><span className="rounded bg-destructive/20 px-1 font-bold text-destructive">8</span></Step>{step < 1 && <span className="token-number">8</span>}, 5, <Step visible={step >= 1} className="inline" delay={400}><span className="rounded bg-destructive/20 px-1 font-bold text-destructive">16</span></Step>{step < 1 && <span className="token-number">16</span>}],{'\n'}
          {'    '}<span className="token-key">"circle-color"</span>: <Step visible={step >= 1} className="inline" delay={600}><span className="rounded bg-destructive/20 px-1 font-bold text-destructive">"#d7191c"</span></Step>{step < 1 && <span className="token-string">"#d7191c"</span>},{'\n'}
          {'    '}<span className="token-key">"circle-opacity"</span>: <Step visible={step >= 1} className="inline" delay={800}><span className="rounded bg-destructive/20 px-1 font-bold text-destructive">0.8</span></Step>{step < 1 && <span className="token-number">0.8</span>},{'\n'}
          {'    '}<span className="token-key">"circle-stroke-color"</span>: <Step visible={step >= 1} className="inline" delay={1000}><span className="rounded bg-destructive/20 px-1 font-bold text-destructive">"#ffffff"</span></Step>{step < 1 && <span className="token-string">"#ffffff"</span>}{'\n'}
          {'  }'}{'\n'}
          {'}'}
        </code>
      </CodeBlock>

      <Step visible={step >= 1} className="mt-6">
        <p className="text-sm text-destructive">
          Magic numbers everywhere. Change the scale? Touch every value. Change the color? Find every string.
        </p>
      </Step>
    </div>
  )
}
