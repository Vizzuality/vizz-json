import type { RgbColor } from './types'

export function shouldDisableSimulation(
  userAgent: string,
  innerWidth: number,
  deviceMemory: number | undefined,
  hardwareConcurrency: number | undefined,
): boolean {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent)
  const isSmallScreen = innerWidth < 768
  const lowMemory = deviceMemory !== undefined && deviceMemory < 4
  const lowCores = hardwareConcurrency !== undefined && hardwareConcurrency < 4

  return isMobile || isSmallScreen || lowMemory || lowCores
}

export function parseBgColor(computed: string): RgbColor {
  const match = computed.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/)
  if (!match) return { r: 0, g: 0, b: 0 }
  return {
    r: Math.round(Number(match[1])),
    g: Math.round(Number(match[2])),
    b: Math.round(Number(match[3])),
  }
}
