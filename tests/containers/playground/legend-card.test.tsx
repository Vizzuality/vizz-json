import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LegendCard } from '#/containers/playground/legend-card'
import type { InferredParam } from '#/lib/types'
import type { SourceLegendEntry } from '#/lib/pipeline/types'

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

// Helper to build a minimal SourceLegendEntry
function makeEntry(
  sourceId: string,
  type: 'basic' | 'choropleth' | 'gradient',
  items: { label: string; value: string | number }[],
  paramMapping: ReadonlyMap<number, { valueParamKey?: string }> = new Map(),
): SourceLegendEntry {
  return {
    sourceId,
    rawLegend: { type, items },
    resolvedLegend: { type, items },
    paramMapping,
    thresholdParams: [],
  }
}

describe('LegendCard', () => {
  describe('0 sourceLegends + 0 orphans', () => {
    it('renders nothing (returns null)', () => {
      const { container } = render(
        <LegendCard
          sourceLegends={[]}
          orphanLegendParams={[]}
          values={{}}
          onChange={() => {}}
        />,
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('1 sourceLegend (basic)', () => {
    it('renders one legend block', () => {
      const entry = makeEntry('imagery', 'basic', [
        { label: 'Sentinel-2', value: '#ffffff' },
      ])

      render(
        <LegendCard
          sourceLegends={[entry]}
          orphanLegendParams={[]}
          values={{}}
          onChange={() => {}}
        />,
      )

      expect(screen.getByText('Sentinel-2')).toBeInTheDocument()
    })

    it('does NOT show a source-id label when there is only one source', () => {
      const entry = makeEntry('imagery', 'basic', [
        { label: 'Sentinel-2', value: '#ffffff' },
      ])

      render(
        <LegendCard
          sourceLegends={[entry]}
          orphanLegendParams={[]}
          values={{}}
          onChange={() => {}}
        />,
      )

      // The source-id label is only rendered when sourceLegends.length > 1
      expect(screen.queryByText('imagery')).not.toBeInTheDocument()
    })
  })

  describe('2 sourceLegends (basic + choropleth)', () => {
    it('renders two legend blocks', () => {
      const entry1 = makeEntry('countries', 'basic', [
        { label: 'Country fill', value: '#dbeafe' },
      ])
      const entry2 = makeEntry('points', 'choropleth', [
        { label: 'High', value: '#ff0000' },
        { label: 'Low', value: '#0000ff' },
      ])

      render(
        <LegendCard
          sourceLegends={[entry1, entry2]}
          orphanLegendParams={[]}
          values={{}}
          onChange={() => {}}
        />,
      )

      expect(screen.getByText('Country fill')).toBeInTheDocument()
      expect(screen.getByText('High')).toBeInTheDocument()
      expect(screen.getByText('Low')).toBeInTheDocument()
    })

    it('shows source-id labels when there are 2 sources', () => {
      const entry1 = makeEntry('countries', 'basic', [
        { label: 'Fill', value: '#fff' },
      ])
      const entry2 = makeEntry('capitals', 'choropleth', [
        { label: 'Point', value: '#000' },
      ])

      render(
        <LegendCard
          sourceLegends={[entry1, entry2]}
          orphanLegendParams={[]}
          values={{}}
          onChange={() => {}}
        />,
      )

      expect(screen.getByText('countries')).toBeInTheDocument()
      expect(screen.getByText('capitals')).toBeInTheDocument()
    })
  })

  describe('orphan params', () => {
    it('renders orphan param controls when sourceLegends is empty but orphans present', () => {
      render(
        <LegendCard
          sourceLegends={[]}
          orphanLegendParams={[radiusParam]}
          values={{}}
          onChange={() => {}}
        />,
      )

      expect(screen.getByText('radius')).toBeInTheDocument()
    })

    it('hides orphan param whose key is bound in a source paramMapping', () => {
      const mapping: ReadonlyMap<number, { valueParamKey?: string }> = new Map([
        [0, { valueParamKey: 'color_a' }],
      ])

      const entry = makeEntry(
        'src',
        'basic',
        [{ label: 'Item A', value: '#ff0000' }],
        mapping,
      )

      render(
        <LegendCard
          sourceLegends={[entry]}
          orphanLegendParams={[colorParam, radiusParam]}
          values={{}}
          onChange={() => {}}
        />,
      )

      // radius is not bound → visible
      expect(screen.getByText('radius')).toBeInTheDocument()
      // color_a is bound via paramMapping → hidden
      expect(screen.queryByText('color_a')).not.toBeInTheDocument()
    })

    it('renders all orphan params when none are bound', () => {
      render(
        <LegendCard
          sourceLegends={[]}
          orphanLegendParams={[colorParam, radiusParam]}
          values={{}}
          onChange={() => {}}
        />,
      )

      expect(screen.getByText('color_a')).toBeInTheDocument()
      expect(screen.getByText('radius')).toBeInTheDocument()
    })
  })

  describe('combined: sourceLegends + orphans', () => {
    it('renders legend block AND orphan controls together', () => {
      const entry = makeEntry('main', 'basic', [
        { label: 'Item', value: '#fff' },
      ])

      render(
        <LegendCard
          sourceLegends={[entry]}
          orphanLegendParams={[radiusParam]}
          values={{}}
          onChange={() => {}}
        />,
      )

      expect(screen.getByText('Item')).toBeInTheDocument()
      expect(screen.getByText('radius')).toBeInTheDocument()
    })
  })
})
