import { JSONConfiguration, JSONConverter } from '@deck.gl/json'
import { ScatterplotLayer, ColumnLayer, GeoJsonLayer } from '@deck.gl/layers'
import { GradientLegend } from '#/components/legends/gradient-legend'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import { BasicLegend } from '#/components/legends/basic-legend'
import { registeredFunctions } from './functions'

export function createConverterConfig() {
  return new JSONConfiguration({
    classes: {
      ScatterplotLayer,
      // HexagonLayer is in @deck.gl/aggregation-layers (not installed); ColumnLayer used instead
      ColumnLayer,
      GeoJsonLayer,
    },
    functions: { ...registeredFunctions },
    enumerations: {},
    constants: {},
    reactComponents: {
      GradientLegend,
      ChoroplethLegend,
      BasicLegend,
    },
  })
}

export function createConverter() {
  const configuration = createConverterConfig()
  return new JSONConverter({ configuration })
}
