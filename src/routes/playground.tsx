import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AiPage } from '#/containers/ai/ai-page'

const search = z.object({
  chat: z.string().optional(),
})

export const Route = createFileRoute('/playground')({
  component: AiPage,
  validateSearch: search,
})
