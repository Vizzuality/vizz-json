import type { ComponentType } from 'react'

export type SlideDefinition = {
  readonly id: string
  readonly title: string
  readonly component: ComponentType
}

export type Act = {
  readonly id: string
  readonly label: string
  readonly startSlide: number
  readonly endSlide: number
}
