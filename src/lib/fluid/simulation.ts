import type {
  SimulationState,
  SimulationPrograms,
  SimulationFBOs,
  FluidConfig,
  SplatInput,
} from './types'
import { DEFAULT_FLUID_CONFIG, swapFBO } from './types'
import {
  getWebGLContext,
  createProgram,
  createFBO,
  createDoubleFBO,
  resizeDoubleFBO,
  resizeFBO,
  initQuadBuffer,
  blit,
} from './webgl-utils'
import {
  baseVertexShader,
  advectionShader,
  divergenceShader,
  curlShader,
  vorticityShader,
  pressureShader,
  gradientSubtractShader,
  splatShader,
  displayShader,
} from './shaders'

function getResolution(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  resolution: number,
): { width: number; height: number } {
  const aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight
  if (aspectRatio < 1) {
    return {
      width: Math.round(resolution),
      height: Math.round(resolution / aspectRatio),
    }
  }
  return {
    width: Math.round(resolution * aspectRatio),
    height: Math.round(resolution),
  }
}

function compileAllPrograms(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
): SimulationPrograms {
  return {
    advection: createProgram(gl, baseVertexShader, advectionShader),
    divergence: createProgram(gl, baseVertexShader, divergenceShader),
    curl: createProgram(gl, baseVertexShader, curlShader),
    vorticity: createProgram(gl, baseVertexShader, vorticityShader),
    pressure: createProgram(gl, baseVertexShader, pressureShader),
    gradientSubtract: createProgram(gl, baseVertexShader, gradientSubtractShader),
    splat: createProgram(gl, baseVertexShader, splatShader),
    display: createProgram(gl, baseVertexShader, displayShader),
  }
}

function createAllFBOs(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  simWidth: number,
  simHeight: number,
  dyeWidth: number,
  dyeHeight: number,
  halfFloatTexType: number,
  formatRGBA: { internalFormat: number; format: number },
  formatRG: { internalFormat: number; format: number },
  formatR: { internalFormat: number; format: number },
): SimulationFBOs {
  const filter = gl.LINEAR

  return {
    velocity: createDoubleFBO(
      gl, simWidth, simHeight,
      formatRG.internalFormat, formatRG.format, halfFloatTexType, filter,
    ),
    pressure: createDoubleFBO(
      gl, simWidth, simHeight,
      formatR.internalFormat, formatR.format, halfFloatTexType, filter,
    ),
    divergence: createFBO(
      gl, simWidth, simHeight,
      formatR.internalFormat, formatR.format, halfFloatTexType, filter,
    ),
    curl: createFBO(
      gl, simWidth, simHeight,
      formatR.internalFormat, formatR.format, halfFloatTexType, filter,
    ),
    dye: createDoubleFBO(
      gl, dyeWidth, dyeHeight,
      formatRGBA.internalFormat, formatRGBA.format, halfFloatTexType, filter,
    ),
  }
}

function bindTexture(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  texture: WebGLTexture,
  unit: number,
): void {
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, texture)
}

export function createSimulation(
  canvas: HTMLCanvasElement,
  config: FluidConfig = DEFAULT_FLUID_CONFIG,
): SimulationState | null {
  const context = getWebGLContext(canvas)
  if (!context) return null

  const { gl, ext, isWebGL2 } = context

  try {
    initQuadBuffer(gl)
    const programs = compileAllPrograms(gl)

    const simRes = getResolution(gl, config.simResolution)
    const dyeRes = getResolution(gl, config.simResolution * 4)

    const fbos = createAllFBOs(
      gl,
      simRes.width, simRes.height,
      dyeRes.width, dyeRes.height,
      ext.halfFloatTexType,
      ext.formatRGBA,
      ext.formatRG,
      ext.formatR,
    )

    return {
      gl,
      programs,
      fbos,
      config,
      isWebGL2,
      simWidth: simRes.width,
      simHeight: simRes.height,
      dyeWidth: dyeRes.width,
      dyeHeight: dyeRes.height,
    }
  } catch {
    return null
  }
}

