import type { VizzJson } from '@vizzuality/vizz-json'
import { resolveParams } from './params-resolver'
import { createConverter } from './converter-config'
import type { ResolvedParams } from '../types'

export { resolveParams } from './params-resolver'
export { createConverter } from './converter-config'
export { registeredFunctions } from './functions'
export { buildLayerItems } from './build-layer-items'
export type { BuiltLayerItem, BuildLayerItemsInput } from './build-layer-items'

let converterInstance: VizzJson | null = null

function getConverter(): VizzJson {
  if (!converterInstance) {
    converterInstance = createConverter()
  }
  return converterInstance
}

export function resetConverter() {
  converterInstance = null
}

function hasRemainingPrefixes(obj: unknown): boolean {
  if (typeof obj === 'string') return obj.startsWith('@@')
  if (Array.isArray(obj)) return obj.some(hasRemainingPrefixes)
  if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>).some(
      ([k, v]) => k.startsWith('@@') || hasRemainingPrefixes(v),
    )
  }
  return false
}

export function resolveConfig(
  config: Readonly<Record<string, unknown>>,
  params: ResolvedParams,
): Record<string, unknown> {
  const paramsResolved = resolveParams(config, params)

  if (hasRemainingPrefixes(paramsResolved)) {
    return getConverter().resolve(paramsResolved)
  }

  return paramsResolved
}
