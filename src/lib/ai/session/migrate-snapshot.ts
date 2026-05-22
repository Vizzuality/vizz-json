import type { AiSchema } from '#/lib/ai/persistence/types'
import type { LegendConfig } from '#/lib/types'

export function migrateLegendShape(snapshot: AiSchema): AiSchema {
  // Cast to a permissive shape that may carry the legacy top-level key
  const legacy = snapshot as AiSchema & { legend_config?: LegendConfig }
  const topLegend = legacy.legend_config
  if (!topLegend) return snapshot

  const config = snapshot.config as Record<string, unknown> | undefined
  const sources = config?.sources
  if (!Array.isArray(sources) || sources.length === 0) return snapshot

  // If any source already has legend_config, leave the snapshot alone
  const anySourceHasLegend = sources.some(
    (s) => s && typeof s === 'object' && 'legend_config' in (s as object),
  )
  if (anySourceHasLegend) {
    // drop the stale top-level legend but don't touch per-source
    const { legend_config: _legendDrop, ...rest } = legacy
    return rest as AiSchema
  }

  const newSources = sources.map((s, i) =>
    i === 0 && s && typeof s === 'object'
      ? { ...(s as Record<string, unknown>), legend_config: topLegend }
      : s,
  )

  const newConfig = { ...(config ?? {}), sources: newSources }

  const { legend_config: _legendDropped, ...restSnapshot } = legacy
  return {
    ...(restSnapshot as unknown as object),
    config: newConfig,
  } as unknown as AiSchema
}
