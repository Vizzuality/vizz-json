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
})
