import type { Map as MaplibreMap } from 'maplibre-gl'

export interface RasterizeOptions {
  width: number
  height: number
  pixelRatio?: number
}

/**
 * Rasterize the current MapLibre canvas at the requested export size.
 *
 * Approach: resize the map container to the logical export dimensions, call
 * `map.resize()` so MapLibre picks up new size, wait for the map to reach
 * `idle`, grab the PNG blob, then restore the original container size.
 *
 * Returns a `Uint8Array` of PNG bytes ready to send over postMessage.
 */
export async function rasterizeMap(
  map: MaplibreMap,
  container: HTMLElement,
  { width, height }: RasterizeOptions,
): Promise<Uint8Array> {
  const original = {
    width: container.style.width,
    height: container.style.height,
  }

  container.style.width = `${width}px`
  container.style.height = `${height}px`
  map.resize()

  await new Promise<void>((resolve) => {
    map.once('idle', () => resolve())
  })

  const canvas = map.getCanvas()
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/png',
    )
  })

  container.style.width = original.width
  container.style.height = original.height
  map.resize()

  const buffer = await blob.arrayBuffer()
  return new Uint8Array(buffer)
}
