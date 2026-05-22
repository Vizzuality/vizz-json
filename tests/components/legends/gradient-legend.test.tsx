import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GradientLegend } from '#/components/legends/gradient-legend'
import type { LegendItem } from '#/lib/types'

function makeItems(count: number): LegendItem[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `label-${i}`,
    value: `#${String(i).padStart(6, '0')}`,
  }))
}

describe('GradientLegend — label rendering', () => {
  it('renders no label spans when items is empty', () => {
    render(<GradientLegend items={[]} />)
    expect(screen.queryAllByText(/label-/)).toHaveLength(0)
  })

  it('renders the single label when items.length === 1', () => {
    render(<GradientLegend items={makeItems(1)} />)
    expect(screen.getByText('label-0')).toBeInTheDocument()
  })

  it('renders both labels when items.length === 2 (per-item path, not min/max)', () => {
    render(<GradientLegend items={makeItems(2)} />)
    expect(screen.getByText('label-0')).toBeInTheDocument()
    expect(screen.getByText('label-1')).toBeInTheDocument()
  })

  it('renders only first and last labels when items.length === 3', () => {
    render(<GradientLegend items={makeItems(3)} />)
    expect(screen.getByText('label-0')).toBeInTheDocument()
    expect(screen.getByText('label-2')).toBeInTheDocument()
    expect(screen.queryByText('label-1')).not.toBeInTheDocument()
  })

  it('renders only first and last labels when items.length === 5', () => {
    render(<GradientLegend items={makeItems(5)} />)
    expect(screen.getByText('label-0')).toBeInTheDocument()
    expect(screen.getByText('label-4')).toBeInTheDocument()
    expect(screen.queryByText('label-1')).not.toBeInTheDocument()
    expect(screen.queryByText('label-2')).not.toBeInTheDocument()
    expect(screen.queryByText('label-3')).not.toBeInTheDocument()
  })

  it('bar element has class containing h-6', () => {
    const { container } = render(<GradientLegend items={makeItems(2)} />)
    const bar = container.querySelector('.h-6')
    expect(bar).not.toBeNull()
  })
})
