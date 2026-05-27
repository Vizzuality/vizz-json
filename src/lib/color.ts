export type ParsedColor = {
  readonly hex: string
  readonly alpha: number
}

const HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i
const HEX6 = /^#([0-9a-f]{6})$/i
const HEX8 = /^#([0-9a-f]{6})([0-9a-f]{2})$/i
const RGBA =
  /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i

const FALLBACK: ParsedColor = { hex: '#000000', alpha: 1 }

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function clamp255(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(255, Math.round(n)))
}

function toHexByte(n: number): string {
  return clamp255(n).toString(16).padStart(2, '0')
}

export function parseColor(input: unknown): ParsedColor {
  if (typeof input !== 'string') return FALLBACK
  const value = input.trim()

  const m3 = HEX3.exec(value)
  if (m3) {
    return {
      hex: `#${m3[1]}${m3[1]}${m3[2]}${m3[2]}${m3[3]}${m3[3]}`.toLowerCase(),
      alpha: 1,
    }
  }

  const m6 = HEX6.exec(value)
  if (m6) {
    return { hex: `#${m6[1].toLowerCase()}`, alpha: 1 }
  }

  const m8 = HEX8.exec(value)
  if (m8) {
    const alpha = parseInt(m8[2], 16) / 255
    return {
      hex: `#${m8[1].toLowerCase()}`,
      alpha: Math.round(alpha * 100) / 100,
    }
  }

  const mrgba = RGBA.exec(value)
  if (mrgba) {
    const hex = `#${toHexByte(Number(mrgba[1]))}${toHexByte(Number(mrgba[2]))}${toHexByte(Number(mrgba[3]))}`
    const rawAlpha = mrgba[4] as string | undefined
    const alpha = rawAlpha ? clamp01(Number(rawAlpha)) : 1
    return { hex, alpha: Math.round(alpha * 100) / 100 }
  }

  return FALLBACK
}

export function formatColor({ hex, alpha }: ParsedColor): string {
  const a = clamp01(alpha)
  if (a >= 1) return hex.toLowerCase()
  const m = HEX6.exec(hex)
  if (!m) return hex.toLowerCase()
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`
}

export function colorToCss(input: unknown): string {
  return formatColor(parseColor(input))
}

export function isColorString(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const v = value.trim()
  return HEX3.test(v) || HEX6.test(v) || HEX8.test(v) || RGBA.test(v)
}
