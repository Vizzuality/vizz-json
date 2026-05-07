import type { ParamConfig, ResolvedParams } from '#/lib/types'

export function buildDefaultParams(
  paramsConfig: readonly ParamConfig[],
): ResolvedParams {
  return Object.fromEntries(paramsConfig.map((p) => [p.key, p.default]))
}
