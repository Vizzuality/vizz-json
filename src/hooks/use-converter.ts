import { useMemo } from 'react'
import { resolveConfig } from '#/lib/converter'
import type { ResolvedParams } from '#/lib/types'

type ConverterResult = {
  readonly resolved: Record<string, unknown> | null
  readonly error: string | null
}

export function useConverter(
  jsonString: string,
  params: ResolvedParams,
): ConverterResult {
  return useMemo(() => {
    try {
      const parsed = JSON.parse(jsonString)
      const config = parsed.config ?? parsed
      const resolved = resolveConfig(config, params)
      return { resolved, error: null }
    } catch (err) {
      return {
        resolved: null,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }, [jsonString, params])
}
