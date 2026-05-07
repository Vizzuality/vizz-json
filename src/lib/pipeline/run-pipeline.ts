import { getConverter, resolveConfig } from '#/lib/converter'
import { resolveParams } from '#/lib/converter/params-resolver'
import { inferParamControl } from '#/lib/param-inference'
import {
  extractLegendParamKeys,
  getOrphanLegendParams,
} from '#/lib/legend-param-mapping'
import type {
  ExampleMetadata,
  InferredParam,
  LegendConfig,
  ParamConfig,
  ResolvedParams,
} from '#/lib/types'
import type { RawLegendConfig } from '#/lib/legend-param-mapping'
import type { PipelineOutput, PipelineResult } from './types'

const EMPTY_RESULT: PipelineResult = {
  inferredParams: [],
  rawLegendConfig: null,
  resolvedLegendConfig: null,
  legendParamMapping: new Map(),
  orphanLegendParams: [],
  metadata: null,
  previewMode: 'map',
  output: { kind: 'map', resolvedConfig: null, error: null },
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

  const rawLegendConfig =
    (parsedConfig.legend_config as RawLegendConfig | undefined) ?? null

  const resolvedLegendConfig = rawLegendConfig
    ? (resolveParams(
        rawLegendConfig as unknown as Record<string, unknown>,
        paramValues,
      ) as unknown as LegendConfig)
    : null

  const legendParamMapping = extractLegendParamKeys(rawLegendConfig)
  const legendParams = inferredParams.filter((p) => p.group === 'legend')
  const orphanLegendParams = getOrphanLegendParams(
    legendParams,
    legendParamMapping,
    rawLegendConfig?.type,
  )

  const output =
    previewMode === 'components'
      ? runComponentsBranch(parsedConfig, paramValues)
      : runMapBranch(parsedConfig, paramValues)

  return {
    inferredParams,
    rawLegendConfig,
    resolvedLegendConfig,
    legendParamMapping,
    orphanLegendParams,
    metadata,
    previewMode,
    output,
  }
}
