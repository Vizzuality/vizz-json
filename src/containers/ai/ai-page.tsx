import { useCallback, useMemo, useState } from 'react'
import { AiLayout } from './ai-layout'
import { AiChat } from './chat/ai-chat'
import { JsonViewer } from './json/json-viewer'
import { RendererSwitch } from './map/renderer-switch'
import { ExportMenu, buildFilename } from './export/export-menu'
import { ConfigPanel } from './config/config-panel'
import { Button } from '#/components/ui/button'
import { ButtonGroup } from '#/components/ui/button-group'
import { ParamsPanel } from '#/containers/playground/params-panel'
import { useConverter } from '#/hooks/use-converter'
import { inferParamControl } from '#/lib/param-inference'
import { postProcess } from '#/lib/ai/post-process'
import { validateStyle } from '#/lib/ai/style-validator'
import type { AiOutput } from '#/lib/ai/output-schema'
import type { RendererControls as RendererControlsValue } from '#/lib/ai/types'
import type {
  ParamConfig,
  ResolvedParams,
  LegendConfig,
  ExampleMetadata,
} from '#/lib/types'

const PROMPT_CHIPS = [
  'Show Sentinel-2 imagery with an opacity slider',
  'Heatmap of earthquakes from https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson',
  'Choropleth of US states by population',
  'Vector circles sized by magnitude with a color scale',
] as const

type ViewMode = 'chat' | 'json' | 'config'

type AiSchema = {
  readonly metadata: ExampleMetadata
  readonly config: Record<string, unknown>
  readonly params_config: readonly ParamConfig[]
  readonly legend_config?: LegendConfig
}

function buildDefaultParams(
  paramsConfig: readonly ParamConfig[],
): ResolvedParams {
  return Object.fromEntries(paramsConfig.map((p) => [p.key, p.default]))
}

export function AiPage() {
  const [renderer, setRenderer] = useState<RendererControlsValue>({
    renderer: 'maplibre',
  })
  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [schema, setSchema] = useState<AiSchema | null>(null)
  const [paramValues, setParamValues] = useState<ResolvedParams>({})
  const [chatError, setChatError] = useState<string | null>(null)

  const handleResult = useCallback(
    (output: AiOutput) => {
      const styleErrors = validateStyle(output.style, renderer.renderer)
      if (styleErrors.length > 0) {
        setChatError(
          `Generated style invalid: ${styleErrors.map((e) => e.message).join('; ')}`,
        )
        return
      }
      try {
        const processed = postProcess(output) as AiSchema
        setSchema(processed)
        setParamValues(buildDefaultParams(processed.params_config))
        setChatError(null)
      } catch (err) {
        setChatError(err instanceof Error ? err.message : String(err))
      }
    },
    [renderer.renderer],
  )

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

  const jsonDisabled = !schema

  return (
    <AiLayout
      viewMode={viewMode}
      toolbar={
        <div className="flex h-12 items-center justify-between border-b px-4">
          <ButtonGroup>
            <Button
              size="sm"
              variant={viewMode === 'chat' ? 'default' : 'outline'}
              aria-pressed={viewMode === 'chat'}
              onClick={() => setViewMode('chat')}
            >
              Chat
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'json' ? 'default' : 'outline'}
              aria-pressed={viewMode === 'json'}
              onClick={() => setViewMode('json')}
              disabled={jsonDisabled}
            >
              JSON
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'config' ? 'default' : 'outline'}
              aria-pressed={viewMode === 'config'}
              onClick={() => setViewMode('config')}
            >
              Config
            </Button>
          </ButtonGroup>
          <div className="flex items-center gap-2">
            <ExportMenu
              schemaJson={schemaJson}
              filename={buildFilename(schema?.metadata.title)}
              onError={setChatError}
            />
          </div>
        </div>
      }
      chat={
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <AiChat
              renderer={renderer}
              onResult={handleResult}
              onError={setChatError}
              promptChips={PROMPT_CHIPS}
            />
          </div>
          {chatError && (
            <div className="border-t bg-destructive/10 p-2 text-xs text-destructive">
              {chatError}
            </div>
          )}
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
