import { Slide, Step, CodeBlock, SlideHeading, SlideText } from '../slide-parts'
import type { SlideProps } from '../slide-types'

const INFERENCES = [
  { type: 'number', default: '0.8', control: 'Slider', icon: '⎯○⎯' },
  { type: 'boolean', default: 'true', control: 'Switch', icon: '●━━' },
  { type: '#hex', default: '"#3b82f6"', control: 'Color Picker', icon: '■' },
  { type: 'options[]', default: '"visible"', control: 'Select', icon: '▾' },
] as const

export function ParamInferenceSlide({ step }: SlideProps) {
  return (
    <Slide className="items-start">
      <SlideHeading className="mb-4 text-foreground">
        Automatic param inference
      </SlideHeading>
      <SlideText className="mb-10 text-muted-foreground">
        The UI control type is inferred from the parameter config — no manual
        wiring needed.
      </SlideText>

      <CodeBlock>
        <code>
          {'[\n'}
          {'  { '}
          <span className="token-key">"key"</span>:{' '}
          <span className="token-string">"opacity"</span>,{' '}
          <span className="token-key">"default"</span>:{' '}
          <span className="token-number">0.8</span>,{' '}
          <span className="token-key">"min"</span>:{' '}
          <span className="token-number">0</span>,{' '}
          <span className="token-key">"max"</span>:{' '}
          <span className="token-number">1</span>
          {' },\n'}
          {'  { '}
          <span className="token-key">"key"</span>:{' '}
          <span className="token-string">"visible"</span>,{' '}
          <span className="token-key">"default"</span>:{' '}
          <span className="token-number">true</span>
          {' },\n'}
          {'  { '}
          <span className="token-key">"key"</span>:{' '}
          <span className="token-string">"color"</span>,{' '}
          <span className="token-key">"default"</span>:{' '}
          <span className="token-string">"#3b82f6"</span>
          {' },\n'}
          {'  { '}
          <span className="token-key">"key"</span>:{' '}
          <span className="token-string">"mode"</span>,{' '}
          <span className="token-key">"options"</span>: [
          <span className="token-string">"visible"</span>,{' '}
          <span className="token-string">"none"</span>]{' }\n'}
          {']'}
        </code>
      </CodeBlock>

      <Step visible={step >= 1} className="mt-8 w-full">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {INFERENCES.map((inf) => (
            <div
              key={inf.type}
              className="rounded-lg border border-border bg-card p-4 text-center"
            >
              <p className="mb-2 font-mono text-2xl">{inf.icon}</p>
              <p className="text-sm font-semibold text-foreground">
                {inf.control}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {inf.type} → {inf.default}
              </p>
            </div>
          ))}
        </div>
      </Step>
    </Slide>
  )
}
