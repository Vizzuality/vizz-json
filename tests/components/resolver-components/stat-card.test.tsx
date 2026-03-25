import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '#/components/resolver-components/stat-card'

describe('StatCard', () => {
  it('renders label text', () => {
    render(<StatCard label="Population" value="8.1B" unit="people" color="#3b82f6" />)
    expect(screen.getByText('Population')).toBeInTheDocument()
  })

  it('renders value with accent color', () => {
    render(<StatCard label="Count" value="42" unit="items" color="#ef4444" />)
    const valueEl = screen.getByText('42')
    expect(valueEl).toBeInTheDocument()
    expect(valueEl).toHaveStyle({ color: '#ef4444' })
  })

  it('renders unit text', () => {
    render(<StatCard label="Area" value="510" unit="M km²" color="#000" />)
    expect(screen.getByText('M km²')).toBeInTheDocument()
  })
})
