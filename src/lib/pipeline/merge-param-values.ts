import type { ParamConfig, ResolvedParams } from '#/lib/types'

export function mergeParamValues(
  paramsConfig: readonly ParamConfig[],
  prior: ResolvedParams,
): ResolvedParams {
  const out: Record<string, unknown> = {}
  for (const param of paramsConfig) {
    out[param.key] = Object.prototype.hasOwnProperty.call(prior, param.key)
      ? prior[param.key]
      : param.default
  }
  return out
}
