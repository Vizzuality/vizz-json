import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import type { LegendItem } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'

function makeItems(count: number): LegendItem[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `label-${i}`,
    value: `#${String(i).padStart(6, '0')}`,
  }))
}

describe('ChoroplethLegend — label rendering', () => {
  it('renders no label spans when items is empty', () => {
    render(<ChoroplethLegend items={[]} />)
    expect(screen.queryAllByText(/label-/)).toHaveLength(0)
  })

  it('renders the single label when items.length === 1', () => {
    render(<ChoroplethLegend items={makeItems(1)} />)
    expect(screen.getByText('label-0')).toBeInTheDocument()
  })

  it('renders both labels when items.length === 2 (per-item path, not min/max)', () => {
    render(<ChoroplethLegend items={makeItems(2)} />)
    expect(screen.getByText('label-0')).toBeInTheDocument()
    expect(screen.getByText('label-1')).toBeInTheDocument()
  })

  it('renders only first and last labels when items.length === 3', () => {
    render(<ChoroplethLegend items={makeItems(3)} />)
    expect(screen.getByText('label-0')).toBeInTheDocument()
    expect(screen.getByText('label-2')).toBeInTheDocument()
    expect(screen.queryByText('label-1')).not.toBeInTheDocument()
  })

  it('renders only first and last labels when items.length === 5', () => {
    render(<ChoroplethLegend items={makeItems(5)} />)
    expect(screen.getByText('label-0')).toBeInTheDocument()
    expect(screen.getByText('label-4')).toBeInTheDocument()
    expect(screen.queryByText('label-1')).not.toBeInTheDocument()
    expect(screen.queryByText('label-2')).not.toBeInTheDocument()
    expect(screen.queryByText('label-3')).not.toBeInTheDocument()
  })

  it('color bar has class containing h-6', () => {
    const { container } = render(<ChoroplethLegend items={makeItems(2)} />)
    const bar = container.querySelector('.h-6')
    expect(bar).not.toBeNull()
  })

  it('resolves first and last labels via paramMapping labelParamKey in min/max mode', () => {
    // Override labels to simulate unresolved param refs
    const itemsWithRefs: LegendItem[] = [
      { label: '@@#params.minLabel', value: '#ff0000' },
      { label: 'middle', value: '#00ff00' },
      { label: '@@#params.maxLabel', value: '#0000ff' },
    ]

    const paramMapping: ReadonlyMap<number, ItemParamMapping> = new Map([
      [0, { labelParamKey: 'minLabel' }],
      [2, { labelParamKey: 'maxLabel' }],
    ])

    const values = {
      minLabel: 'Resolved Min',
      maxLabel: 'Resolved Max',
    }

    render(
      <ChoroplethLegend
        items={itemsWithRefs}
        paramMapping={paramMapping}
        values={values}
      />,
    )

    // min/max path: only first + last rendered, resolved via paramMapping
    expect(screen.getByText('Resolved Min')).toBeInTheDocument()
    expect(screen.getByText('Resolved Max')).toBeInTheDocument()
    expect(screen.queryByText('middle')).not.toBeInTheDocument()
  })
})
