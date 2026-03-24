import { describe, it, expect } from 'vitest'
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
} from '#/lib/fluid/shaders'

describe('shader sources', () => {
  const shaders = {
    baseVertexShader,
    advectionShader,
    divergenceShader,
    curlShader,
    vorticityShader,
    pressureShader,
    gradientSubtractShader,
    splatShader,
    displayShader,
  }

  it.each(Object.entries(shaders))(
    '%s is a non-empty string',
    (_name, source) => {
      expect(typeof source).toBe('string')
      expect(source.trim().length).toBeGreaterThan(0)
    },
  )

  it('vertex shader contains gl_Position', () => {
    expect(baseVertexShader).toContain('gl_Position')
  })

  it('vertex shader declares texelSize uniform', () => {
    expect(baseVertexShader).toContain('uniform vec2 texelSize')
  })

  it('advection shader declares uDissipation uniform', () => {
    expect(advectionShader).toContain('uniform float uDissipation')
  })

  it('advection shader declares dt uniform', () => {
    expect(advectionShader).toContain('uniform float dt')
  })

  it('vorticity shader declares uCurlStrength uniform', () => {
    expect(vorticityShader).toContain('uniform float uCurlStrength')
  })

  it('splat shader declares color, point, and radius uniforms', () => {
    expect(splatShader).toContain('uniform vec3 color')
    expect(splatShader).toContain('uniform vec2 point')
    expect(splatShader).toContain('uniform float radius')
  })

  it('display shader declares uBrightness uniform', () => {
    expect(displayShader).toContain('uniform float uBrightness')
  })

  it('all fragment shaders write to gl_FragColor', () => {
    const fragmentShaders = [
      advectionShader,
      divergenceShader,
      curlShader,
      vorticityShader,
      pressureShader,
      gradientSubtractShader,
      splatShader,
      displayShader,
    ]
    for (const shader of fragmentShaders) {
      expect(shader).toContain('gl_FragColor')
    }
  })
})
