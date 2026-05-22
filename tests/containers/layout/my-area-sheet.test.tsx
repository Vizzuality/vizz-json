import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MyAreaSheet from '#/containers/layout/my-area-sheet'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode
    to: string
    [key: string]: unknown
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

const mockCreateChat = vi.fn()
const mockDeleteChat = vi.fn()
const mockRenameChat = vi.fn()
const mockListChats = vi.fn()

vi.mock('#/lib/ai/persistence/chats', () => ({
  createChat: (...args: unknown[]) => mockCreateChat(...args),
  deleteChat: (...args: unknown[]) => mockDeleteChat(...args),
  renameChat: (...args: unknown[]) => mockRenameChat(...args),
  listChats: (...args: unknown[]) => mockListChats(...args),
}))

const mockMetaPut = vi.fn().mockResolvedValue(undefined)
const mockMetaDelete = vi.fn().mockResolvedValue(undefined)
const mockMetaGet = vi.fn().mockResolvedValue(undefined)

vi.mock('#/lib/ai/persistence/db', () => ({
  db: {
    meta: {
      put: (...args: unknown[]) => mockMetaPut(...args),
      delete: (...args: unknown[]) => mockMetaDelete(...args),
      get: (...args: unknown[]) => mockMetaGet(...args),
    },
  },
}))

const mockUseLiveQuery = vi.fn()

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}))

vi.mock('#/containers/layout/project-list-item', () => ({
  default: ({
    chat,
    onRename,
    onDelete,
  }: {
    chat: { id: string; title: string }
    onRename: (id: string, title: string) => void
    onDelete: (id: string) => void
  }) => (
    <li data-testid={`project-${chat.id}`}>
      <span>{chat.title}</span>
      <button onClick={() => onRename(chat.id, `${chat.title} renamed`)}>
        rename-{chat.id}
      </button>
      <button onClick={() => onDelete(chat.id)}>delete-{chat.id}</button>
    </li>
  ),
}))

function setupLiveQuery(chats: unknown, activeId: unknown) {
  let i = 0
  mockUseLiveQuery.mockImplementation(() => {
    const value = i % 2 === 0 ? chats : activeId
    i++
    return value
  })
}

vi.mock('#/containers/layout/locale-switcher', () => ({
  default: () => null,
}))

beforeEach(() => {
  mockNavigate.mockReset()
  mockCreateChat.mockReset()
  mockDeleteChat.mockReset()
  mockRenameChat.mockReset()
  mockListChats.mockReset()
  mockMetaPut.mockReset()
  mockMetaDelete.mockReset()
  mockMetaGet.mockReset()
  mockMetaPut.mockResolvedValue(undefined)
  mockMetaDelete.mockResolvedValue(undefined)
  mockMetaGet.mockResolvedValue(undefined)
  mockRenameChat.mockResolvedValue(undefined)
  mockDeleteChat.mockResolvedValue(undefined)
  mockListChats.mockResolvedValue([])
  mockCreateChat.mockResolvedValue({ id: 'new-chat-id', title: 'New chat' })
  mockUseLiveQuery.mockReset()
  mockUseLiveQuery.mockReturnValue(undefined)
})

describe('MyAreaSheet', () => {
  it('renders a hamburger Menu button in the trigger', () => {
    render(<MyAreaSheet />)
    expect(
      screen.getByRole('button', { name: /open menu/i }),
    ).toBeInTheDocument()
  })

  it('sheet is not visible before trigger is clicked', () => {
    render(<MyAreaSheet />)
    expect(screen.queryByText('All Projects')).not.toBeInTheDocument()
  })

  it('opens sheet when hamburger is clicked', async () => {
    render(<MyAreaSheet />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    await waitFor(() => {
      expect(screen.getByText('All Projects')).toBeInTheDocument()
    })
  })

  it('shows "+ New project" button inside sheet', async () => {
    render(<MyAreaSheet />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /new project/i }),
      ).toBeInTheDocument()
    })
  })

  it('clicking New project creates chat, sets active, and navigates', async () => {
    render(<MyAreaSheet />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const newProjectBtn = await screen.findByRole('button', {
      name: /new project/i,
    })
    fireEvent.click(newProjectBtn)
    await waitFor(() => {
      expect(mockCreateChat).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(mockMetaPut).toHaveBeenCalledWith({
        key: 'lastActiveChatId',
        value: 'new-chat-id',
      })
    })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/playground',
        search: { chat: 'new-chat-id' },
      })
    })
  })

  it('footer has Presentation link', async () => {
    render(<MyAreaSheet />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /presentation/i }),
      ).toBeInTheDocument()
    })
  })

  it('footer has Github link pointing to the repo URL', async () => {
    render(<MyAreaSheet />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    await waitFor(() => {
      const githubLink = screen.getByRole('link', { name: /github/i })
      expect(githubLink).toHaveAttribute(
        'href',
        'https://github.com/Vizzuality/vizz-json',
      )
    })
  })

  it('github link opens in new tab with noopener noreferrer', async () => {
    render(<MyAreaSheet />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    await waitFor(() => {
      const githubLink = screen.getByRole('link', { name: /github/i })
      expect(githubLink).toHaveAttribute('target', '_blank')
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('renaming a chat from the list calls renameChat with id and new title', async () => {
    const chat = {
      id: 'chat-a',
      title: 'Project A',
      createdAt: 0,
      updatedAt: 0,
      schemaVersion: 2,
      renderer: { renderer: 'maplibre' },
      activeMessageId: null,
    }
    setupLiveQuery([chat], null)

    render(<MyAreaSheet />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    fireEvent.click(await screen.findByText(/^rename-chat-a$/))

    await waitFor(() => {
      expect(mockRenameChat).toHaveBeenCalledWith('chat-a', 'Project A renamed')
    })
  })

  it('deleting a non-active chat calls deleteChat and does not clear active or navigate', async () => {
    const chat = {
      id: 'chat-a',
      title: 'Project A',
      createdAt: 0,
      updatedAt: 0,
      schemaVersion: 2,
      renderer: { renderer: 'maplibre' },
      activeMessageId: null,
    }
    setupLiveQuery([chat], 'chat-b')

    render(<MyAreaSheet />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    fireEvent.click(await screen.findByText(/^delete-chat-a$/))

    await waitFor(() => {
      expect(mockDeleteChat).toHaveBeenCalledWith('chat-a')
    })
    expect(mockMetaDelete).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('deleting the active chat clears lastActiveChatId and navigates to /playground', async () => {
    const chat = {
      id: 'chat-a',
      title: 'Project A',
      createdAt: 0,
      updatedAt: 0,
      schemaVersion: 2,
      renderer: { renderer: 'maplibre' },
      activeMessageId: null,
    }
    setupLiveQuery([chat], 'chat-a')

    render(<MyAreaSheet />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    fireEvent.click(await screen.findByText(/^delete-chat-a$/))

    await waitFor(() => {
      expect(mockDeleteChat).toHaveBeenCalledWith('chat-a')
    })
    await waitFor(() => {
      expect(mockMetaDelete).toHaveBeenCalledWith('lastActiveChatId')
    })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/playground',
        search: {},
      })
    })
  })
})
