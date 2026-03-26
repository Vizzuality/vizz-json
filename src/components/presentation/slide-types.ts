import type { ComponentType } from 'react'

export type SlideDefinition = {
  readonly id: string
  readonly title: string
  readonly component: ComponentType
}
