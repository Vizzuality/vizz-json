import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core'
import type { InferredParam, ResolvedParams } from '#/lib/types'
import type { LayerGroup } from '#/lib/layer-groups'
import type { SourceLegendEntry } from '#/lib/pipeline/types'

export type LayersPanelProps = {
  readonly metadata: { title: string; tier: string } | null
  readonly parsedConfig: Readonly<Record<string, unknown>> | null
  readonly pipeline: {
    readonly inferredParams: readonly InferredParam[]
    readonly sourceLegends: readonly SourceLegendEntry[]
  }
  readonly values: ResolvedParams
  readonly onChange: (key: string, value: unknown) => void
  readonly currentJson: string
  readonly onApply: (updatedJson: string) => void
}

export type LayerCardProps = {
  readonly group: LayerGroup
  readonly showHandle: boolean
  readonly values: ResolvedParams
  readonly onChange: (key: string, value: unknown) => void
  readonly currentJson: string
  readonly onApply: (updatedJson: string) => void
  /** Param keys owned by ANY source's legend — used to suppress duplicate controls
   * in cards whose styles also reference them. */
  readonly globalLegendParamKeys: ReadonlySet<string>
  /** Drag handle listeners + attributes from useSortable */
  readonly dragHandleProps?: {
    readonly listeners: DraggableSyntheticListeners
    readonly attributes: DraggableAttributes
  }
}