export function stepSimulation(state: SimulationState, dt: number): void {
  const { gl, programs, fbos, config } = state

  // 1. Curl
  gl.useProgram(programs.curl.program)
  gl.uniform2f(
    programs.curl.uniforms['texelSize'],
    1.0 / state.simWidth,
    1.0 / state.simHeight,
  )
  bindTexture(gl, fbos.velocity.read.texture, 0)
  gl.uniform1i(programs.curl.uniforms['uVelocity'], 0)
  blit(gl, fbos.curl.fbo, fbos.curl.width, fbos.curl.height)

  // 2. Vorticity
  gl.useProgram(programs.vorticity.program)
  gl.uniform2f(
    programs.vorticity.uniforms['texelSize'],
    1.0 / state.simWidth,
    1.0 / state.simHeight,
  )
  bindTexture(gl, fbos.velocity.read.texture, 0)
  gl.uniform1i(programs.vorticity.uniforms['uVelocity'], 0)
  bindTexture(gl, fbos.curl.texture, 1)
  gl.uniform1i(programs.vorticity.uniforms['uCurl'], 1)
  gl.uniform1f(programs.vorticity.uniforms['uCurlStrength'], config.curl)
  gl.uniform1f(programs.vorticity.uniforms['dt'], dt)
  blit(gl, fbos.velocity.write.fbo, fbos.velocity.write.width, fbos.velocity.write.height)
  state.fbos.velocity = swapFBO(fbos.velocity)

  // 3. Advect velocity
  gl.useProgram(programs.advection.program)
  gl.uniform2f(
    programs.advection.uniforms['texelSize'],
    1.0 / state.simWidth,
    1.0 / state.simHeight,
  )
  const velocityId = 0
  bindTexture(gl, state.fbos.velocity.read.texture, velocityId)
  gl.uniform1i(programs.advection.uniforms['uVelocity'], velocityId)
  gl.uniform1i(programs.advection.uniforms['uSource'], velocityId)
  gl.uniform1f(programs.advection.uniforms['dt'], dt)
  gl.uniform1f(
    programs.advection.uniforms['uDissipation'],
    config.velocityDissipation,
  )
  blit(gl, state.fbos.velocity.write.fbo, state.fbos.velocity.write.width, state.fbos.velocity.write.height)
  state.fbos.velocity = swapFBO(state.fbos.velocity)

  // 4. Advect dye
  gl.uniform2f(
    programs.advection.uniforms['texelSize'],
    1.0 / state.dyeWidth,
    1.0 / state.dyeHeight,
  )
  bindTexture(gl, state.fbos.velocity.read.texture, 0)
  gl.uniform1i(programs.advection.uniforms['uVelocity'], 0)
  bindTexture(gl, state.fbos.dye.read.texture, 1)
  gl.uniform1i(programs.advection.uniforms['uSource'], 1)
  gl.uniform1f(
    programs.advection.uniforms['uDissipation'],
    config.dyeDissipation,
  )
  blit(gl, state.fbos.dye.write.fbo, state.fbos.dye.write.width, state.fbos.dye.write.height)
  state.fbos.dye = swapFBO(state.fbos.dye)

  // 5. Divergence
  gl.useProgram(programs.divergence.program)
  gl.uniform2f(
    programs.divergence.uniforms['texelSize'],
    1.0 / state.simWidth,
    1.0 / state.simHeight,
  )
  bindTexture(gl, state.fbos.velocity.read.texture, 0)
  gl.uniform1i(programs.divergence.uniforms['uVelocity'], 0)
  blit(gl, state.fbos.divergence.fbo, state.fbos.divergence.width, state.fbos.divergence.height)

  // 6. Clear pressure
  gl.useProgram(programs.pressure.program)
  gl.uniform2f(
    programs.pressure.uniforms['texelSize'],
    1.0 / state.simWidth,
    1.0 / state.simHeight,
  )
  bindTexture(gl, state.fbos.divergence.texture, 1)
  gl.uniform1i(programs.pressure.uniforms['uDivergence'], 1)

  // 7. Pressure solve (Jacobi iterations)
  for (let i = 0; i < config.pressureIterations; i++) {
    bindTexture(gl, state.fbos.pressure.read.texture, 0)
    gl.uniform1i(programs.pressure.uniforms['uPressure'], 0)
    blit(gl, state.fbos.pressure.write.fbo, state.fbos.pressure.write.width, state.fbos.pressure.write.height)
    state.fbos.pressure = swapFBO(state.fbos.pressure)
  }

  // 8. Gradient subtract
  gl.useProgram(programs.gradientSubtract.program)
  gl.uniform2f(
    programs.gradientSubtract.uniforms['texelSize'],
    1.0 / state.simWidth,
    1.0 / state.simHeight,
  )
  bindTexture(gl, state.fbos.pressure.read.texture, 0)
  gl.uniform1i(programs.gradientSubtract.uniforms['uPressure'], 0)
  bindTexture(gl, state.fbos.velocity.read.texture, 1)
  gl.uniform1i(programs.gradientSubtract.uniforms['uVelocity'], 1)
  blit(gl, state.fbos.velocity.write.fbo, state.fbos.velocity.write.width, state.fbos.velocity.write.height)
  state.fbos.velocity = swapFBO(state.fbos.velocity)
}

export function renderDisplay(
  state: SimulationState,
  brightness: number,
): void {
  const { gl, programs, fbos } = state

  // Clear to transparent before rendering dye
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  // Enable blending so transparent areas show the page behind
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  gl.useProgram(programs.display.program)
  gl.uniform2f(
    programs.display.uniforms['texelSize'],
    1.0 / gl.drawingBufferWidth,
    1.0 / gl.drawingBufferHeight,
  )
  bindTexture(gl, fbos.dye.read.texture, 0)
  gl.uniform1i(programs.display.uniforms['uTexture'], 0)
  gl.uniform1f(programs.display.uniforms['uBrightness'], brightness)
  blit(gl, null, gl.drawingBufferWidth, gl.drawingBufferHeight)

  gl.disable(gl.BLEND)
}

