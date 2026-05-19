import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core'
import type { InferredParam, ResolvedParams, LegendConfig } from '#/lib/types'
import type { LayerGroup } from '#/lib/layer-groups'
import type {
  ItemParamMapping,
  RawLegendConfig,
} from '#/lib/legend-param-mapping'

export type LayersPanelProps = {
  readonly metadata: { title: string; tier: string } | null
  readonly parsedConfig: Readonly<Record<string, unknown>> | null
  readonly pipeline: {
    readonly inferredParams: readonly InferredParam[]
    readonly legendParamMapping: ReadonlyMap<number, ItemParamMapping>
    readonly resolvedLegendConfig: LegendConfig | null
    readonly rawLegendConfig: RawLegendConfig | null
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
  /** Drag handle listeners + attributes from useSortable */
  readonly dragHandleProps?: {
    readonly listeners: DraggableSyntheticListeners
    readonly attributes: DraggableAttributes
  }
}
