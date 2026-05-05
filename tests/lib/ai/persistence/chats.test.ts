import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '#/lib/ai/persistence/db'
import {
  createChat,
  deleteChat,
  getChat,
  listChats,
  renameChat,
  setActiveMessage,
  setParamValues,
  setRenderer,
} from '#/lib/ai/persistence/chats'

beforeEach(async () => {
  await db.chats.clear()
  await db.messages.clear()
  await db.meta.clear()
})

afterEach(async () => {
  await db.chats.clear()
})

describe('chats CRUD', () => {
  it('creates a chat with default fields', async () => {
    const chat = await createChat()
    expect(chat.id).toBeTruthy()
    expect(chat.title).toBe('New chat')
    expect(chat.activeMessageId).toBeNull()
    expect(chat.renderer.renderer).toBe('maplibre')
    expect(chat.schemaVersion).toBe(1)
    const stored = await getChat(chat.id)
    expect(stored?.id).toBe(chat.id)
  })

  it('lists chats ordered by updatedAt desc', async () => {
    const a = await createChat()
    await new Promise((r) => setTimeout(r, 5))
    const b = await createChat()
    const list = await listChats()
    expect(list.map((c) => c.id)).toEqual([b.id, a.id])
  })

  it('rename updates title and updatedAt', async () => {
    const chat = await createChat()
    const before = chat.updatedAt
    await new Promise((r) => setTimeout(r, 5))
    await renameChat(chat.id, 'My map')
    const after = await getChat(chat.id)
    expect(after?.title).toBe('My map')
    expect(after!.updatedAt).toBeGreaterThan(before)
  })

  it('deletes chat and its messages', async () => {
    const chat = await createChat()
    await db.messages.add({
      id: 'm1',
      chatId: chat.id,
      role: 'user',
      text: 'hi',
      createdAt: Date.now(),
      schemaVersion: 1,
    })
    await deleteChat(chat.id)
    expect(await getChat(chat.id)).toBeUndefined()
    expect(await db.messages.where('chatId').equals(chat.id).count()).toBe(0)
  })

  it('setRenderer + setParamValues + setActiveMessage update fields', async () => {
    const chat = await createChat()
    await setRenderer(chat.id, {
      renderer: 'mapbox',
      mapboxToken: 'pk.test',
      mapboxStyleUrl: 'mapbox://styles/x/y',
    })
    await setParamValues(chat.id, { opacity: 0.5 })
    await setActiveMessage(chat.id, 'msg-1')
    const after = await getChat(chat.id)
    expect(after?.renderer.renderer).toBe('mapbox')
    expect(after?.activeParamValues.opacity).toBe(0.5)
    expect(after?.activeMessageId).toBe('msg-1')
  })
})
