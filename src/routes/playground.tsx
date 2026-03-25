import { useState, useCallback, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PlaygroundLayout } from '#/components/playground/playground-layout'
import { JsonEditor } from '#/components/playground/json-editor'
import { MapRenderer } from '#/components/playground/map-renderer'
import { ParamsPanel } from '#/components/playground/params-panel'
import { ExampleSelector } from '#/components/playground/example-selector'
import { StatusIndicator } from '#/components/playground/status-indicator'
import { ResolvedJsonViewer } from '#/components/playground/resolved-json-viewer'
import { Switch } from '#/components/ui/switch'
import { ComponentPreview } from '#/components/playground/component-preview'
import { useConverter } from '#/hooks/use-converter'
import { useDebouncedValue } from '#/hooks/use-debounced-value'
import { resolveParams, createConverter } from '#/lib/converter'
import { inferParamControl } from '#/lib/param-inference'
import { examples } from '#/examples'
import type {
  ParamConfig,
  LegendConfig,
  ResolvedParams,
  InferredParam,
} from '#/lib/types'
import type { RawLegendConfig } from '#/lib/legend-param-mapping'
import type { VizzJson } from '@vizzuality/vizz-json'

export const Route = createFileRoute('/playground')({
  component: PlaygroundPage,
})

const DEBOUNCE_MS = 300

function buildDefaultParams(
  paramsConfig: readonly ParamConfig[],
): ResolvedParams {
  return Object.fromEntries(paramsConfig.map((p) => [p.key, p.default]))
}

function PlaygroundPage() {
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0)
  const [jsonString, setJsonString] = useState(() =>
    JSON.stringify(examples[0], null, 2),
  )
  const [paramValues, setParamValues] = useState<ResolvedParams>(() =>
    buildDefaultParams(examples[0].params_config),
  )
  const [showResolved, setShowResolved] = useState(false)

  // -------------------------------------------------------------------------
  // Example selection
  // -------------------------------------------------------------------------
  const handleExampleSelect = useCallback((index: number) => {
    const example = examples[index]
    setSelectedExampleIndex(index)
    setJsonString(JSON.stringify(example, null, 2))
    setParamValues(buildDefaultParams(example.params_config))
    setShowResolved(false)
  }, [])

  // -------------------------------------------------------------------------
  // Param change handler (immutable update)
  // -------------------------------------------------------------------------
  const handleParamChange = useCallback((key: string, value: unknown) => {
    setParamValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  // -------------------------------------------------------------------------
  // Resolution pipeline
  // -------------------------------------------------------------------------
  const debouncedJson = useDebouncedValue(jsonString, DEBOUNCE_MS)
  const { resolved, error } = useConverter(debouncedJson, paramValues)

  // Parse editor JSON once — all derived memos read from this
  const parsedJson = useMemo<Record<string, unknown> | null>(() => {
    try {
      return JSON.parse(debouncedJson) as Record<string, unknown>
    } catch {
      return null
    }
  }, [debouncedJson])

  // Parse params_config from the current editor JSON and infer controls
  const currentInferredParams = useMemo<readonly InferredParam[]>(() => {
    if (!parsedJson) return []
    const paramsConfig = parsedJson.params_config as
      | readonly ParamConfig[]
      | undefined
    return (paramsConfig ?? []).map(inferParamControl)
  }, [parsedJson])

  // Derive metadata from selected example
  const currentMetadata = useMemo(() => {
    const example = examples[selectedExampleIndex]
    return example.metadata
  }, [selectedExampleIndex])

  // Resolve legend_config through params so @@#params references update live
  const resolvedLegendConfig = useMemo<LegendConfig | null>(() => {
    if (!parsedJson) return null
    if (!parsedJson.legend_config) return null
    return resolveParams(
      parsedJson.legend_config as Record<string, unknown>,
      paramValues,
    ) as unknown as LegendConfig
  }, [parsedJson, paramValues])

  // Extract raw legend_config BEFORE resolution (for param key mapping)
  const rawLegendConfig = useMemo<RawLegendConfig | null>(() => {
    if (!parsedJson) return null
    return (parsedJson.legend_config as RawLegendConfig | undefined) ?? null
  }, [parsedJson])

  // Detect preview mode
  const previewMode = useMemo<'map' | 'components'>(() => {
    if (!parsedJson) return 'map'
    const metadata = parsedJson.metadata as { preview?: string } | undefined
    return metadata?.preview === 'components' ? 'components' : 'map'
  }, [parsedJson])

  // Singleton converter — created once per component lifetime
  const converterRef = useMemo<VizzJson>(() => createConverter(), [])

  // Resolve components for component preview mode
  const { resolvedComponents, componentError } = useMemo<{
    resolvedComponents: readonly unknown[] | null
    componentError: string | null
  }>(() => {
    if (previewMode !== 'components' || !parsedJson) {
      return { resolvedComponents: null, componentError: null }
    }
    try {
      const components = parsedJson.components
      if (!Array.isArray(components)) {
        return { resolvedComponents: null, componentError: null }
      }

      const wrapped = { components }
      const paramsResolved = resolveParams(wrapped, paramValues)
      const result = converterRef.resolve(
        paramsResolved,
      )
      const unwrapped = result.components

      return {
        resolvedComponents: Array.isArray(unwrapped) ? unwrapped : null,
        componentError: null,
      }
    } catch (err) {
      return {
        resolvedComponents: null,
        componentError: err instanceof Error ? err.message : String(err),
      }
    }
  }, [parsedJson, paramValues, previewMode, converterRef])

  // -------------------------------------------------------------------------
  // Toggle resolved view
  // -------------------------------------------------------------------------
  const handleToggleResolved = useCallback(() => {
    setShowResolved((prev) => !prev)
  }, [])

  // -------------------------------------------------------------------------
  // Layout
  // -------------------------------------------------------------------------
  return (
    <PlaygroundLayout
      sidebarHeader={
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <ExampleSelector
              selectedIndex={selectedExampleIndex}
              onSelect={handleExampleSelect}
            />
          </div>
          <StatusIndicator
            error={previewMode === 'components' ? componentError : error}
          />
        </div>
      }
      editor={
        <div className="relative isolate h-full overflow-hidden">
          <JsonEditor value={jsonString} onChange={setJsonString} />
          <ResolvedJsonViewer resolved={resolved} visible={showResolved} />
          <div className="absolute bottom-3 right-3 z-50 flex items-center gap-2 rounded-md border bg-background/90 px-3 py-1.5 shadow-sm backdrop-blur">
            <label
              htmlFor="show-resolved"
              className="text-xs text-muted-foreground"
            >
              Resolved
            </label>
            <Switch
              id="show-resolved"
              checked={showResolved}
              onCheckedChange={handleToggleResolved}
            />
          </div>
        </div>
      }
      map={
        previewMode === 'components' ? (
          <ComponentPreview components={resolvedComponents} />
        ) : (
          <MapRenderer resolvedConfig={resolved} error={error} />
        )
      }
      params={
        <ParamsPanel
          metadata={currentMetadata}
          paramsConfig={currentInferredParams}
          legendConfig={resolvedLegendConfig}
          rawLegendConfig={rawLegendConfig}
          values={paramValues}
          onChange={handleParamChange}
        />
      }
    />
  )
}
