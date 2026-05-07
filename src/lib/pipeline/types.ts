import type { ExampleMetadata, InferredParam, LegendConfig } from '#/lib/types'
import type {
  ItemParamMapping,
  RawLegendConfig,
} from '#/lib/legend-param-mapping'

export type PipelineOutput =
  | {
      readonly kind: 'map'
      readonly resolvedConfig: Record<string, unknown> | null
      readonly error: string | null
    }
  | {
      readonly kind: 'components'
      readonly resolvedComponents: readonly unknown[] | null
      readonly error: string | null
    }

export type PipelineResult = {
  readonly inferredParams: readonly InferredParam[]
  readonly rawLegendConfig: RawLegendConfig | null
  readonly resolvedLegendConfig: LegendConfig | null
  readonly legendParamMapping: ReadonlyMap<number, ItemParamMapping>
  readonly orphanLegendParams: readonly InferredParam[]
  readonly metadata: ExampleMetadata | null
  readonly previewMode: 'map' | 'components'
  readonly output: PipelineOutput
}
