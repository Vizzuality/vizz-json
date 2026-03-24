export type FluidConfig = {
  readonly simResolution: number
  readonly dyeDissipation: number
  readonly velocityDissipation: number
  readonly pressureIterations: number
  readonly curl: number
  readonly splatRadiusMin: number
  readonly splatRadiusMax: number
  readonly splatForce: number
  readonly colorConfig: {
    readonly hueMin: number
    readonly hueMax: number
    readonly saturationMin: number
    readonly saturationMax: number
    readonly lightness: number
  }
}

export const DEFAULT_FLUID_CONFIG: FluidConfig = {
  simResolution: 128,
  dyeDissipation: 0.985,
  velocityDissipation: 0.98,
  pressureIterations: 20,
  curl: 15,
  splatRadiusMin: 0.15,
  splatRadiusMax: 0.5,
  splatForce: 6000,
  colorConfig: {
    hueMin: 148,
    hueMax: 270,
    saturationMin: 30,
    saturationMax: 50,
    lightness: 25,
  },
}

export type FBO = {
  readonly texture: WebGLTexture
  readonly fbo: WebGLFramebuffer
  readonly width: number
  readonly height: number
}

export type DoubleFBO = {
  read: FBO
  write: FBO
}

export function swapFBO(doubleFbo: DoubleFBO): DoubleFBO {
  return { read: doubleFbo.write, write: doubleFbo.read }
}

export type Program = {
  readonly program: WebGLProgram
  readonly uniforms: Readonly<Record<string, WebGLUniformLocation>>
}

export type SimulationPrograms = {
  readonly advection: Program
  readonly divergence: Program
  readonly curl: Program
  readonly vorticity: Program
  readonly pressure: Program
  readonly gradientSubtract: Program
  readonly splat: Program
  readonly display: Program
}

export type SimulationFBOs = {
  velocity: DoubleFBO
  pressure: DoubleFBO
  divergence: FBO
  curl: FBO
  dye: DoubleFBO
}

export type SimulationState = {
  readonly gl: WebGL2RenderingContext | WebGLRenderingContext
  readonly programs: SimulationPrograms
  readonly fbos: SimulationFBOs
  readonly config: FluidConfig
  readonly isWebGL2: boolean
  simWidth: number
  simHeight: number
  dyeWidth: number
  dyeHeight: number
}

export type SplatInput = {
  readonly x: number
  readonly y: number
  readonly dx: number
  readonly dy: number
  readonly color: readonly [number, number, number]
}

export type RgbColor = {
  readonly r: number
  readonly g: number
  readonly b: number
}
