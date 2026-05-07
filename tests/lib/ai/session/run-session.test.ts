import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '#/lib/ai/persistence/db'
import { createChat, getChat } from '#/lib/ai/persistence/chats'
import { runAiSession } from '#/lib/ai/session/run-session'
import type { Chat } from '#/lib/ai/persistence/types'

const VALID_ENVELOPE = {
  metadata: { title: 'Heatmap', tier: 'basic' as const, description: 'd' },
  style: {
    sources: [
      { id: 'pts', type: 'geojson', data: 'https://example.com/x.geojson' },
    ],
    styles: [{ source: 'pts', id: 'l', type: 'circle' }],
  },
  parameterize: [],
}

function mockFetchOnce(body: unknown, status = 200) {
  return vi.spyOn(global, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
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

describe('runAiSession', () => {
  it('happy path: persists user + assistant message with snapshot, renames to envelope title, returns ok', async () => {
    mockFetchOnce({ reply: 'ok', envelope: VALID_ENVELOPE })

    const controller = new AbortController()
    const result = await runAiSession({
      chat,
      history: [],
      prompt: 'make a heatmap',
      signal: controller.signal,
    })

    expect(result.kind).toBe('ok')
    if (result.kind !== 'ok') throw new Error('unreachable')
    expect(result.replyText).toBe('ok')
    expect(result.envelope).toEqual(VALID_ENVELOPE)
    expect(result.snapshot.metadata.title).toBe('Heatmap')

    const rows = await db.messages
      .where('chatId')
      .equals(chat.id)
      .sortBy('createdAt')
    expect(rows).toHaveLength(2)
    expect(rows[0].role).toBe('user')
    expect(rows[0].text).toBe('make a heatmap')
    expect(rows[1].role).toBe('assistant')
    expect(rows[1].text).toBe('ok')
    expect(rows[1].schemaSnapshot?.metadata.title).toBe('Heatmap')

    const refreshed = await getChat(chat.id)
    expect(refreshed?.title).toBe('Heatmap')
  })

  it('reply-only: persists assistant message without snapshot, no envelope rename', async () => {
    await db.chats.update(chat.id, { title: 'User Edited' })
    const reloaded = (await getChat(chat.id))!
    mockFetchOnce({ reply: 'just words' })

    const controller = new AbortController()
    const result = await runAiSession({
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
      prompt: 'tell me a joke',
      signal: controller.signal,
    })

    expect(result.kind).toBe('reply-only')
    if (result.kind !== 'reply-only') throw new Error('unreachable')
    expect(result.replyText).toBe('just words')

    const rows = await db.messages
      .where('chatId')
      .equals(chat.id)
      .sortBy('createdAt')
    expect(rows).toHaveLength(2)
    expect(rows[1].role).toBe('assistant')
    expect(rows[1].text).toBe('just words')
    expect(rows[1].schemaSnapshot).toBeUndefined()

    const refreshed = await getChat(chat.id)
    expect(refreshed?.title).toBe('User Edited')
  })

  it('502 soft-fail: appends canned assistant message and returns soft-fail', async () => {
    mockFetchOnce({}, 502)

    const controller = new AbortController()
    const result = await runAiSession({
      chat,
      history: [],
      prompt: 'something impossible',
      signal: controller.signal,
    })

    expect(result.kind).toBe('soft-fail')

    const rows = await db.messages
      .where('chatId')
      .equals(chat.id)
      .sortBy('createdAt')
    expect(rows).toHaveLength(2)
    expect(rows[1].role).toBe('assistant')
    expect(rows[1].text).toBe(
      "I couldn't produce a valid map for that prompt. Try rephrasing or adding more detail.",
    )
    expect(rows[1].schemaSnapshot).toBeUndefined()
  })

  it('schema failure: returns error with non-empty message and no assistant message', async () => {
    mockFetchOnce({ wrong: 'shape' })

    const controller = new AbortController()
    const result = await runAiSession({
      chat,
      history: [],
      prompt: 'hi',
      signal: controller.signal,
    })

    expect(result.kind).toBe('error')
    if (result.kind !== 'error') throw new Error('unreachable')
    expect(result.message.length).toBeGreaterThan(0)

    const rows = await db.messages
      .where('chatId')
      .equals(chat.id)
      .sortBy('createdAt')
    expect(rows).toHaveLength(1)
    expect(rows[0].role).toBe('user')
  })

  it('abort: returns aborted, no assistant message persisted', async () => {
    const controller = new AbortController()
    vi.spyOn(global, 'fetch').mockImplementationOnce(
      (_input, init) =>
        new Promise((_, reject) => {
          const sig = init?.signal as AbortSignal | undefined
          const fail = () => {
            const err = new Error('aborted')
            err.name = 'AbortError'
            reject(err)
          }
          if (sig?.aborted) {
            fail()
            return
          }
          sig?.addEventListener('abort', fail)
        }),
    )

    const promise = runAiSession({
      chat,
      history: [],
      prompt: 'long running',
      signal: controller.signal,
    })

    // Defer the abort until after the orchestrator has reached fetch().
    await Promise.resolve()
    await Promise.resolve()
    controller.abort()
    const result = await promise

    expect(result.kind).toBe('aborted')

    const rows = await db.messages
      .where('chatId')
      .equals(chat.id)
      .sortBy('createdAt')
    expect(rows).toHaveLength(1)
    expect(rows[0].role).toBe('user')
  })

  it('first user message: renames chat to first 40 chars then envelope title supersedes it', async () => {
    mockFetchOnce({ reply: 'ok', envelope: VALID_ENVELOPE })

    const longPrompt = 'A '.repeat(30)
    const controller = new AbortController()
    const result = await runAiSession({
      chat,
      history: [],
      prompt: longPrompt,
      signal: controller.signal,
    })

    expect(result.kind).toBe('ok')
    const refreshed = await getChat(chat.id)
    expect(refreshed?.title).toBe(VALID_ENVELOPE.metadata.title)
  })
})
