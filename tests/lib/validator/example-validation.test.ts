import { describe, it, expect } from 'vitest'
import { validate } from '#/lib/validator'
import { getFunctionMeta } from '#/lib/converter/functions'

import example01 from '#/examples/01-raster-opacity'
import example02 from '#/examples/02-vector-fill'
import example03 from '#/examples/03-choropleth-match'
import example04 from '#/examples/04-graduated-interpolate'
import example05 from '#/examples/05-classified-step'
import example06 from '#/examples/06-data-driven-circles'
import example07 from '#/examples/07-raster-function'
import example09 from '#/examples/09-conditional-case'
import example10 from '#/examples/10-react-components'
import example11 from '#/examples/11-multi-source-heatmap'
import example12 from '#/examples/12-earthquakes-crossfade'

const registry = { getFunctionMeta }

const examples = [
  { name: '01-raster-opacity', mod: example01 },
  { name: '02-vector-fill', mod: example02 },
  { name: '03-choropleth-match', mod: example03 },
  { name: '04-graduated-interpolate', mod: example04 },
  { name: '05-classified-step', mod: example05 },
  { name: '06-data-driven-circles', mod: example06 },
  { name: '07-raster-function', mod: example07 },
  { name: '09-conditional-case', mod: example09 },
  { name: '10-react-components', mod: example10 },
  { name: '11-multi-source-heatmap', mod: example11 },
  { name: '12-earthquakes-crossfade', mod: example12 },
] as const

describe('example validation — zero errors required', () => {
  it.each(examples)('$name has zero validator errors', ({ mod }) => {
    const diags = validate(mod, registry)
    const errors = diags.filter((d) => d.severity === 'error')
    expect(
      errors,
      `Found ${errors.length} validator error(s):\n` +
        errors.map((d) => `  ${d.code} at ${d.path}: ${d.message}`).join('\n'),
    ).toHaveLength(0)
  })
})
