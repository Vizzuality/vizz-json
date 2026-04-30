export type RendererId = 'maplibre' | 'mapbox'

export type RendererControls = {
  readonly renderer: RendererId
  readonly mapboxToken?: string
  readonly mapboxStyleUrl?: string
}
