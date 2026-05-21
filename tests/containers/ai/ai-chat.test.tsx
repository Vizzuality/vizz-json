import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AiChat } from '#/containers/ai/chat/ai-chat'
import { db } from '#/lib/ai/persistence/db'
import { createChat } from '#/lib/ai/persistence/chats'
import type { AiSchema, Chat, Message } from '#/lib/ai/persistence/types'

const CHIP_SNAPSHOT: AiSchema = {
  metadata: { title: 'Sentinel-2', tier: 'basic', description: 'd' },
  config: {
    sources: [
      {
        id: 'imagery',
        type: 'raster',
        tiles: ['https://example.com/{z}/{y}/{x}.jpg'],
      },
    ],
    styles: [{ source: 'imagery', type: 'raster' }],
  },
  params_config: [],
}

const ENVELOPE = {
  metadata: { title: 'Test', tier: 'basic' as const, description: 'd' },
  style: {
    sources: [
      { id: 'pts', type: 'geojson', data: 'https://example.com/x.geojson' },
    ],
    styles: [{ source: 'pts', id: 'l', type: 'circle' }],
  },
  parameterize: [],
}
const SUCCESS_BODY = {
  reply: 'ok',
  envelope: ENVELOPE,
}

async function flushLiveQuery() {
  // useLiveQuery resolves async; flush microtasks + a macrotask + microtasks.
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))
    for (let i = 0; i < 20; i++) await Promise.resolve()
  })
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

async function setupChat(): Promise<Chat> {
  return await createChat()
}

const CHIPS = [{ label: 'Show Sentinel-2', snapshot: CHIP_SNAPSHOT }]

function makeProps(
  overrides: Partial<{
    chat: Chat
    messages: readonly Message[]
    chips: readonly { label: string; snapshot: AiSchema }[]
    activeMessageId: string | null
    onSelectMessage: (id: string) => void
  }> = {},
) {
  return {
    chat,
    messages: [] as readonly Message[],
    chips: CHIPS,
    activeMessageId: null,
    onSelectMessage: vi.fn(),
    ...overrides,
  }
}

describe('AiChat', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    await db.chats.clear()
    await db.messages.clear()
    chat = await setupChat()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders prompt input and chip buttons', () => {
    render(<AiChat {...makeProps()} />)
    expect(
      screen.getByPlaceholderText(/how would you like/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Show Sentinel-2')).toBeInTheDocument()
  })

  it('submits on plain Enter', async () => {
    const fetchSpy = mockFetchOnce(SUCCESS_BODY)
    render(<AiChat {...makeProps()} />)
    await flushLiveQuery()
    const textarea = screen.getByPlaceholderText(/how would you like/i)
    fireEvent.change(textarea, { target: { value: 'hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
  })

  it('does NOT submit on Shift+Enter (newline)', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<AiChat {...makeProps()} />)
    const textarea = screen.getByPlaceholderText(/how would you like/i)
    fireEvent.change(textarea, { target: { value: 'hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does NOT submit while IME composition is active', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<AiChat {...makeProps()} />)
    const textarea = screen.getByPlaceholderText(/how would you like/i)
    fireEvent.change(textarea, { target: { value: 'こんにちは' } })
    fireEvent.keyDown(textarea, { key: 'Enter', isComposing: true })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does NOT submit on Enter when draft is empty', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<AiChat {...makeProps()} />)
    const textarea = screen.getByPlaceholderText(/how would you like/i)
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('ingests example snapshot without hitting the AI endpoint', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<AiChat {...makeProps()} />)
    await flushLiveQuery()
    fireEvent.click(screen.getByText('Show Sentinel-2'))
    await waitFor(async () => {
      const msgs = await db.messages.where('chatId').equals(chat.id).toArray()
      const assistant = msgs.find((m) => m.role === 'assistant')
      expect(assistant?.schemaSnapshot?.metadata.title).toBe('Sentinel-2')
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('clears the current draft when a chip is clicked', async () => {
    render(<AiChat {...makeProps()} />)
    await flushLiveQuery()
    const textarea = screen.getByPlaceholderText(/how would you like/i)
    fireEvent.change(textarea, { target: { value: 'previous draft' } })
    fireEvent.click(screen.getByText('Show Sentinel-2'))
    await waitFor(() =>
      expect((textarea as HTMLTextAreaElement).value).toBe(''),
    )
  })

  it('disables prompt chips while loading', async () => {
    // Never-resolving fetch keeps the component in `isLoading`.
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}))
    render(<AiChat {...makeProps()} />)
    await flushLiveQuery()
    const textarea = screen.getByPlaceholderText(/how would you like/i)
    fireEvent.change(textarea, { target: { value: 'kick off' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    await waitFor(() => {
      const chip = screen.getByRole('button', { name: 'Show Sentinel-2' })
      expect(chip).toBeDisabled()
    })
  })

  it('shows Send when idle and Stop when loading', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}))
    render(<AiChat {...makeProps()} />)
    await flushLiveQuery()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Stop' }),
    ).not.toBeInTheDocument()
    const textarea = screen.getByPlaceholderText(/how would you like/i)
    fireEvent.change(textarea, { target: { value: 'go' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument(),
    )
    expect(
      screen.queryByRole('button', { name: 'Send' }),
    ).not.toBeInTheDocument()
  })

  it('Stop button aborts the in-flight request', async () => {
    let abortedSignal: AbortSignal | null = null
    vi.spyOn(global, 'fetch').mockImplementation((_, init) => {
      abortedSignal = init!.signal!
      return new Promise(() => {})
    })
    render(<AiChat {...makeProps()} />)
    await flushLiveQuery()
    const textarea = screen.getByPlaceholderText(/how would you like/i)
    fireEvent.change(textarea, { target: { value: 'go' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    const stopBtn = await screen.findByRole('button', { name: 'Stop' })
    fireEvent.click(stopBtn)
    await waitFor(() => expect(abortedSignal!.aborted).toBe(true))
  })

  it('renders messages from props', () => {
    const messages: readonly Message[] = [
      {
        id: 'm1',
        chatId: chat.id,
        role: 'user',
        text: 'hi there',
        createdAt: 1,
        schemaVersion: 2,
      },
      {
        id: 'm2',
        chatId: chat.id,
        role: 'assistant',
        text: 'hello back',
        createdAt: 2,
        schemaVersion: 2,
      },
    ]
    render(<AiChat {...makeProps({ messages })} />)
    expect(screen.getByText('hi there')).toBeInTheDocument()
    expect(screen.getByText('hello back')).toBeInTheDocument()
  })
})
