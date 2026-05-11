import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '#/lib/ai/persistence/db'
import { createChat, getChat } from '#/lib/ai/persistence/chats'
import { ingestSnapshot } from '#/lib/ai/session/ingest-snapshot'
import type { AiSchema, Chat } from '#/lib/ai/persistence/types'

const SNAPSHOT: AiSchema = {
  metadata: {
    title: 'Pasted Heatmap',
    description: 'd',
    tier: 'basic',
  },
  config: {
    sources: [{ id: 'pts', type: 'geojson' }],
    styles: [{ source: 'pts', id: 'l', type: 'circle' }],
  },
  params_config: [{ key: 'opacity', default: 0.5 }],
}

let chat: Chat

beforeEach(async () => {
  vi.restoreAllMocks()
  await db.chats.clear()
  await db.messages.clear()
  chat = await createChat()
})

afterEach(async () => {
  vi.restoreAllMocks()
})

describe('ingestSnapshot', () => {
  it('appends user + assistant message with snapshot, never calls fetch', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    const result = await ingestSnapshot({
      chat,
      history: [],
      snapshot: SNAPSHOT,
      userText: JSON.stringify(SNAPSHOT),
    })

    expect(result.kind).toBe('ok')
    expect(fetchSpy).not.toHaveBeenCalled()

    const rows = await db.messages
      .where('chatId')
      .equals(chat.id)
      .sortBy('createdAt')
    expect(rows).toHaveLength(2)
    expect(rows[0].role).toBe('user')
    expect(rows[1].role).toBe('assistant')
    expect(rows[1].text).toBe('Imported pasted JSON.')
    expect(rows[1].schemaSnapshot?.metadata.title).toBe('Pasted Heatmap')
    expect(rows[1].paramValues?.opacity).toBe(0.5)
  })

  it('renames the chat to snapshot title on first user message', async () => {
    await ingestSnapshot({
      chat,
      history: [],
      snapshot: SNAPSHOT,
      userText: JSON.stringify(SNAPSHOT),
    })
    const refreshed = await getChat(chat.id)
    expect(refreshed?.title).toBe('Pasted Heatmap')
  })

  it('does not rename when history already has messages', async () => {
    await db.chats.update(chat.id, { title: 'User Edited' })
    const reloaded = (await getChat(chat.id))!

    await ingestSnapshot({
      chat: reloaded,
      history: [
        {
          id: 'prev',
          chatId: chat.id,
          role: 'user',
          text: 'prior',
          createdAt: 0,
          schemaVersion: 1,
        },
      ],
      snapshot: SNAPSHOT,
      userText: JSON.stringify(SNAPSHOT),
    })

    const refreshed = await getChat(chat.id)
    expect(refreshed?.title).toBe('User Edited')
  })
})
