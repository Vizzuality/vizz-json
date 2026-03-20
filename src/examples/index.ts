import type { ExampleConfig } from '#/lib/types'

import example01 from './01-raster-opacity.json'
import example02 from './02-vector-fill.json'
import example03 from './03-choropleth-match.json'
import example04 from './04-graduated-interpolate.json'
import example05 from './05-classified-step.json'
import example06 from './06-data-driven-circles.json'
import example07 from './07-raster-function.json'
import example08 from './08-deckgl-scatterplot.json'
import example09 from './09-conditional-case.json'
import example10 from './10-react-components.json'

export const examples: readonly ExampleConfig[] = [
  example01 as ExampleConfig,
  example02 as ExampleConfig,
  example03 as ExampleConfig,
  example04 as ExampleConfig,
  example05 as ExampleConfig,
  example06 as ExampleConfig,
  example07 as ExampleConfig,
  example08 as ExampleConfig,
  example09 as ExampleConfig,
  example10 as ExampleConfig,
]

export function getExampleById(index: number): ExampleConfig | undefined {
  return examples[index]
}
