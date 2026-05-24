import { describe, it, expect } from 'vitest'
import {
  slugify,
  buildFilename,
  buildPngFilename,
} from '#/containers/ai/export/export-menu'

describe('slugify', () => {
  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('converts plain ASCII with spaces to kebab-case lowercase', () => {
    expect(slugify('My Map Layer')).toBe('my-map-layer')
  })

  it('lowercases and strips punctuation, leaving only [a-z0-9-]', () => {
    expect(slugify('Hello, World! (2024)')).toBe('hello-world-2024')
  })

  it('collapses repeated separators into a single hyphen', () => {
    expect(slugify('foo   ---   bar')).toBe('foo-bar')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('---hello---')).toBe('hello')
  })

  it('caps output at 60 characters', () => {
    const input = 'a'.repeat(100)
    const result = slugify(input)
    expect(result.length).toBe(60)
    expect(result).toBe('a'.repeat(60))
  })

  it('handles unicode/whitespace without throwing and produces a valid slug or empty', () => {
    const inputs = ['Ünïcödé títlé', '\t\n  ', '日本語タイトル', '  ñoño  ']
    for (const input of inputs) {
      let result: string
      expect(() => {
        result = slugify(input)
      }).not.toThrow()
      // result must be either empty or match the slug pattern
      expect(result!).toMatch(/^$|^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })
})

describe('buildFilename', () => {
  it('returns vizz-export.json when title is undefined', () => {
    expect(buildFilename(undefined)).toBe('vizz-export.json')
  })

  it('returns vizz-export.json when title is an empty string', () => {
    expect(buildFilename('')).toBe('vizz-export.json')
  })

  it('returns vizz-<slug>.json for a real title', () => {
    expect(buildFilename('My Map: Layer 1')).toBe('vizz-my-map-layer-1.json')
  })
})

describe('buildPngFilename', () => {
  it('returns vizz-export.png when title is undefined', () => {
    expect(buildPngFilename(undefined)).toBe('vizz-export.png')
  })

  it('returns vizz-export.png when title is an empty string', () => {
    expect(buildPngFilename('')).toBe('vizz-export.png')
  })

  it('returns vizz-<slug>.png for a real title', () => {
    expect(buildPngFilename('My Map: Layer 1')).toBe('vizz-my-map-layer-1.png')
  })
})
