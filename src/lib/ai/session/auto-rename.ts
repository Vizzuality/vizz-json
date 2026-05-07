import type { Message } from '#/lib/ai/persistence/types'

export function shouldRenameOnFirstUserMessage(
  history: readonly Message[],
): boolean {
  return history.length === 0
}

export function shouldRenameOnEnvelope(
  currentTitle: string,
  userPrompt: string,
): boolean {
  return (
    currentTitle === 'New chat' ||
    currentTitle === userPrompt.slice(0, 40) ||
    currentTitle === userPrompt
  )
}
