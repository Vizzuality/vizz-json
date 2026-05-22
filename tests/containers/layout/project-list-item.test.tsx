import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProjectListItem from '#/containers/layout/project-list-item'
import type { Chat } from '#/lib/ai/persistence/types'

const makeChat = (overrides?: Partial<Chat>): Chat => ({
  id: 'chat-1',
  title: 'Test Project',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  schemaVersion: 2,
  renderer: { renderer: 'maplibre' },
  activeMessageId: null,
  ...overrides,
})

describe('ProjectListItem', () => {
  it('renders the chat title', () => {
    render(
      <ProjectListItem
        chat={makeChat()}
        isActive={false}
        onSelect={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('calls onSelect when row body is clicked', () => {
    const onSelect = vi.fn()
    render(
      <ProjectListItem
        chat={makeChat()}
        isActive={false}
        onSelect={onSelect}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByText('Test Project'))
    expect(onSelect).toHaveBeenCalledWith('chat-1')
  })

  it('shows active styling when isActive is true', () => {
    render(
      <ProjectListItem
        chat={makeChat()}
        isActive={true}
        onSelect={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    const row = screen.getByRole('listitem')
    expect(row.className).toMatch(/bg-primary/)
  })

  it('has a more-vertical button for the dropdown', () => {
    render(
      <ProjectListItem
        chat={makeChat()}
        isActive={false}
        onSelect={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('button', { name: /more options/i }),
    ).toBeInTheDocument()
  })

  it('rename dialog is accessible via setRenameOpen', () => {
    const onRename = vi.fn()
    render(
      <ProjectListItem
        chat={makeChat()}
        isActive={false}
        onSelect={vi.fn()}
        onRename={onRename}
        onDelete={vi.fn()}
        testOpenRename={true}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('delete alert is accessible via setDeleteOpen', () => {
    render(
      <ProjectListItem
        chat={makeChat()}
        isActive={false}
        onSelect={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        testOpenDelete={true}
      />,
    )
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('rename dialog calls onRename with new title on submit', () => {
    const onRename = vi.fn()
    render(
      <ProjectListItem
        chat={makeChat()}
        isActive={false}
        onSelect={vi.fn()}
        onRename={onRename}
        onDelete={vi.fn()}
        testOpenRename={true}
      />,
    )
    const input = screen.getByRole('textbox', { name: /project name/i })
    fireEvent.change(input, { target: { value: 'Renamed Title' } })
    fireEvent.click(screen.getByRole('button', { name: /^rename$/i }))
    expect(onRename).toHaveBeenCalledWith('chat-1', 'Renamed Title')
  })

  it('delete alert calls onDelete on confirm', () => {
    const onDelete = vi.fn()
    render(
      <ProjectListItem
        chat={makeChat()}
        isActive={false}
        onSelect={vi.fn()}
        onRename={vi.fn()}
        onDelete={onDelete}
        testOpenDelete={true}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(onDelete).toHaveBeenCalledWith('chat-1')
  })
})
