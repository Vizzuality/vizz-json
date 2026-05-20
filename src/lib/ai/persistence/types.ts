import type { ExampleMetadata, ParamConfig } from '#/lib/types'
import type { RendererControls } from '#/lib/ai/types'

export type AiSchema = {
  readonly metadata: ExampleMetadata
  readonly config: Record<string, unknown>
  readonly params_config: readonly ParamConfig[]
}

export type Chat = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  schemaVersion: 2
  renderer: RendererControls
  activeMessageId: string | null
}

export type Message = {
  id: string
  chatId: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
  schemaVersion: 2
  schemaSnapshot?: AiSchema
}

export type MetaRow = {
  key: 'lastActiveChatId'
  value: string
}
