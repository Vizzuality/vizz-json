import { useState, useCallback, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PlaygroundLayout } from '#/containers/playground/playground-layout'
import { JsonEditor } from '#/containers/playground/json-editor'
import { MapRenderer } from '#/containers/playground/map-renderer'
import { ParamsPanel } from '#/containers/playground/params-panel'
import { ExampleSelector } from '#/containers/playground/example-selector'
import { StatusIndicator } from '#/containers/playground/status-indicator'
import { ResolvedJsonViewer } from '#/containers/playground/resolved-json-viewer'
import { Switch } from '#/components/ui/switch'
import { ComponentPreview } from '#/containers/playground/component-preview'
import { useDebouncedValue } from '#/hooks/use-debounced-value'
import { useResolutionPipeline, buildDefaultParams } from '#/lib/pipeline'
import {
  examples,
  EXAMPLE_SLUGS,
  DEFAULT_EXAMPLE_SLUG,
  getExampleIndexBySlug,
  getSlugByIndex,
} from '#/examples'
import type { ParamConfig, ResolvedParams } from '#/lib/types'

const searchSchema = z.object({
  example: z
    .enum(EXAMPLE_SLUGS)
    .default(DEFAULT_EXAMPLE_SLUG)
    .catch(DEFAULT_EXAMPLE_SLUG),
})

export const Route = createFileRoute('/playground')({
  validateSearch: searchSchema,
  component: PlaygroundPage,
})

const DEBOUNCE_MS = 300

function PlaygroundPage() {
  const { example: exampleSlug } = Route.useSearch()
  const navigate = Route.useNavigate()
  const selectedExampleIndex = getExampleIndexBySlug(exampleSlug) ?? 0

  const [jsonString, setJsonString] = useState(() =>
    JSON.stringify(examples[selectedExampleIndex], null, 2),
  )
  const [paramValues, setParamValues] = useState<ResolvedParams>(() =>
    buildDefaultParams(examples[selectedExampleIndex].params_config),
  )
  const [showResolved, setShowResolved] = useState(false)

  const handleExampleSelect = useCallback(
    (index: number) => {
      const slug = getSlugByIndex(index)
      if (!slug) return

      const example = examples[index]
      setJsonString(JSON.stringify(example, null, 2))
      setParamValues(buildDefaultParams(example.params_config))
      setShowResolved(false)

      navigate({ search: { example: slug }, replace: true })
    },
    [navigate],
  )

  const handleParamChange = useCallback((key: string, value: unknown) => {
    setParamValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleGradientApply = useCallback((updatedJson: string) => {
    setJsonString(updatedJson)
    try {
      const parsed = JSON.parse(updatedJson) as Record<string, unknown>
      const paramsConfig = parsed.params_config as
        | readonly ParamConfig[]
        | undefined
      if (paramsConfig) {
        setParamValues(buildDefaultParams(paramsConfig))
      }
    } catch {
      // JSON parse failed — the editor content will show the error
    }
  }, [])

  const debouncedJson = useDebouncedValue(jsonString, DEBOUNCE_MS)

  const parsedConfig = useMemo<Record<string, unknown> | null>(() => {
    try {
      return JSON.parse(debouncedJson) as Record<string, unknown>
    } catch {
      return null
    }
  }, [debouncedJson])

  const pipeline = useResolutionPipeline(parsedConfig, paramValues)

  const handleToggleResolved = useCallback(() => {
    setShowResolved((prev) => !prev)
  }, [])

  const resolvedForViewer =
    pipeline.output.kind === 'map' ? pipeline.output.resolvedConfig : null

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
          <StatusIndicator error={pipeline.output.error} />
        </div>
      }
      editor={
        <div className="relative isolate h-full overflow-hidden">
          <JsonEditor value={jsonString} onChange={setJsonString} />
          <ResolvedJsonViewer
            resolved={resolvedForViewer}
            visible={showResolved}
          />
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
        pipeline.previewMode === 'components' ? (
          <ComponentPreview
            components={
              pipeline.output.kind === 'components'
                ? pipeline.output.resolvedComponents
                : null
            }
          />
        ) : (
          <MapRenderer
            resolvedConfig={
              pipeline.output.kind === 'map'
                ? pipeline.output.resolvedConfig
                : null
            }
            error={pipeline.output.error}
          />
        )
      }
      params={
        <ParamsPanel
          metadata={pipeline.metadata}
          paramsConfig={pipeline.inferredParams}
          legendConfig={pipeline.resolvedLegendConfig}
          legendParamMapping={pipeline.legendParamMapping}
          orphanLegendParams={pipeline.orphanLegendParams}
          values={paramValues}
          onChange={handleParamChange}
          currentJson={debouncedJson}
          onApply={handleGradientApply}
        />
      }
    />
  )
}
