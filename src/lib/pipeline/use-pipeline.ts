import { useMemo } from 'react'
import { runResolutionPipeline } from './run-pipeline'
import type { PipelineResult } from './types'
import type { ResolvedParams } from '#/lib/types'

export function useResolutionPipeline(
  parsedConfig: Readonly<Record<string, unknown>> | null,
  paramValues: ResolvedParams,
): PipelineResult {
  return useMemo(
    () => runResolutionPipeline(parsedConfig, paramValues),
    [parsedConfig, paramValues],
  )
}
