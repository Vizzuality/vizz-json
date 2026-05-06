import { RendererSection } from './renderer-section'
import type { RendererControls as RendererControlsValue } from '#/lib/ai/types'

type Props = {
  readonly renderer: RendererControlsValue
  readonly onRendererChange: (next: RendererControlsValue) => void
}

export function ConfigPanel({ renderer, onRendererChange }: Props) {
  return (
    <div className="h-full overflow-y-auto">
      <RendererSection value={renderer} onChange={onRendererChange} />
    </div>
  )
}
