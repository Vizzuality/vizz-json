export type ParamControlType =
  | 'slider'
  | 'color_picker'
  | 'switch'
  | 'select'
  | 'text_input'
  | 'json_editor'

export interface ParamConfig {
  key: string
  default: unknown
  min?: number
  max?: number
  step?: number
  options?: string[]
  group?: string
}

export interface InferredParam {
  key: string
  value: unknown
  control_type: ParamControlType
  min?: number
  max?: number
  step?: number
  options?: string[]
  group?: string
}

export interface ExampleConfig {
  metadata: { title: string; description: string; tier?: string }
  config: {
    source: Record<string, unknown>
    styles: Array<Record<string, unknown>>
  }
  params_config: ParamConfig[]
  legend_config?: Record<string, unknown>
}

export type ParamValues = Record<string, unknown>

export interface BasemapOption {
  id: 'positron' | 'liberty' | 'dark'
  label: string
  styleUrl: string
}

export const BASEMAP_OPTIONS: readonly BasemapOption[] = [
  {
    id: 'positron',
    label: 'Positron (light)',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
  },
  {
    id: 'liberty',
    label: 'Liberty',
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
  },
  {
    id: 'dark',
    label: 'Dark Matter',
    styleUrl: 'https://tiles.openfreemap.org/styles/dark-matter',
  },
] as const
