import type { ExampleConfig } from '#/lib/types'

const modules = import.meta.glob<{ default: ExampleConfig }>('./[0-9]*.ts', {
  eager: true,
})

export const examples: readonly ExampleConfig[] = Object.keys(modules)
  .sort()
  .map((path) => modules[path].default)

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
  'multi-source-heatmap',
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