/** Derive splat radius from velocity speed (used when no explicit radius given). */
function computeSpeedRadius(dx: number, dy: number, config: FluidConfig): number {
  const speed = Math.hypot(dx, dy)
  const t = Math.min(speed * 100, 1)
  return config.splatRadiusMin + t * (config.splatRadiusMax - config.splatRadiusMin)
}

export function addSplat(state: SimulationState, input: SplatInput): void {
  const { gl, programs, fbos } = state

  gl.useProgram(programs.splat.program)
  gl.uniform1f(
    programs.splat.uniforms['aspectRatio'],
    gl.drawingBufferWidth / gl.drawingBufferHeight,
  )
  gl.uniform2f(programs.splat.uniforms['point'], input.x, input.y)
  gl.uniform3f(
    programs.splat.uniforms['color'],
    input.dx * state.config.splatForce,
    input.dy * state.config.splatForce,
    0.0,
  )

  // Use explicit radius if provided, otherwise derive from speed
  const radius = input.radius ?? computeSpeedRadius(input.dx, input.dy, state.config)
  gl.uniform1f(programs.splat.uniforms['radius'], radius / 1000)

  // Splat velocity
  gl.uniform2f(
    programs.splat.uniforms['texelSize'],
    1.0 / state.simWidth,
    1.0 / state.simHeight,
  )
  bindTexture(gl, fbos.velocity.read.texture, 0)
  gl.uniform1i(programs.splat.uniforms['uTarget'], 0)
  blit(gl, fbos.velocity.write.fbo, fbos.velocity.write.width, fbos.velocity.write.height)
  state.fbos.velocity = swapFBO(state.fbos.velocity)

  // Splat dye (color)
  gl.uniform3f(
    programs.splat.uniforms['color'],
    input.color[0],
    input.color[1],
    input.color[2],
  )
  gl.uniform2f(
    programs.splat.uniforms['texelSize'],
    1.0 / state.dyeWidth,
    1.0 / state.dyeHeight,
  )
  bindTexture(gl, fbos.dye.read.texture, 0)
  gl.uniform1i(programs.splat.uniforms['uTarget'], 0)
  blit(gl, fbos.dye.write.fbo, fbos.dye.write.width, fbos.dye.write.height)
  state.fbos.dye = swapFBO(state.fbos.dye)
}

export function resizeSimulation(
  state: SimulationState,
  _canvasWidth: number,
  _canvasHeight: number,
): void {
  const { gl, config, fbos } = state

  const simRes = getResolution(gl, config.simResolution)
  const dyeRes = getResolution(gl, config.simResolution * 4)

  const context = getWebGLContext(gl.canvas as HTMLCanvasElement)
  if (!context) return
  const { ext } = context
  const filter = gl.LINEAR

  if (simRes.width !== state.simWidth || simRes.height !== state.simHeight) {
    state.fbos.velocity = resizeDoubleFBO(
      gl, fbos.velocity, simRes.width, simRes.height,
      ext.formatRG.internalFormat, ext.formatRG.format, ext.halfFloatTexType, filter,
    )
    state.fbos.pressure = resizeDoubleFBO(
      gl, fbos.pressure, simRes.width, simRes.height,
      ext.formatR.internalFormat, ext.formatR.format, ext.halfFloatTexType, filter,
    )
    state.fbos.divergence = resizeFBO(
      gl, fbos.divergence, simRes.width, simRes.height,
      ext.formatR.internalFormat, ext.formatR.format, ext.halfFloatTexType, filter,
    )
    state.fbos.curl = resizeFBO(
      gl, fbos.curl, simRes.width, simRes.height,
      ext.formatR.internalFormat, ext.formatR.format, ext.halfFloatTexType, filter,
    )
    state.simWidth = simRes.width
    state.simHeight = simRes.height
  }

  if (dyeRes.width !== state.dyeWidth || dyeRes.height !== state.dyeHeight) {
    state.fbos.dye = resizeDoubleFBO(
      gl, fbos.dye, dyeRes.width, dyeRes.height,
      ext.formatRGBA.internalFormat, ext.formatRGBA.format, ext.halfFloatTexType, filter,
    )
    state.dyeWidth = dyeRes.width
    state.dyeHeight = dyeRes.height
  }
}

export function destroySimulation(state: SimulationState): void {
  const { gl, programs, fbos } = state

  // Delete all programs
  for (const prog of Object.values(programs)) {
    gl.deleteProgram((prog as { program: WebGLProgram }).program)
  }

  // Delete all FBO textures and framebuffers
  const deleteFBO = (fbo: { texture: WebGLTexture; fbo: WebGLFramebuffer }) => {
    gl.deleteTexture(fbo.texture)
    gl.deleteFramebuffer(fbo.fbo)
  }

  deleteFBO(fbos.velocity.read)
  deleteFBO(fbos.velocity.write)
  deleteFBO(fbos.pressure.read)
  deleteFBO(fbos.pressure.write)
  deleteFBO(fbos.divergence)
  deleteFBO(fbos.curl)
  deleteFBO(fbos.dye.read)
  deleteFBO(fbos.dye.write)
}
