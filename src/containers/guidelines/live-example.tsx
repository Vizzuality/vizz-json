import type { ParamConfig } from '#/lib/types'
import { MapRenderer } from '#/containers/playground/map-renderer'
import { InteractiveExample } from './interactive-example'

type LiveExampleProps = {
  readonly title: string
  readonly config: Record<string, unknown>
  readonly paramsConfig: readonly ParamConfig[]
  readonly description?: string
}

export function LiveExample({
  title,
  config,
  paramsConfig,
  description,
}: LiveExampleProps) {
  return (
    <InteractiveExample
      title={title}
      config={config}
      paramsConfig={paramsConfig}
      description={description}
      headerBadge="live preview"
    >
      {(resolved) => (
        <div className="h-64">
          <MapRenderer resolvedConfig={resolved.value} error={resolved.error} />
        </div>
      )}
    </InteractiveExample>
  )
}
