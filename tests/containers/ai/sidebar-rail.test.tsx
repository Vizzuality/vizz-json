import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SidebarRail } from '#/containers/ai/sidebar/sidebar-rail'

describe('SidebarRail', () => {
  it('renders the four nav items with labels', () => {
    render(<SidebarRail value="chat" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /json/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /config/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /my area/i })).toBeInTheDocument()
  })

  it('marks the active item with aria-pressed', () => {
    render(<SidebarRail value="json" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /json/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /chat/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('calls onChange with the clicked value', () => {
    const onChange = vi.fn()
    render(<SidebarRail value="chat" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /my area/i }))
    expect(onChange).toHaveBeenCalledWith('my-area')
  })
})
