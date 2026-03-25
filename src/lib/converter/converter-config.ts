import { createVizzJson } from '@vizzuality/vizz-json'
import type { VizzJson } from '@vizzuality/vizz-json'
import { GradientLegend } from '#/components/legends/gradient-legend'
import { ChoroplethLegend } from '#/components/legends/choropleth-legend'
import { BasicLegend } from '#/components/legends/basic-legend'
import { InfoPanel } from '#/components/resolver-components/info-panel'
import { StatCard } from '#/components/resolver-components/stat-card'
import { registeredFunctions } from './functions'

export function createConverter(): VizzJson {
  return createVizzJson({
    classes: {},
    components: {
      GradientLegend,
      ChoroplethLegend,
      BasicLegend,
      InfoPanel,
      StatCard,
    },
    functions: { ...registeredFunctions },
    enumerations: {},
  })
}
