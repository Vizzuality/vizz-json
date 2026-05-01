import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AiChat } from '#/containers/ai/chat/ai-chat'

const ENVELOPE = {
  metadata: { title: 'Test', tier: 'basic' as const, description: 'd' },
  config: {},
  params_config: [],
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

const baseProps = {
  renderer: { renderer: 'maplibre' as const },
  promptChips: ['Show Sentinel-2'],
  hasSchema: false,
  onResult: vi.fn(),
  onError: vi.fn(),
  onClear: vi.fn(),
}

describe('AiChat', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders prompt input and chip buttons', () => {
    render(<AiChat {...baseProps} />)
    expect(screen.getByPlaceholderText(/describe a map/i)).toBeInTheDocument()
    expect(screen.getByText('Show Sentinel-2')).toBeInTheDocument()
  })

  it('submits on plain Enter', async () => {
    const fetchSpy = mockFetchOnce(SUCCESS_BODY)
    render(<AiChat {...baseProps} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.change(textarea, { target: { value: 'hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
  })

  it('does NOT submit on Shift+Enter (newline)', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<AiChat {...baseProps} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.change(textarea, { target: { value: 'hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does NOT submit while IME composition is active', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<AiChat {...baseProps} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.change(textarea, { target: { value: 'こんにちは' } })
    fireEvent.keyDown(textarea, { key: 'Enter', isComposing: true })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does NOT submit on Enter when draft is empty', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    render(<AiChat {...baseProps} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('submits immediately when a prompt chip is clicked', async () => {
    const fetchSpy = mockFetchOnce(SUCCESS_BODY)
    render(<AiChat {...baseProps} />)
    fireEvent.click(screen.getByText('Show Sentinel-2'))
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
    const [, init] = fetchSpy.mock.calls[0]
    const body = JSON.parse(init!.body as string)
    expect(body.messages.at(-1).parts[0].content).toBe('Show Sentinel-2')
  })

  it('replaces the current draft when a chip is clicked', async () => {
    const fetchSpy = mockFetchOnce(SUCCESS_BODY)
    render(<AiChat {...baseProps} />)
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
    render(<AiChat {...baseProps} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.change(textarea, { target: { value: 'kick off' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    // Chips remain in the DOM until the first message lands; while loading they
    // must be disabled.
    await waitFor(() => {
      const chip = screen.getByRole('button', { name: 'Show Sentinel-2' })
      expect(chip).toBeDisabled()
    })
  })

  it('shows Send when idle and Stop when loading', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}))
    render(<AiChat {...baseProps} />)
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
    render(<AiChat {...baseProps} />)
    const textarea = screen.getByPlaceholderText(/describe a map/i)
    fireEvent.change(textarea, { target: { value: 'go' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    const stopBtn = await screen.findByRole('button', { name: 'Stop' })
    fireEvent.click(stopBtn)
    await waitFor(() => expect(abortedSignal!.aborted).toBe(true))
  })

  it('disables Clear when no messages and no schema', () => {
    render(<AiChat {...baseProps} hasSchema={false} />)
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
  })

  it('enables Clear when schema is present even without messages', () => {
    render(<AiChat {...baseProps} hasSchema={true} />)
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled()
  })

  it('enables Clear after a successful message exchange', async () => {
    mockFetchOnce(SUCCESS_BODY)
    const { rerender } = render(<AiChat {...baseProps} hasSchema={false} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a map/i), {
      target: { value: 'hi' },
    })
    fireEvent.keyDown(screen.getByPlaceholderText(/describe a map/i), {
      key: 'Enter',
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled(),
    )
    rerender(<AiChat {...baseProps} hasSchema={false} />)
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled()
  })

  it('confirms clear, wipes messages, and calls onClear', async () => {
    mockFetchOnce(SUCCESS_BODY)
    const onClear = vi.fn()
    render(<AiChat {...baseProps} hasSchema={true} onClear={onClear} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a map/i), {
      target: { value: 'hi' },
    })
    fireEvent.keyDown(screen.getByPlaceholderText(/describe a map/i), {
      key: 'Enter',
    })
    await waitFor(() => expect(screen.getByText('hi')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(await screen.findByText('Clear chat?')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: /^Clear$/, hidden: false }),
    )

    await waitFor(() => expect(onClear).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('hi')).not.toBeInTheDocument()
  })

  it('cancel keeps messages and does not call onClear', async () => {
    mockFetchOnce(SUCCESS_BODY)
    const onClear = vi.fn()
    render(<AiChat {...baseProps} hasSchema={true} onClear={onClear} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a map/i), {
      target: { value: 'hi' },
    })
    fireEvent.keyDown(screen.getByPlaceholderText(/describe a map/i), {
      key: 'Enter',
    })
    await waitFor(() => expect(screen.getByText('hi')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(onClear).not.toHaveBeenCalled()
    expect(screen.getByText('hi')).toBeInTheDocument()
  })

  it('Clear during loading aborts the request', async () => {
    let abortedSignal: AbortSignal | null = null
    vi.spyOn(global, 'fetch').mockImplementation((_, init) => {
      abortedSignal = init!.signal!
      return new Promise(() => {})
    })
    const onClear = vi.fn()
    render(<AiChat {...baseProps} hasSchema={true} onClear={onClear} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a map/i), {
      target: { value: 'hi' },
    })
    fireEvent.keyDown(screen.getByPlaceholderText(/describe a map/i), {
      key: 'Enter',
    })
    await screen.findByRole('button', { name: 'Stop' })

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    fireEvent.click(await screen.findByRole('button', { name: /^Clear$/ }))

    await waitFor(() => expect(abortedSignal!.aborted).toBe(true))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
