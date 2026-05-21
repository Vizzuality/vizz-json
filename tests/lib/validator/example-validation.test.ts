import { describe, it, expect } from 'vitest'
import { validate } from '#/lib/validator/index'
import { getFunctionMeta } from '#/lib/converter/functions'
import example07 from '#/examples/07-raster-function'
import example12 from '#/examples/12-earthquakes-crossfade'
import example06 from '#/examples/06-data-driven-circles'

const registry = { getFunctionMeta }

describe('example validation — zero errors after restoration', () => {
  it('example 07 has zero validator errors', () => {
    const diags = validate(example07.config, registry)
    const errors = diags.filter((d) => d.severity === 'error')
    if (errors.length > 0) {
      console.log(
        'example07 errors:',
        errors.map((d) => `${d.code}: ${d.message}`),
      )
    }
    expect(errors).toHaveLength(0)
  })

  it('example 12 has zero validator errors', () => {
    const diags = validate(example12.config, registry)
    const errors = diags.filter((d) => d.severity === 'error')
    if (errors.length > 0) {
      console.log(
        'example12 errors:',
        errors.map((d) => `${d.code}: ${d.message}`),
      )
    }
    expect(errors).toHaveLength(0)
  })

  it('example 06 has zero validator errors', () => {
    const diags = validate(example06.config, registry)
    const errors = diags.filter((d) => d.severity === 'error')
    if (errors.length > 0) {
      console.log(
        'example06 errors:',
        errors.map((d) => `${d.code}: ${d.message}`),
      )
    }
    expect(errors).toHaveLength(0)
  })
})
