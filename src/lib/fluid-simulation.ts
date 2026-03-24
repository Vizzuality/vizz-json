export type Particle = {
  readonly x: number
  readonly y: number
  readonly vx: number
  readonly vy: number
}

export type MouseState = {
  readonly x: number
  readonly y: number
  readonly prevX: number
  readonly prevY: number
  readonly active: boolean
}

export type RgbColor = {
  readonly r: number
  readonly g: number
  readonly b: number
}

export type ParticleColor = {
  readonly hue: number
  readonly saturation: number
  readonly lightness: number
  readonly alpha: number
}

export type Bounds = {
  readonly width: number
  readonly height: number
}

export type SimulationConfig = {
  readonly particleCount: number
  readonly canvasScale: number
  readonly mouseRadius: number
  readonly mouseStrength: number
  readonly friction: number
  readonly fadeAlpha: number
  readonly maxParticleAlpha: number
}

export const DEFAULT_CONFIG: SimulationConfig = {
  particleCount: 150,
  canvasScale: 0.5,
  mouseRadius: 80,
  mouseStrength: 0.4,
  friction: 0.96,
  fadeAlpha: 0.06,
  maxParticleAlpha: 0.7,
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

export function calculateParticleColor(
  speed: number,
  isDark: boolean,
): ParticleColor {
  const t = Math.min(speed / 8, 1)
  const hue = 130 + t * 140
  const saturation = Math.min(60 + t * 20, 85)
  const lightness = 50
  const rawAlpha = Math.min(speed * 0.12, DEFAULT_CONFIG.maxParticleAlpha)
  const alpha = isDark ? rawAlpha : rawAlpha * 0.5

  return { hue, saturation, lightness, alpha }
}

export function updateParticle(
  particle: Particle,
  mouse: MouseState,
  bounds: Bounds,
  config: SimulationConfig,
): Particle {
  let vx = particle.vx
  let vy = particle.vy

  if (mouse.active) {
    const dx = particle.x - mouse.x
    const dy = particle.y - mouse.y
    const dist = Math.hypot(dx, dy)

    if (dist < config.mouseRadius) {
      const influence =
        Math.exp(-(dist * dist) / (config.mouseRadius * config.mouseRadius)) *
        config.mouseStrength
      const mouseDx = mouse.x - mouse.prevX
      const mouseDy = mouse.y - mouse.prevY
      vx += mouseDx * influence
      vy += mouseDy * influence
    }
  }

  vx *= config.friction
  vy *= config.friction

  let x = particle.x + vx
  let y = particle.y + vy

  x = ((x % bounds.width) + bounds.width) % bounds.width
  y = ((y % bounds.height) + bounds.height) % bounds.height

  return { x, y, vx, vy }
}

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

export function createParticles(
  count: number,
  width: number,
  height: number,
): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: 0,
    vy: 0,
  }))
}
