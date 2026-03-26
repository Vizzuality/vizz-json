import { Step, CodeBlock } from '../slide-parts'
import type { SlideProps } from '../slide-types'

export function ImmutabilitySlide({ step }: SlideProps) {
  return (
    <div className="slide items-start">
      <h2 className="mb-4 text-foreground">Immutability by design</h2>
      <p className="mb-10 text-muted-foreground">
        <code className="font-mono text-primary">resolveParams()</code> never mutates.
        It returns a fresh object tree — the original config stays untouched.
      </p>

      <CodeBlock>
        <code>
          <span className="token-comment">// resolveParams builds a NEW object</span>{'\n'}
          <span className="token-key">const</span> result = {'{}  '}<span className="token-comment">// fresh object</span>{'\n'}
          <span className="token-key">for</span> (<span className="token-key">const</span> [key, value] <span className="token-key">of</span> Object.entries(obj)) {'{\n'}
          {'  '}result[key] = resolveValue(value, params){'\n'}
          {'}\n'}
          <span className="token-key">return</span> result  <span className="token-comment">// original untouched</span>
        </code>
      </CodeBlock>

      <Step visible={step >= 1} className="mt-8 w-full">
        <div className="grid w-full grid-cols-2 gap-6">
          <div className="rounded-lg border-2 border-chart-2 bg-chart-2/10 p-5">
            <p className="mb-2 text-sm font-semibold text-chart-2">Original (unchanged)</p>
            <code className="font-mono text-sm text-muted-foreground">
              {'{ opacity: "@@#params.opacity" }'}
            </code>
          </div>
          <div className="rounded-lg border-2 border-primary bg-primary/10 p-5">
            <p className="mb-2 text-sm font-semibold text-primary">Resolved (new copy)</p>
            <code className="font-mono text-sm text-muted-foreground">
              {'{ opacity: 0.75 }'}
            </code>
          </div>
        </div>
      </Step>
    </div>
  )
}
