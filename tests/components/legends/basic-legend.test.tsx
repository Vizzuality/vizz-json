/**
 * BasicLegend tests — including defense against raw @@ param refs leaking into CSS.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BasicLegend } from '#/components/legends/basic-legend'
import type { LegendItem } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'

describe('BasicLegend — rendering', () => {
  it('renders a swatch per item', () => {
    const items: LegendItem[] = [{ label: 'Country fill', value: '#dbeafe' }]
    const { container } = render(<BasicLegend items={items} />)
    const swatches = container.querySelectorAll('.w-4.h-4')
    expect(swatches).toHaveLength(1)
  })

  it('renders item label', () => {
    const items: LegendItem[] = [{ label: 'Country fill', value: '#dbeafe' }]
    const { container } = render(<BasicLegend items={items} />)
    expect(container.textContent).toContain('Country fill')
  })

  it('resolves color via paramMapping and values (editable path)', () => {
    const items: LegendItem[] = [
      { label: 'Country fill', value: '@@#params.fill_color' },
    ]
    const paramMapping: ReadonlyMap<number, ItemParamMapping> = new Map([
      [0, { valueParamKey: 'fill_color' }],
    ])
    const values = { fill_color: '#dbeafe' }
    const onChange = () => undefined

    const { container } = render(
      <BasicLegend
        items={items}
        paramMapping={paramMapping}
        values={values}
        onChange={onChange}
      />,
    )
    // The editable label wraps a color input — the label's backgroundColor should be the resolved color
    const label = container.querySelector('label') as HTMLElement
    expect(label).not.toBeNull()
    expect(label.style.backgroundColor).toBe('rgb(219, 234, 254)') // #dbeafe parsed by browser
  })
})

describe('BasicLegend — defense against raw @@ param refs', () => {
  it('does not render @@ string in backgroundColor when no mapping', () => {
    const items: LegendItem[] = [
      { label: 'Country fill', value: '@@#params.fill_color' },
    ]
    const { container } = render(<BasicLegend items={items} />)
    // Static path — swatch backgroundColor must not be the raw ref
    const swatch = container.querySelector('.w-4.h-4') as HTMLElement
    expect(swatch.style.backgroundColor).not.toContain('@@')
  })

  it('falls back to transparent when item.value is an @@ ref in static path', () => {
    const items: LegendItem[] = [
      { label: 'Country fill', value: '@@#params.fill_color' },
    ]
    const { container } = render(<BasicLegend items={items} />)
    const swatch = container.querySelector('.w-4.h-4') as HTMLElement
    // With no mapping, the swatch should get transparent (browsers set empty string for invalid CSS)
    // "transparent" or "" are both acceptable — NOT an @@ string
    const bg = swatch.style.backgroundColor
    expect(bg).not.toContain('@')
  })
})
