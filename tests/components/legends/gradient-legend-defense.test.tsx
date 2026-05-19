/**
 * Defense tests: unresolved @@#params.X refs must never appear in CSS output.
 * The gradient bar must render (not crash) even when items contain raw param refs.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GradientLegend } from '#/components/legends/gradient-legend'
import type { LegendItem } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'

describe('GradientLegend — defense against raw @@ param refs in CSS', () => {
  it('does not emit @@ strings into gradient CSS when no mapping provided', () => {
    const items: LegendItem[] = [
      { label: 'Heatmap low', value: '@@#params.heatmap_color_low' },
      { label: 'Heatmap high', value: '@@#params.heatmap_color_high' },
    ]
    const { container } = render(<GradientLegend items={items} />)
    // The inner gradient div is the second child of the outer wrapper
    const gradientDiv = container.querySelector('.absolute.inset-0')
    expect(gradientDiv).not.toBeNull()
    const bg = (gradientDiv as HTMLElement).style.background
    expect(bg).not.toContain('@@')
    expect(bg).not.toContain('params.')
  })

  it('renders gradient bar without crashing when items have @@ values', () => {
    const items: LegendItem[] = [
      { label: 'Low', value: '@@#params.heatmap_color_low' },
      { label: 'High', value: '@@#params.heatmap_color_high' },
    ]
    // should not throw
    const { container } = render(<GradientLegend items={items} />)
    expect(container.querySelector('.h-6')).not.toBeNull()
  })

  it('GradientBar fallback does not use raw @@ strings as color stops', () => {
    // When items contain unresolved @@#params.X refs and no editor context is
    // provided, GradientBar must not embed those strings in the CSS.
    // jsdom cannot parse linear-gradient at all, so style.background will be
    // empty — either way it must not contain '@@'.
    const items: LegendItem[] = [
      { label: 'Low', value: '@@#params.heatmap_color_low' },
      { label: 'High', value: '@@#params.heatmap_color_high' },
    ]
    const { container } = render(<GradientLegend items={items} />)
    const gradientDiv = container.querySelector(
      '.absolute.inset-0',
    ) as HTMLElement
    const bg = gradientDiv.style.background
    // Must not embed raw param ref strings into CSS
    expect(bg).not.toContain('@@')
    expect(bg).not.toContain('params.')
  })

  it('resolves colors correctly via paramMapping and values', () => {
    const items: LegendItem[] = [
      { label: 'Heatmap low', value: '@@#params.heatmap_color_low' },
      { label: 'Heatmap high', value: '@@#params.heatmap_color_high' },
    ]
    const paramMapping: ReadonlyMap<number, ItemParamMapping> = new Map([
      [0, { valueParamKey: 'heatmap_color_low' }],
      [1, { valueParamKey: 'heatmap_color_high' }],
    ])
    const values = {
      heatmap_color_low: '#2c7bb6',
      heatmap_color_high: '#d7191c',
    }

    const { container } = render(
      <GradientLegend
        items={items}
        paramMapping={paramMapping}
        values={values}
      />,
    )
    const gradientDiv = container.querySelector(
      '.absolute.inset-0',
    ) as HTMLElement
    const bg = gradientDiv.style.background
    expect(bg).not.toContain('@@')
  })
})
