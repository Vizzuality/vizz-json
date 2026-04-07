export type GradientStop = {
  readonly id: string
  readonly color: string
  readonly position: number
  readonly dataValue: number
  readonly label: string
  readonly colorParamKey?: string
  readonly thresholdParamKey?: string
}

export type GradientEditorState = {
  readonly stops: readonly GradientStop[]
  readonly selectedStopId: string | null
  readonly isDirty: boolean
}

export function interpolateHexColor(
  color1: string,
  color2: string,
  t: number,
): string {
  const clamped = Math.max(0, Math.min(1, t))
  const r1 = parseInt(color1.slice(1, 3), 16)
  const g1 = parseInt(color1.slice(3, 5), 16)
  const b1 = parseInt(color1.slice(5, 7), 16)
  const r2 = parseInt(color2.slice(1, 3), 16)
  const g2 = parseInt(color2.slice(3, 5), 16)
  const b2 = parseInt(color2.slice(5, 7), 16)
  const r = Math.round(r1 + (r2 - r1) * clamped)
  const g = Math.round(g1 + (g2 - g1) * clamped)
  const b = Math.round(b1 + (b2 - b1) * clamped)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function positionToDataValue(
  position: number,
  rangeMin: number,
  rangeMax: number,
): number {
  if (rangeMin === rangeMax) return rangeMin
  return Math.round(rangeMin + (rangeMax - rangeMin) * position)
}
