import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PanelHeader } from '#/containers/ai/panel-header'

describe('PanelHeader', () => {
  it('renders a static string title', () => {
    render(<PanelHeader title="My area" />)
    expect(screen.getByText('My area')).toBeInTheDocument()
  })

  it('renders an editable title and renames on Enter', () => {
    const onRename = vi.fn()
    render(<PanelHeader title={{ value: 'Hello', onRename }} />)
    fireEvent.click(screen.getByRole('button', { name: /rename/i }))
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Renamed' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Renamed')
  })

  it('cancels rename on Escape without firing onRename', () => {
    const onRename = vi.fn()
    render(<PanelHeader title={{ value: 'Hello', onRename }} />)
    fireEvent.click(screen.getByRole('button', { name: /rename/i }))
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'X' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders actions on the right', () => {
    render(
      <PanelHeader
        title="Chat"
        actions={<button type="button">Action</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })
})
