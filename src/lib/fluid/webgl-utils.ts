import type { FBO, DoubleFBO, Program } from './types'

export type GLContext = {
  readonly gl: WebGL2RenderingContext | WebGLRenderingContext
  readonly ext: {
    readonly halfFloatTexType: number
    readonly formatRGBA: { readonly internalFormat: number; readonly format: number }
    readonly formatRG: { readonly internalFormat: number; readonly format: number }
    readonly formatR: { readonly internalFormat: number; readonly format: number }
  }
  readonly isWebGL2: boolean
}

export function getWebGLContext(canvas: HTMLCanvasElement): GLContext | null {
  const params: WebGLContextAttributes = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  }

  const gl2 = canvas.getContext('webgl2', params)
  if (gl2) {
    gl2.getExtension('EXT_color_buffer_float')
    return {
      gl: gl2,
      isWebGL2: true,
      ext: {
        halfFloatTexType: gl2.HALF_FLOAT,
        formatRGBA: { internalFormat: gl2.RGBA16F, format: gl2.RGBA },
        formatRG: { internalFormat: gl2.RG16F, format: gl2.RG },
        formatR: { internalFormat: gl2.R16F, format: gl2.RED },
      },
    }
  }

  const gl1 = canvas.getContext('webgl', params)
  if (!gl1) return null

  const halfFloat = gl1.getExtension('OES_texture_half_float')
  const halfFloatLinear = gl1.getExtension('OES_texture_half_float_linear')
  if (!halfFloat || !halfFloatLinear) return null

  return {
    gl: gl1,
    isWebGL2: false,
    ext: {
      halfFloatTexType: halfFloat.HALF_FLOAT_OES,
      formatRGBA: { internalFormat: gl1.RGBA, format: gl1.RGBA },
      formatRG: { internalFormat: gl1.RGBA, format: gl1.RGBA },
      formatR: { internalFormat: gl1.RGBA, format: gl1.RGBA },
    },
  }
}

export function compileShader(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Failed to create shader')

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compilation failed: ${info}`)
  }

  return shader
}

export function createProgram(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
): Program {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

  const program = gl.createProgram() as WebGLProgram | null
  if (!program) throw new Error('Failed to create program')

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    throw new Error(`Program linking failed: ${info}`)
  }

  // Extract all active uniforms
  const uniforms: Record<string, WebGLUniformLocation> = {}
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < uniformCount; i++) {
    const info = gl.getActiveUniform(program, i)
    if (info) {
      const location = gl.getUniformLocation(program, info.name)
      if (location) {
        uniforms[info.name] = location
      }
    }
  }

  // Clean up shader objects — they're linked now
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  return { program, uniforms }
}

export function createFBO(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number,
): FBO {
  const texture = gl.createTexture() as WebGLTexture | null
  if (!texture) throw new Error('Failed to create texture')

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null)

  const fbo = gl.createFramebuffer() as WebGLFramebuffer | null
  if (!fbo) throw new Error('Failed to create framebuffer')

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  )
  gl.viewport(0, 0, w, h)
  gl.clear(gl.COLOR_BUFFER_BIT)

  return { texture, fbo, width: w, height: h }
}

export function createDoubleFBO(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number,
): DoubleFBO {
  const read = createFBO(gl, w, h, internalFormat, format, type, filter)
  const write = createFBO(gl, w, h, internalFormat, format, type, filter)
  return { read, write }
}

export function resizeDoubleFBO(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  doubleFbo: DoubleFBO,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number,
): DoubleFBO {
  // Clean up old FBOs
  gl.deleteTexture(doubleFbo.read.texture)
  gl.deleteFramebuffer(doubleFbo.read.fbo)
  gl.deleteTexture(doubleFbo.write.texture)
  gl.deleteFramebuffer(doubleFbo.write.fbo)

  return createDoubleFBO(gl, w, h, internalFormat, format, type, filter)
}

export function resizeFBO(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  oldFbo: FBO,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number,
): FBO {
  gl.deleteTexture(oldFbo.texture)
  gl.deleteFramebuffer(oldFbo.fbo)
  return createFBO(gl, w, h, internalFormat, format, type, filter)
}

/**
 * Set up fullscreen quad vertex buffer.
 * Call once during initialization.
 */
export function initQuadBuffer(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
): WebGLBuffer {
  const buffer = gl.createBuffer() as WebGLBuffer | null
  if (!buffer) throw new Error('Failed to create buffer')

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
    gl.STATIC_DRAW,
  )
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(0)

  return buffer
}

/**
 * Bind a program and draw a fullscreen quad.
 */
export function blit(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  target: WebGLFramebuffer | null,
  width?: number,
  height?: number,
): void {
  if (width !== undefined && height !== undefined) {
    gl.viewport(0, 0, width, height)
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, target)
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
}
