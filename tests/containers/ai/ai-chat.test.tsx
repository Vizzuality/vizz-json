import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AiChat } from '#/containers/ai/ai-chat'

vi.mock('@tanstack/ai-react', () => ({
  useChat: () => ({
    messages: [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', content: 'show me a raster' }],
      },
      {
        id: '2',
        role: 'assistant',
        parts: [{ type: 'text', content: 'Generated.' }],
      },
    ],
    sendMessage: vi.fn(),
    isLoading: false,
    stop: vi.fn(),
    clear: vi.fn(),
    error: null,
  }),
  fetchServerSentEvents: vi.fn(),
}))

describe('AiChat', () => {
  it('renders messages and prompt input', () => {
    render(
      <AiChat
        renderer={{ renderer: 'maplibre' }}
        onResult={vi.fn()}
        onError={vi.fn()}
        promptChips={[]}
      />,
    )
    expect(screen.getByText('show me a raster')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/describe a map/i)).toBeInTheDocument()
  })
})
