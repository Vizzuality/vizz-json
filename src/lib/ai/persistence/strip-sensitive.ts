import type { Chat } from './types'

export function stripSensitive(chat: Chat): Chat {
  const { mapboxToken: _omit, ...renderer } = chat.renderer
  return { ...chat, renderer }
}
