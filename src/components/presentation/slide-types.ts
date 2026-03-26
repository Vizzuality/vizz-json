import type { ComponentType } from 'react'

export type SlideProps = {
  readonly step: number
}

export type SlideDefinition = {
  readonly id: string
  readonly title: string
  readonly totalSteps: number
  readonly component: ComponentType<SlideProps>
}
