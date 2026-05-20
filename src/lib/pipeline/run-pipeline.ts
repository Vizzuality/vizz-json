import { getConverter, resolveConfig } from '#/lib/converter'
import { resolveParams } from '#/lib/converter/params-resolver'
import { inferParamControl } from '#/lib/param-inference'
import {
  extractSourceLegendMappings,
  getOrphanLegendParamsAcrossSources,
} from '#/lib/legend-param-mapping'
import { collectParamRefs } from '#/lib/layer-groups'
import type {
  ExampleMetadata,
  InferredParam,
  LegendConfig,
  ParamConfig,
  ResolvedParams,
} from '#/lib/types'
import type { PipelineOutput, PipelineResult, SourceLegendEntry } from './types'

const EMPTY_RESULT: PipelineResult = {
  inferredParams: [],
  sourceLegends: [],
  orphanLegendParams: [],
  metadata: null,
  previewMode: 'map',
  output: { kind: 'map', resolvedConfig: null, error: null },
  parsedConfig: null,
}

function readStylesArray(
  parsedConfig: Readonly<Record<string, unknown>>,
): readonly Record<string, unknown>[] {
  const withConfig = parsedConfig.config as Record<string, unknown> | undefined
  const styles = withConfig?.styles ?? parsedConfig.styles
  return Array.isArray(styles)
    ? (styles as readonly Record<string, unknown>[])
    : []
}

function deriveInferredParams(
  parsedConfig: Readonly<Record<string, unknown>>,
): readonly InferredParam[] {
  const paramsConfig = parsedConfig.params_config
  if (!Array.isArray(paramsConfig)) return []
  return (paramsConfig as readonly ParamConfig[]).map(inferParamControl)
}

function deriveMetadata(
  parsedConfig: Readonly<Record<string, unknown>>,
): ExampleMetadata | null {
  const metadata = parsedConfig.metadata
  if (!metadata || typeof metadata !== 'object') return null
  return metadata as ExampleMetadata
}

function derivePreviewMode(
  metadata: ExampleMetadata | null,
): 'map' | 'components' {
  return metadata?.preview === 'components' ? 'components' : 'map'
}

function runComponentsBranch(
  parsedConfig: Readonly<Record<string, unknown>>,
  paramValues: ResolvedParams,
): PipelineOutput {
  const components = parsedConfig.components
  if (!Array.isArray(components)) {
    return { kind: 'components', resolvedComponents: null, error: null }
  }
  try {
    const wrapped = { components }
    const paramsResolved = resolveParams(wrapped, paramValues)
    const result = getConverter().resolve(paramsResolved)
    const unwrapped = result.components
    return {
      kind: 'components',
      resolvedComponents: Array.isArray(unwrapped) ? unwrapped : null,
      error: null,
    }
  } catch (err) {
    return {
      kind: 'components',
      resolvedComponents: null,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

function runMapBranch(
  parsedConfig: Readonly<Record<string, unknown>>,
  paramValues: ResolvedParams,
): PipelineOutput {
  try {
    const innerConfig =
      (parsedConfig.config as Record<string, unknown> | undefined) ??
      parsedConfig
    const resolvedConfig = resolveConfig(innerConfig, paramValues)
    return { kind: 'map', resolvedConfig, error: null }
  } catch (err) {
    return {
      kind: 'map',
      resolvedConfig: null,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export function runResolutionPipeline(
  parsedConfig: Readonly<Record<string, unknown>> | null,
  paramValues: ResolvedParams,
): PipelineResult {
  if (!parsedConfig) return EMPTY_RESULT

  const inferredParams = deriveInferredParams(parsedConfig)
  const metadata = deriveMetadata(parsedConfig)
  const previewMode = derivePreviewMode(metadata)

  const sourceLegendRaw = extractSourceLegendMappings(parsedConfig)
  const legendParams = inferredParams.filter((p) => p.group === 'legend')
  const stylesArray = readStylesArray(parsedConfig)

  const sourceLegends: readonly SourceLegendEntry[] = sourceLegendRaw.map(
    (entry) => {
      const resolvedLegend = resolveParams(
        entry.rawLegend as unknown as Record<string, unknown>,
        paramValues,
      ) as unknown as LegendConfig

      // Collect all @@#params refs used by this source's styles
      const refs = new Set<string>()
      for (const style of stylesArray) {
        if (style.source === entry.sourceId) {
          collectParamRefs(style.paint, refs)
          collectParamRefs(style.layout, refs)
          collectParamRefs(style.filter, refs)
        }
      }

      // Color-stop param keys bound by legend item mapping
      const colorKeys = new Set<string>()
      for (const mapping of entry.paramMapping.values()) {
        if (mapping.valueParamKey) colorKeys.add(mapping.valueParamKey)
      }

      // Threshold params: slider + group=legend + referenced by this source's styles + not a color stop
      const thresholdParams = legendParams.filter(
        (p) =>
          p.control_type === 'slider' &&
          refs.has(p.key) &&
          !colorKeys.has(p.key),
      )

      return {
        sourceId: entry.sourceId,
        rawLegend: entry.rawLegend,
        resolvedLegend,
        paramMapping: entry.paramMapping,
        thresholdParams,
      }
    },
  )
  const orphanLegendParams = getOrphanLegendParamsAcrossSources(
    legendParams,
    sourceLegendRaw,
  )

  const output =
    previewMode === 'components'
      ? runComponentsBranch(parsedConfig, paramValues)
      : runMapBranch(parsedConfig, paramValues)

  return {
    inferredParams,
    sourceLegends,
    orphanLegendParams,
    metadata,
    previewMode,
    output,
    parsedConfig,
  }
}
