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
  onResult: vi.fn(),
  onError: vi.fn(),
} as const

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
})
