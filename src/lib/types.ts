export type ParamConfig = {
  readonly key: string
  readonly default: unknown
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly options?: readonly string[]
  readonly group?: 'legend'
}

export type LegendItem = {
  readonly label: string
  readonly value: string | number
}

export type LegendConfig = {
  readonly type: 'basic' | 'choropleth' | 'gradient'
  readonly items: readonly LegendItem[]
}

export type SourceConfig = {
  readonly id: string
} & Record<string, unknown>

export type StyleConfig = {
  readonly source: string
} & Record<string, unknown>

export type LayerConfig = {
  readonly sources: readonly SourceConfig[]
  readonly styles: readonly StyleConfig[]
}

export type LayerSchema = {
  readonly config: LayerConfig | Record<string, unknown>
  readonly params_config: readonly ParamConfig[]
  readonly legend_config?: LegendConfig
}

export type ExampleMetadata = {
  readonly title: string
  readonly description: string
  readonly tier: 'basic' | 'intermediate' | 'advanced'
  readonly preview?: 'components'
}

export type MapExample = LayerSchema & {
  readonly metadata: ExampleMetadata
}

export type ComponentExample = {
  readonly metadata: ExampleMetadata & { readonly preview: 'components' }
  readonly components: readonly Record<string, unknown>[]
  readonly params_config: readonly ParamConfig[]
}

export type ExampleConfig = MapExample | ComponentExample

export function isComponentExample(
  example: ExampleConfig,
): example is ComponentExample {
  return example.metadata.preview === 'components'
}

export type ParamControlType =
  | 'slider'
  | 'color_picker'
  | 'switch'
  | 'text_input'
  | 'select'
  | 'json_editor'

export type InferredParam = {
  readonly key: string
  readonly value: unknown
  readonly control_type: ParamControlType
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly options?: readonly string[]
  readonly group?: 'legend'
}

export type ResolvedParams = Readonly<Record<string, unknown>>
