import { useCallback, useMemo, useState } from 'react'
import { AiLayout } from './ai-layout'
import type { AiViewMode } from './ai-layout'
import { JsonViewer } from './json/json-viewer'
import { RendererSwitch } from './map/renderer-switch'
import { ExportMenu, buildFilename } from './export/export-menu'
import { ConfigPanel } from './config/config-panel'
import { ParamsPanel } from '#/containers/playground/params-panel'
import { useConverter } from '#/hooks/use-converter'
import { inferParamControl } from '#/lib/param-inference'
import type { RendererControls as RendererControlsValue } from '#/lib/ai/types'
import type {
  ParamConfig,
  ResolvedParams,
  LegendConfig,
  ExampleMetadata,
} from '#/lib/types'

type AiSchema = {
  readonly metadata: ExampleMetadata
  readonly config: Record<string, unknown>
  readonly params_config: readonly ParamConfig[]
  readonly legend_config?: LegendConfig
}

export function AiPage() {
  const [renderer, setRenderer] = useState<RendererControlsValue>({
    renderer: 'maplibre',
  })
  const [viewMode, setViewMode] = useState<AiViewMode>('chat')
  const [schema] = useState<AiSchema | null>(null)
  const [paramValues, setParamValues] = useState<ResolvedParams>({})
  const [, setChatError] = useState<string | null>(null)

  const schemaJson = useMemo(
    () => (schema ? JSON.stringify(schema, null, 2) : ''),
    [schema],
  )

  const { resolved, error } = useConverter(schemaJson || '{}', paramValues)

  const inferred = useMemo(
    () => (schema ? schema.params_config.map(inferParamControl) : []),
    [schema],
  )

  const handleParamChange = useCallback((key: string, value: unknown) => {
    setParamValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  return (
    <AiLayout
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      toolbarActions={
        <ExportMenu
          schemaJson={schemaJson}
          filename={buildFilename(schema?.metadata.title)}
          onError={setChatError}
        />
      }
      chat={
        /* TODO Task 16: replace stub with real chat from Dexie */
        <div className="p-3 text-xs text-muted-foreground">
          Chat (rewiring in progress — see Task 16)
        </div>
      }
      viewer={<JsonViewer json={schemaJson} />}
      config={
        <ConfigPanel renderer={renderer} onRendererChange={setRenderer} />
      }
      map={
        <RendererSwitch
          resolvedConfig={resolved}
          error={error}
          renderer={renderer}
        />
      }
      params={
        schema ? (
          <ParamsPanel
            metadata={{
              title: schema.metadata.title,
              tier: schema.metadata.tier,
            }}
            paramsConfig={inferred}
            legendConfig={schema.legend_config ?? null}
            rawLegendConfig={null}
            values={paramValues}
            onChange={handleParamChange}
          />
        ) : (
          <div className="p-3 text-xs text-muted-foreground">
            No schema yet — describe a map in the chat.
          </div>
        )
      }
    />
  )
}
