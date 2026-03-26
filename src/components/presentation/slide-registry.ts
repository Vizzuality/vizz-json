import type { SlideDefinition } from './slide-types'
import { TitleSlide } from './slides/title-slide'
import { PainPointSlide } from './slides/pain-point-slide'
import { ChoroplethSlide } from './slides/choropleth-slide'
import { MultiLayerSlide } from './slides/multi-layer-slide'
import { WhatIfSlide } from './slides/what-if-slide'
import { PrefixOverviewSlide } from './slides/prefix-overview-slide'
import { ParamsSlide } from './slides/params-slide'
import { ParamsConfigSlide } from './slides/params-config-slide'
import { FunctionSlide } from './slides/function-slide'
import { FunctionRegistrySlide } from './slides/function-registry-slide'
import { TypeSlide } from './slides/type-slide'
import { TypeRegistrySlide } from './slides/type-registry-slide'
import { ExpressionSlide } from './slides/expression-slide'
import { PipelineSlide } from './slides/pipeline-slide'
import { CtaSlide } from './slides/cta-slide'

export const SLIDES: readonly SlideDefinition[] = [
  { id: 'title', title: 'VizzJson', component: TitleSlide },
  { id: 'pain-point', title: 'A Single Layer', component: PainPointSlide },
  { id: 'choropleth', title: 'Choropleth Layers', component: ChoroplethSlide },
  {
    id: 'multi-layer',
    title: 'Multiple Layer Types',
    component: MultiLayerSlide,
  },
  { id: 'what-if', title: 'What If...', component: WhatIfSlide },
  {
    id: 'prefix-overview',
    title: 'The @@ Family',
    component: PrefixOverviewSlide,
  },
  { id: 'params', title: '@@#params.X', component: ParamsSlide },
  {
    id: 'params-config',
    title: 'params_config',
    component: ParamsConfigSlide,
  },
  { id: 'function', title: '@@function:', component: FunctionSlide },
  {
    id: 'function-registry',
    title: 'Registering Functions',
    component: FunctionRegistrySlide,
  },
  { id: 'type', title: '@@type:', component: TypeSlide },
  {
    id: 'type-registry',
    title: 'Registering Components',
    component: TypeRegistrySlide,
  },
  { id: 'expression', title: '@@=[...]', component: ExpressionSlide },
  { id: 'pipeline', title: 'Resolution Pipeline', component: PipelineSlide },
  { id: 'cta', title: 'Try It', component: CtaSlide },
] as const
