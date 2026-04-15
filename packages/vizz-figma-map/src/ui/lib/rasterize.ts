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
    position: container.style.position,
    left: container.style.left,
    top: container.style.top,
    zIndex: container.style.zIndex,
    pointerEvents: container.style.pointerEvents,
  }

  // Move offscreen so the enlarged canvas is not visible in the plugin viewport
  // while we resize to export dimensions.
  container.style.position = 'fixed'
  container.style.left = '-100000px'
  container.style.top = '0'
  container.style.zIndex = '-1'
  container.style.pointerEvents = 'none'
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
  container.style.position = original.position
  container.style.left = original.left
  container.style.top = original.top
  container.style.zIndex = original.zIndex
  container.style.pointerEvents = original.pointerEvents
  map.resize()

  const buffer = await blob.arrayBuffer()
  return new Uint8Array(buffer)
}
