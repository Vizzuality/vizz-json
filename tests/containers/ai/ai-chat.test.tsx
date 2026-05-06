import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { AiChat } from '#/containers/ai/chat/ai-chat'
import { db } from '#/lib/ai/persistence/db'
import { createChat } from '#/lib/ai/persistence/chats'
import type { Chat, Message } from '#/lib/ai/persistence/types'

const ENVELOPE = {
  metadata: { title: 'Test', tier: 'basic' as const, description: 'd' },
  style: {
    source: { type: 'geojson', data: 'https://example.com/x.geojson' },
    styles: [{ id: 'l', type: 'circle' }],
  },
  parameterize: [],
}
const SUCCESS_BODY = {
  reply: 'ok',
  envelope: ENVELOPE,
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

const PROMPT_CHIPS = ['Show Sentinel-2']

function makeProps(
  overrides: Partial<{
    chat: Chat
    messages: readonly Message[]
    onResult: (output: unknown) => void
    onError: (message: string) => void
    onClear: () => void
    promptChips: readonly string[]
    activeMessageId: string | null
    onSelectMessage: (id: string) => void
  }> = {},
) {
  return {
    chat,
    messages: [] as readonly Message[],
    promptChips: PROMPT_CHIPS,
    onResult: vi.fn(),
    onError: vi.fn(),
    onClear: vi.fn(),
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
    expect(screen.getByPlaceholderText(/describe a map/i)).toBeInTheDocument()
    expect(screen.getByText('Show Sentinel-2')).toBeInTheDocument()
  })

  it('submits on plain Enter', async () => {
    const fetchSpy = mockFetchOnce(SUCCESS_BODY)
    render(<AiChat {...makeProps()} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.change(textarea, { target: { value: 'hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
  })

  it('does NOT submit on Shift+Enter (newline)', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<AiChat {...makeProps()} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.change(textarea, { target: { value: 'hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does NOT submit while IME composition is active', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<AiChat {...makeProps()} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.change(textarea, { target: { value: 'こんにちは' } })
    fireEvent.keyDown(textarea, { key: 'Enter', isComposing: true })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does NOT submit on Enter when draft is empty', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<AiChat {...makeProps()} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('submits immediately when a prompt chip is clicked', async () => {
    const fetchSpy = mockFetchOnce(SUCCESS_BODY)
    render(<AiChat {...makeProps()} />)
    fireEvent.click(screen.getByText('Show Sentinel-2'))
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
    const [, init] = fetchSpy.mock.calls[0]
    const body = JSON.parse(init!.body as string)
    expect(body.messages.at(-1).parts[0].content).toBe('Show Sentinel-2')
  })

  it('replaces the current draft when a chip is clicked', async () => {
    const fetchSpy = mockFetchOnce(SUCCESS_BODY)
    render(<AiChat {...makeProps()} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a map/i), {
      target: { value: 'previous draft' },
    })
    fireEvent.click(screen.getByText('Show Sentinel-2'))
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string)
    expect(body.messages.at(-1).parts[0].content).toBe('Show Sentinel-2')
  })

  it('disables prompt chips while loading', async () => {
    // Never-resolving fetch keeps the component in `isLoading`.
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}))
    render(<AiChat {...makeProps()} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
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
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Stop' }),
    ).not.toBeInTheDocument()
    const textarea = screen.getByPlaceholderText(/describe a map/i)
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
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.change(textarea, { target: { value: 'go' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    const stopBtn = await screen.findByRole('button', { name: 'Stop' })
    fireEvent.click(stopBtn)
    await waitFor(() => expect(abortedSignal!.aborted).toBe(true))
  })

  it('disables Clear when there are no messages', () => {
    render(<AiChat {...makeProps({ messages: [] })} />)
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
  })

  it('enables Clear when messages prop has entries', () => {
    const messages: readonly Message[] = [
      {
        id: 'm1',
        chatId: chat.id,
        role: 'user',
        text: 'hi',
        createdAt: 1,
        schemaVersion: 1,
      },
    ]
    render(<AiChat {...makeProps({ messages })} />)
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled()
  })

  it('renders messages from props', () => {
    const messages: readonly Message[] = [
      {
        id: 'm1',
        chatId: chat.id,
        role: 'user',
        text: 'hi there',
        createdAt: 1,
        schemaVersion: 1,
      },
      {
        id: 'm2',
        chatId: chat.id,
        role: 'assistant',
        text: 'hello back',
        createdAt: 2,
        schemaVersion: 1,
      },
    ]
    render(<AiChat {...makeProps({ messages })} />)
    expect(screen.getByText('hi there')).toBeInTheDocument()
    expect(screen.getByText('hello back')).toBeInTheDocument()
  })

  it('confirms clear and calls onClear', async () => {
    const onClear = vi.fn()
    const messages: readonly Message[] = [
      {
        id: 'm1',
        chatId: chat.id,
        role: 'user',
        text: 'hi',
        createdAt: 1,
        schemaVersion: 1,
      },
    ]
    render(<AiChat {...makeProps({ messages, onClear })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(await screen.findByText('Clear chat?')).toBeInTheDocument()
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Clear' }))
    await waitFor(() => expect(onClear).toHaveBeenCalledTimes(1))
  })

  it('cancel does not call onClear', async () => {
    const onClear = vi.fn()
    const messages: readonly Message[] = [
      {
        id: 'm1',
        chatId: chat.id,
        role: 'user',
        text: 'hi',
        createdAt: 1,
        schemaVersion: 1,
      },
    ]
    render(<AiChat {...makeProps({ messages, onClear })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(onClear).not.toHaveBeenCalled()
  })

  it('Clear during loading aborts the request', async () => {
    let abortedSignal: AbortSignal | null = null
    vi.spyOn(global, 'fetch').mockImplementation((_, init) => {
      abortedSignal = init!.signal!
      return new Promise(() => {})
    })
    const onClear = vi.fn()
    const messages: readonly Message[] = [
      {
        id: 'm1',
        chatId: chat.id,
        role: 'user',
        text: 'hi',
        createdAt: 1,
        schemaVersion: 1,
      },
    ]
    render(<AiChat {...makeProps({ messages, onClear })} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.change(textarea, { target: { value: 'go' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    await screen.findByRole('button', { name: 'Stop' })

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Clear' }))

    await waitFor(() => expect(abortedSignal!.aborted).toBe(true))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
