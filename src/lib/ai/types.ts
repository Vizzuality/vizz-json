export type RendererId = 'maplibre' | 'mapbox'

export type MapView = {
  readonly longitude: number
  readonly latitude: number
  readonly zoom: number
}

export type BasemapId =
  | 'openfreemap-liberty'
  | 'openfreemap-positron'
  | 'openfreemap-dark'
  | 'osm-demotiles'

export type RendererControls = {
  readonly renderer: RendererId
  readonly mapboxToken?: string
  readonly mapboxStyleUrl?: string
  readonly mapView?: MapView
  readonly basemap?: BasemapId
}

export const DEFAULT_MAP_VIEW: MapView = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
}

export const BASEMAP_OPTIONS: ReadonlyArray<{
  readonly id: BasemapId
  readonly label: string
  readonly styleUrl: string
}> = [
  {
    id: 'openfreemap-liberty',
    label: 'OpenFreeMap Liberty',
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
  },
  {
    id: 'openfreemap-positron',
    label: 'OpenFreeMap Positron',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
  },
  {
    id: 'openfreemap-dark',
    label: 'OpenFreeMap Dark',
    styleUrl: 'https://tiles.openfreemap.org/styles/dark',
  },
  {
    id: 'osm-demotiles',
    label: 'MapLibre Demotiles',
    styleUrl: 'https://demotiles.maplibre.org/style.json',
  },
]

export const DEFAULT_BASEMAP: BasemapId = 'openfreemap-liberty'

export function initialBasemapForTheme(): BasemapId {
  if (typeof document === 'undefined') return 'openfreemap-positron'
  return document.documentElement.classList.contains('dark')
    ? 'openfreemap-dark'
    : 'openfreemap-positron'
}

export function basemapStyleUrl(id: BasemapId | undefined): string {
  const found = BASEMAP_OPTIONS.find((b) => b.id === (id ?? DEFAULT_BASEMAP))
  return (found ?? BASEMAP_OPTIONS[0]).styleUrl
}

export function basemapLabel(id: BasemapId | undefined): string {
  const found = BASEMAP_OPTIONS.find((b) => b.id === (id ?? DEFAULT_BASEMAP))
  return (found ?? BASEMAP_OPTIONS[0]).label
}
