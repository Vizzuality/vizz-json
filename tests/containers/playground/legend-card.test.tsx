import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LegendCard } from '#/containers/playground/legend-card'
import type { InferredParam } from '#/lib/types'
import type { ItemParamMapping } from '#/lib/legend-param-mapping'

const colorParam: InferredParam = {
  key: 'color_a',
  value: '#ff0000',
  control_type: 'color_picker',
}

const radiusParam: InferredParam = {
  key: 'radius',
  value: 5,
  control_type: 'slider',
}

describe('LegendCard orphan filter', () => {
  it('hides orphan param whose key is bound to a legend item value', () => {
    const mapping: ReadonlyMap<number, ItemParamMapping> = new Map([
      [0, { valueParamKey: 'color_a' }],
    ])

    render(
      <LegendCard
        legendConfig={{
          type: 'basic',
          items: [{ label: 'Item A', value: '#ff0000' }],
        }}
        legendParams={[colorParam]}
        legendParamMapping={mapping}
        orphanLegendParams={[colorParam, radiusParam]}
        values={{}}
        onChange={() => {}}
      />,
    )

    expect(screen.getByText('radius')).toBeInTheDocument()
    expect(screen.queryByText('color_a')).not.toBeInTheDocument()
  })
})
