import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { validate as validateMapbox } from '@mapbox/mapbox-gl-style-spec'
import type { RendererId } from './types'

export type StyleError = { readonly message: string; readonly line?: number }

export function validateStyle(
  style: unknown,
  renderer: RendererId,
): readonly StyleError[] {
  const errors =
    renderer === 'mapbox'
      ? validateMapbox(style as never)
      : validateStyleMin(style as never)
  return errors.map((e: { message: string; line?: number | null }) => ({
    message: e.message,
    line: e.line ?? undefined,
  }))
}
