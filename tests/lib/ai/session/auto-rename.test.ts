import { describe, it, expect } from 'vitest'
import {
  shouldRenameOnFirstUserMessage,
  shouldRenameOnEnvelope,
} from '#/lib/ai/session/auto-rename'
import type { Message } from '#/lib/ai/persistence/types'

const sampleMessage: Message = {
  id: 'm1',
  chatId: 'c1',
  role: 'user',
  text: 'hi',
  createdAt: 0,
  schemaVersion: 1,
}

describe('shouldRenameOnFirstUserMessage', () => {
  it('returns true when history is empty', () => {
    expect(shouldRenameOnFirstUserMessage([])).toBe(true)
  })

  it('returns false when history has one message', () => {
    expect(shouldRenameOnFirstUserMessage([sampleMessage])).toBe(false)
  })
})

describe('shouldRenameOnEnvelope', () => {
  it('returns true when current title is "New chat"', () => {
    expect(shouldRenameOnEnvelope('New chat', 'whatever')).toBe(true)
  })

  it('returns true when current title equals first 40 chars of prompt', () => {
    const prompt =
      'Show Sentinel-2 imagery over Spain and Por' +
      'tugal with cloud filtering and time slider'
    const fallback = prompt.slice(0, 40)
    expect(shouldRenameOnEnvelope(fallback, prompt)).toBe(true)
  })

  it('returns true when current title equals full prompt', () => {
    const prompt = 'short prompt'
    expect(shouldRenameOnEnvelope(prompt, prompt)).toBe(true)
  })

  it('returns false when title is user-edited and unrelated', () => {
    expect(
      shouldRenameOnEnvelope('User Edited Title', 'unrelated prompt'),
    ).toBe(false)
  })
})
