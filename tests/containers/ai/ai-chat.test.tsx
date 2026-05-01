import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AiChat } from '#/containers/ai/chat/ai-chat'

describe('AiChat', () => {
  it('renders prompt input and chip buttons', () => {
    render(
      <AiChat
        renderer={{ renderer: 'maplibre' }}
        onResult={vi.fn()}
        onError={vi.fn()}
        promptChips={['Show Sentinel-2']}
      />,
    )
    expect(screen.getByPlaceholderText(/describe a map/i)).toBeInTheDocument()
    expect(screen.getByText('Show Sentinel-2')).toBeInTheDocument()
  })
})
