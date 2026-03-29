import type { ExampleConfig } from '#/lib/types'

import example01 from './01-raster-opacity.json'
import example02 from './02-vector-fill.json'
import example03 from './03-choropleth-match.json'
import example04 from './04-graduated-interpolate.json'
import example05 from './05-classified-step.json'
import example06 from './06-data-driven-circles.json'
import example07 from './07-raster-function.json'
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
  example09 as ExampleConfig,
  example10 as ExampleConfig,
]

// -------------------------------------------------------------------------
// Slug-based example lookup (for URL search params)
// -------------------------------------------------------------------------

export const EXAMPLE_SLUGS = [
  'raster-opacity',
  'vector-fill',
  'choropleth-match',
  'graduated-interpolate',
  'classified-step',
  'data-driven-circles',
  'raster-function',
  'conditional-case',
  'react-components',
] as const

export type ExampleSlug = (typeof EXAMPLE_SLUGS)[number]

export const DEFAULT_EXAMPLE_SLUG: ExampleSlug = EXAMPLE_SLUGS[0]

export function getExampleIndexBySlug(slug: string): number | undefined {
  const index = EXAMPLE_SLUGS.indexOf(slug as ExampleSlug)
  return index === -1 ? undefined : index
}

export function getSlugByIndex(index: number): ExampleSlug | undefined {
  return EXAMPLE_SLUGS[index]
}

export function getExampleById(index: number): ExampleConfig | undefined {
  return examples[index]
}
