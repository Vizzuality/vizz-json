import { createFileRoute } from '@tanstack/react-router'
import { GuidelinesLayout } from '#/components/guidelines/guidelines-layout'

export const Route = createFileRoute('/guidelines')({
  component: GuidelinesLayout,
})
