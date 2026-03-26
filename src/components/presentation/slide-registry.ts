import type { SlideDefinition } from './slide-types'
import { TitleSlide } from './slides/title-slide'
import { PainPointSlide } from './slides/pain-point-slide'
import { MultiLayerSlide } from './slides/multi-layer-slide'
import { WhatIfSlide } from './slides/what-if-slide'
import { PrefixOverviewSlide } from './slides/prefix-overview-slide'
import { ParamsSlide } from './slides/params-slide'
import { FunctionSlide } from './slides/function-slide'
import { TypeSlide } from './slides/type-slide'
import { ExpressionSlide } from './slides/expression-slide'
import { EnumSlide } from './slides/enum-slide'
import { PipelineSlide } from './slides/pipeline-slide'

export const SLIDES: readonly SlideDefinition[] = [
  { id: 'title', title: 'VizzJson', component: TitleSlide },
  { id: 'pain-point', title: 'A Single Layer', component: PainPointSlide },
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
  { id: 'function', title: '@@function:', component: FunctionSlide },
  { id: 'type', title: '@@type:', component: TypeSlide },
  { id: 'expression', title: '@@=[...]', component: ExpressionSlide },
  { id: 'enum', title: '@@#ENUM.X', component: EnumSlide },
  { id: 'pipeline', title: 'Resolution Pipeline', component: PipelineSlide },
] as const
