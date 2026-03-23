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

export type LayerConfig = {
  readonly source: Record<string, unknown>
  readonly styles: readonly Record<string, unknown>[]
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
}

export type ExampleConfig = LayerSchema & {
  readonly metadata: ExampleMetadata
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
