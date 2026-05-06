import type { SourceConfig, StyleConfig } from '#/lib/types'

export type BuiltLayerItem = {
  readonly id: string
  readonly source: SourceConfig
  readonly styles: readonly StyleConfig[]
}

export type BuildLayerItemsInput = {
  readonly sources: readonly SourceConfig[]
  readonly styles: readonly StyleConfig[]
}

export function buildLayerItems({
  sources,
  styles,
}: BuildLayerItemsInput): readonly BuiltLayerItem[] {
  if (sources.length === 0 || styles.length === 0) return []

  const items: BuiltLayerItem[] = []
  for (const source of sources) {
    const matched = styles.filter((s) => s.source === source.id)
    if (matched.length === 0) continue
    const typeSig = matched
      .map((s) => (typeof s.type === 'string' ? s.type : 'unknown'))
      .join(',')
    items.push({ id: `${source.id}--${typeSig}`, source, styles: matched })
  }
  return items
}
