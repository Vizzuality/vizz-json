import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MyAreaPanel } from '#/containers/ai/sidebar/my-area-panel'
import { db } from '#/lib/ai/persistence/db'
import { createChat } from '#/lib/ai/persistence/chats'

beforeEach(async () => {
  await db.transaction('rw', db.chats, db.messages, async () => {
    await db.chats.clear()
    await db.messages.clear()
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MyAreaPanel', () => {
  it('lists chats and highlights the active one', async () => {
    const a = await createChat()
    const b = await createChat()
    render(<MyAreaPanel activeChatId={a.id} onSelectChat={() => {}} />)
    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: a.title }).length,
      ).toBeGreaterThan(0)
      expect(
        screen.getAllByRole('button', { name: b.title }).length,
      ).toBeGreaterThan(0)
    })
  })

  it('renders an empty state when there are no chats', async () => {
    render(<MyAreaPanel activeChatId={null} onSelectChat={() => {}} />)
    await waitFor(() =>
      expect(screen.getByText(/no chats yet/i)).toBeInTheDocument(),
    )
  })
})
