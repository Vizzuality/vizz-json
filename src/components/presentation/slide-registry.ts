import type { SlideDefinition } from './slide-types'
import { TitleSlide } from './slides/title-slide'
import { PainPointSlide } from './slides/pain-point-slide'
import { WhatIfSlide } from './slides/what-if-slide'
import { PrefixOverviewSlide } from './slides/prefix-overview-slide'
import { ParamsSlide } from './slides/params-slide'
import { FunctionSlide } from './slides/function-slide'
import { TypeSlide } from './slides/type-slide'
import { ExpressionSlide } from './slides/expression-slide'
import { EnumSlide } from './slides/enum-slide'
import { PipelineSlide } from './slides/pipeline-slide'
import { ImmutabilitySlide } from './slides/immutability-slide'
import { ParamInferenceSlide } from './slides/param-inference-slide'
import { RecapSlide } from './slides/recap-slide'
import { TryItSlide } from './slides/try-it-slide'
import { ThankYouSlide } from './slides/thank-you-slide'

export const SLIDES: readonly SlideDefinition[] = [
  { id: 'title', title: 'VizzJson', totalSteps: 1, component: TitleSlide },
  {
    id: 'pain-point',
    title: 'The Problem',
    totalSteps: 2,
    component: PainPointSlide,
  },
  { id: 'what-if', title: 'What If...', totalSteps: 2, component: WhatIfSlide },
  {
    id: 'prefix-overview',
    title: 'The @@ Family',
    totalSteps: 5,
    component: PrefixOverviewSlide,
  },
  { id: 'params', title: '@@#params.X', totalSteps: 2, component: ParamsSlide },
  {
    id: 'function',
    title: '@@function:',
    totalSteps: 2,
    component: FunctionSlide,
  },
  { id: 'type', title: '@@type:', totalSteps: 2, component: TypeSlide },
  {
    id: 'expression',
    title: '@@=[...]',
    totalSteps: 2,
    component: ExpressionSlide,
  },
  { id: 'enum', title: '@@#ENUM.X', totalSteps: 1, component: EnumSlide },
  {
    id: 'pipeline',
    title: 'Resolution Pipeline',
    totalSteps: 4,
    component: PipelineSlide,
  },
  {
    id: 'immutability',
    title: 'Immutability',
    totalSteps: 2,
    component: ImmutabilitySlide,
  },
  {
    id: 'param-inference',
    title: 'Param Inference',
    totalSteps: 2,
    component: ParamInferenceSlide,
  },
  { id: 'recap', title: 'Key Takeaways', totalSteps: 4, component: RecapSlide },
  {
    id: 'try-it',
    title: 'Try It Yourself',
    totalSteps: 1,
    component: TryItSlide,
  },
  {
    id: 'thank-you',
    title: 'Thank You',
    totalSteps: 1,
    component: ThankYouSlide,
  },
] as const
