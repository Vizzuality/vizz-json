import { describe, it, expect, vi } from 'vitest'
import {
  compileShader,
  createProgram,
  createFBO,
  createDoubleFBO,
} from '#/lib/fluid/webgl-utils'

function createMockGL() {
  const mockShader = { __type: 'shader' }
  const mockProgram = { __type: 'program' }
  const mockTexture = { __type: 'texture' }
  const mockFramebuffer = { __type: 'framebuffer' }
  const mockLocation = { __type: 'location' }

  return {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
    ACTIVE_UNIFORMS: 35718,
    TEXTURE0: 33984,
    TEXTURE_2D: 3553,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_MAG_FILTER: 10240,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243,
    CLAMP_TO_EDGE: 33071,
    FRAMEBUFFER: 36160,
    COLOR_ATTACHMENT0: 36064,
    COLOR_BUFFER_BIT: 16384,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    TRIANGLE_FAN: 6,
    createShader: vi.fn(() => mockShader),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => mockProgram),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn((_, param: number) => {
      if (param === 35714) return true // LINK_STATUS
      if (param === 35718) return 2 // ACTIVE_UNIFORMS
      return 0
    }),
    getProgramInfoLog: vi.fn(() => ''),
    getActiveUniform: vi.fn((_, index: number) => ({
      name: index === 0 ? 'uVelocity' : 'uSource',
      type: 5126,
      size: 1,
    })),
    getUniformLocation: vi.fn(() => mockLocation),
    createTexture: vi.fn(() => mockTexture),
    activeTexture: vi.fn(),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    texImage2D: vi.fn(),
    createFramebuffer: vi.fn(() => mockFramebuffer),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    viewport: vi.fn(),
    clear: vi.fn(),
    deleteTexture: vi.fn(),
    deleteFramebuffer: vi.fn(),
    createBuffer: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    vertexAttribPointer: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    drawArrays: vi.fn(),
  }
}

describe('compileShader', () => {
  it('creates, sources, and compiles a shader', () => {
    const gl = createMockGL()
    const result = compileShader(
      gl as unknown as WebGL2RenderingContext,
      gl.VERTEX_SHADER,
      'void main() {}',
    )

    expect(gl.createShader).toHaveBeenCalledWith(gl.VERTEX_SHADER)
    expect(gl.shaderSource).toHaveBeenCalled()
    expect(gl.compileShader).toHaveBeenCalled()
    expect(gl.getShaderParameter).toHaveBeenCalledWith(
      result,
      gl.COMPILE_STATUS,
    )
  })

  it('throws on compilation failure', () => {
    const gl = createMockGL()
    gl.getShaderParameter.mockReturnValue(false)
    gl.getShaderInfoLog.mockReturnValue('syntax error')

    expect(() =>
      compileShader(
        gl as unknown as WebGL2RenderingContext,
        gl.VERTEX_SHADER,
        'invalid',
      ),
    ).toThrow('Shader compilation failed: syntax error')
  })

  it('throws when createShader returns null', () => {
    const gl = createMockGL()
    gl.createShader.mockReturnValue(null as any)

    expect(() =>
      compileShader(
        gl as unknown as WebGL2RenderingContext,
        gl.VERTEX_SHADER,
        'void main() {}',
      ),
    ).toThrow('Failed to create shader')
  })
})

describe('createProgram', () => {
  it('compiles both shaders, links, and extracts uniforms', () => {
    const gl = createMockGL()
    const result = createProgram(
      gl as unknown as WebGL2RenderingContext,
      'vertex source',
      'fragment source',
    )

    expect(gl.attachShader).toHaveBeenCalledTimes(2)
    expect(gl.linkProgram).toHaveBeenCalled()
    expect(result.program).toBeDefined()
    expect(result.uniforms).toHaveProperty('uVelocity')
    expect(result.uniforms).toHaveProperty('uSource')
  })

  it('throws on link failure', () => {
    const gl = createMockGL()
    gl.getProgramParameter.mockImplementation((_: any, param: number): any => {
      if (param === 35714) return false // LINK_STATUS
      return 0
    })
    gl.getProgramInfoLog.mockReturnValue('link error')

    expect(() =>
      createProgram(
        gl as unknown as WebGL2RenderingContext,
        'vertex',
        'fragment',
      ),
    ).toThrow('Program linking failed: link error')
  })

  it('cleans up shader objects after linking', () => {
    const gl = createMockGL()
    createProgram(gl as unknown as WebGL2RenderingContext, 'vertex', 'fragment')

    // Two compileShader calls = two shaders created, both should be deleted
    expect(gl.deleteShader).toHaveBeenCalledTimes(2)
  })
})

describe('createFBO', () => {
  it('creates texture and framebuffer with correct parameters', () => {
    const gl = createMockGL()
    const result = createFBO(
      gl as unknown as WebGL2RenderingContext,
      256,
      256,
      gl.TEXTURE_2D,
      gl.TEXTURE_2D,
      gl.FLOAT,
      gl.TEXTURE_MIN_FILTER,
    )

    expect(gl.createTexture).toHaveBeenCalled()
    expect(gl.createFramebuffer).toHaveBeenCalled()
    expect(gl.texImage2D).toHaveBeenCalled()
    expect(gl.framebufferTexture2D).toHaveBeenCalled()
    expect(result.width).toBe(256)
    expect(result.height).toBe(256)
    expect(result.texture).toBeDefined()
    expect(result.fbo).toBeDefined()
  })
})

describe('createDoubleFBO', () => {
  it('creates two FBOs for ping-pong rendering', () => {
    const gl = createMockGL()
    const result = createDoubleFBO(
      gl as unknown as WebGL2RenderingContext,
      128,
      128,
      gl.TEXTURE_2D,
      gl.TEXTURE_2D,
      gl.FLOAT,
      gl.TEXTURE_MIN_FILTER,
    )

    expect(result.read).toBeDefined()
    expect(result.write).toBeDefined()
    expect(result.read.width).toBe(128)
    expect(result.write.width).toBe(128)
    // Two textures + two framebuffers
    expect(gl.createTexture).toHaveBeenCalledTimes(2)
    expect(gl.createFramebuffer).toHaveBeenCalledTimes(2)
  })
})
