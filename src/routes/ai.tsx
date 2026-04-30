import { createFileRoute } from '@tanstack/react-router'
import { AiPage } from '#/containers/ai/ai-page'

export const Route = createFileRoute('/ai')({
  component: AiPage,
})
