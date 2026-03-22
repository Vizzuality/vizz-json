import { createSuperJSON, type SuperJSON } from 'super-json'
import { ScatterplotLayer, ColumnLayer, GeoJsonLayer } from '@deck.gl/layers'
import { GradientLegend } from '#/components/legends/gradient-legend'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import { BasicLegend } from '#/components/legends/basic-legend'
import { registeredFunctions } from './functions'

export function createConverter(): SuperJSON {
  return createSuperJSON({
    classes: {
      ScatterplotLayer,
      // HexagonLayer is in @deck.gl/aggregation-layers (not installed); ColumnLayer used instead
      ColumnLayer,
      GeoJsonLayer,
    },
    components: {
      GradientLegend,
      ChoroplethLegend,
      BasicLegend,
    },
    functions: { ...registeredFunctions },
    enumerations: {},
  })
}
