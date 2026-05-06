import type {
  ResolvedParams,
  ExampleMetadata,
  ParamConfig,
  LegendConfig,
} from '#/lib/types'
import type { RendererControls } from '#/lib/ai/types'

export type AiSchema = {
  readonly metadata: ExampleMetadata
  readonly config: Record<string, unknown>
  readonly params_config: readonly ParamConfig[]
  readonly legend_config?: LegendConfig
}

export type Chat = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  schemaVersion: 1
  renderer: RendererControls
  activeParamValues: ResolvedParams
  activeMessageId: string | null
}

export type Message = {
  id: string
  chatId: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
  schemaVersion: 1
  schemaSnapshot?: AiSchema
}

export type MetaRow = {
  key: 'lastActiveChatId'
  value: string
}
