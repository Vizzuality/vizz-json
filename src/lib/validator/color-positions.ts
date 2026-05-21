export const COLOR_PAINT_PROPS = [
  'fill-color',
  'fill-outline-color',
  'circle-color',
  'circle-stroke-color',
  'line-color',
  'heatmap-color',
  'text-color',
  'text-halo-color',
  'icon-color',
] as const

export const OPACITY_PAINT_PROPS = [
  'fill-opacity',
  'circle-opacity',
  'line-opacity',
  'heatmap-opacity',
  'text-opacity',
  'icon-opacity',
  'raster-opacity',
] as const

export type ColorPaintProp = (typeof COLOR_PAINT_PROPS)[number]
export type OpacityPaintProp = (typeof OPACITY_PAINT_PROPS)[number]
