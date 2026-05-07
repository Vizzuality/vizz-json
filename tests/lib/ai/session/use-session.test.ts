import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { db } from '#/lib/ai/persistence/db'
import { createChat } from '#/lib/ai/persistence/chats'
import type { AiSchema, Chat } from '#/lib/ai/persistence/types'
import { runAiSession } from '#/lib/ai/session/run-session'
import { useAiSession } from '#/lib/ai/session/use-session'
import type { AiSessionResult } from '#/lib/ai/session/types'

vi.mock('#/lib/ai/session/run-session', () => ({
  runAiSession: vi.fn(),
}))

const runAiSessionMock = vi.mocked(runAiSession)

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

const VALID_SNAPSHOT: AiSchema = {
  metadata: { title: 'Heatmap', tier: 'basic', description: 'd' },
  config: {},
  params_config: [],
}

const OK_RESULT: AiSessionResult = {
  kind: 'ok',
  envelope: VALID_ENVELOPE,
  snapshot: VALID_SNAPSHOT,
  replyText: 'r',
}

let chat: Chat

beforeEach(async () => {
  vi.clearAllMocks()
  await db.chats.clear()
  await db.messages.clear()
  chat = await createChat()
})

afterEach(async () => {
  await db.chats.clear()
  await db.messages.clear()
})

async function flushLiveQuery() {
  // useLiveQuery resolves async; flush microtasks + a macrotask + microtasks.
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))
    for (let i = 0; i < 20; i++) await Promise.resolve()
  })
}

async function renderHookForChat(chatId: string | null) {
  const utils = renderHook(() => useAiSession(chatId))
  if (chatId) await flushLiveQuery()
  return utils
}

describe('useAiSession', () => {
  it('flips isLoading true while in-flight then back to false', async () => {
    let resolveRun: (r: AiSessionResult) => void = () => {}
    runAiSessionMock.mockImplementationOnce(
      () =>
        new Promise<AiSessionResult>((resolve) => {
          resolveRun = resolve
        }),
    )

    const { result } = await renderHookForChat(chat.id)
    expect(result.current.isLoading).toBe(false)

    let submitPromise: Promise<void> = Promise.resolve()
    await act(async () => {
      submitPromise = result.current.submit('hello')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    await act(async () => {
      resolveRun(OK_RESULT)
      await submitPromise
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('calls runAiSession with chat, history, prompt, and an AbortSignal', async () => {
    runAiSessionMock.mockResolvedValueOnce(OK_RESULT)

    const { result } = await renderHookForChat(chat.id)

    await act(async () => {
      await result.current.submit('hi')
    })

    expect(runAiSessionMock).toHaveBeenCalledTimes(1)
    const call = runAiSessionMock.mock.calls[0][0]
    expect(call.chat.id).toBe(chat.id)
    expect(call.history).toEqual([])
    expect(call.prompt).toBe('hi')
    expect(call.signal).toBeInstanceOf(AbortSignal)
    expect(call.signal.aborted).toBe(false)
  })

  it('stop() aborts the in-flight signal and resets isLoading', async () => {
    runAiSessionMock.mockImplementationOnce(
      () => new Promise<AiSessionResult>(() => {}),
    )

    const { result } = await renderHookForChat(chat.id)

    await act(async () => {
      void result.current.submit('long')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    const signal = runAiSessionMock.mock.calls[0][0].signal
    expect(signal.aborted).toBe(false)

    await act(async () => {
      result.current.stop()
    })

    expect(signal.aborted).toBe(true)
    expect(result.current.isLoading).toBe(false)

    // Idempotent: calling stop again is safe.
    await act(async () => {
      result.current.stop()
    })
    expect(result.current.isLoading).toBe(false)
  })

  it('ignores a second submit while the first is in flight', async () => {
    runAiSessionMock.mockImplementationOnce(
      () => new Promise<AiSessionResult>(() => {}),
    )

    const { result } = await renderHookForChat(chat.id)

    await act(async () => {
      void result.current.submit('a')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    await act(async () => {
      await result.current.submit('b')
    })

    expect(runAiSessionMock).toHaveBeenCalledTimes(1)
    expect(runAiSessionMock.mock.calls[0][0].prompt).toBe('a')
  })

  it('sets lastError on error result and clears it on subsequent ok', async () => {
    runAiSessionMock.mockResolvedValueOnce({ kind: 'error', message: 'boom' })

    const { result } = await renderHookForChat(chat.id)

    await act(async () => {
      await result.current.submit('x')
    })

    expect(result.current.lastError).toBe('boom')

    runAiSessionMock.mockResolvedValueOnce(OK_RESULT)

    await act(async () => {
      await result.current.submit('y')
    })

    expect(result.current.lastError).toBeNull()
  })

  it('treats whitespace-only prompts as a no-op', async () => {
    const { result } = await renderHookForChat(chat.id)

    await act(async () => {
      await result.current.submit('   ')
    })

    expect(runAiSessionMock).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('submit is a no-op when chatId is null', async () => {
    const { result } = renderHook(() => useAiSession(null))

    await act(async () => {
      await result.current.submit('hello')
    })

    expect(runAiSessionMock).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('aborts the in-flight request when chatId changes', async () => {
    runAiSessionMock.mockImplementationOnce(
      () => new Promise<AiSessionResult>(() => {}),
    )
    const otherChat = await createChat()

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useAiSession(id),
      { initialProps: { id: chat.id } },
    )
    await flushLiveQuery()

    await act(async () => {
      void result.current.submit('first')
    })
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    const firstSignal = runAiSessionMock.mock.calls[0][0].signal

    rerender({ id: otherChat.id })
    await flushLiveQuery()

    expect(firstSignal.aborted).toBe(true)
    expect(result.current.isLoading).toBe(false)

    runAiSessionMock.mockResolvedValueOnce(OK_RESULT)
    await act(async () => {
      await result.current.submit('second')
    })
    expect(runAiSessionMock).toHaveBeenCalledTimes(2)
    expect(runAiSessionMock.mock.calls[1][0].chat.id).toBe(otherChat.id)
  })
})
