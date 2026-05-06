import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '#/lib/ai/persistence/db'
import { createChat } from '#/lib/ai/persistence/chats'
import {
  appendUserMessage,
  appendAssistantMessage,
  listMessages,
} from '#/lib/ai/persistence/messages'

beforeEach(async () => {
  await db.chats.clear()
  await db.messages.clear()
})

describe('messages CRUD', () => {
  it('appends a user message', async () => {
    const chat = await createChat()
    const msg = await appendUserMessage(chat.id, 'hello')
    expect(msg.role).toBe('user')
    expect(msg.text).toBe('hello')
    expect(msg.chatId).toBe(chat.id)
  })

  it('appends an assistant message with snapshot and updates chat.activeMessageId', async () => {
    const chat = await createChat()
    const snapshot = {
      metadata: { title: 'X', tier: 'basic' as const, description: '' },
      config: {},
      params_config: [],
    }
    const msg = await appendAssistantMessage(chat.id, 'reply', snapshot)
    expect(msg.schemaSnapshot).toEqual(snapshot)
    const refreshed = await db.chats.get(chat.id)
    expect(refreshed?.activeMessageId).toBe(msg.id)
  })

  it('lists messages ordered by createdAt asc', async () => {
    const chat = await createChat()
    const a = await appendUserMessage(chat.id, 'first')
    await new Promise((r) => setTimeout(r, 5))
    const b = await appendUserMessage(chat.id, 'second')
    const list = await listMessages(chat.id)
    expect(list.map((m) => m.id)).toEqual([a.id, b.id])
  })
})
