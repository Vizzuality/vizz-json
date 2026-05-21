/**
 * Unit tests for the color-binding validator gate + 1-retry logic.
 *
 * The ai-generate route uses this pure helper (`validateAndRetry`) so the
 * retry semantics can be tested without spinning up TanStack Start server
 * infrastructure or mocking @tanstack/ai adapters.
 *
 * The `validate` function from #/lib/validator is mocked via vi.mock so these
 * tests exercise the retry orchestration, not the validator implementation
 * (which belongs to Row 2's test suite).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateAndRetry } from '#/lib/ai/validate-and-retry'
import type { Diagnostic, ValidatorRegistry } from '#/lib/validator'

import { validate } from '#/lib/validator'

// ── Mock the validator module ────────────────────────────────────────────────
// We control what `validate()` returns per test so we can exercise all paths
// without needing a real Row 2 implementation.
vi.mock('#/lib/validator', () => {
  return {
    validate: vi.fn(() => [] as Diagnostic[]),
  }
})
const mockValidate = vi.mocked(validate)

// ── Helpers ──────────────────────────────────────────────────────────────────

const noopRegistry: ValidatorRegistry = {
  getFunctionMeta: () => undefined,
}

const cleanSnapshot = { sources: [], styles: [] }
const dirtySnapshot = { sources: [{ id: 'bad' }], styles: [] }

const colorError: Diagnostic = {
  code: 'COLOR_LITERAL_IN_PAINT',
  severity: 'error',
  path: 'styles[0].paint.fill-color',
  message: 'Literal color "#ff0000" found in fill-color',
}

const deadParamWarning: Diagnostic = {
  code: 'DEAD_PARAM',
  severity: 'warn',
  path: 'params_config[2]',
  message: 'param "unused_color" is never referenced',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('validateAndRetry', () => {
  beforeEach(() => {
    mockValidate.mockReset()
  })

  it('Test 1: clean snapshot → no retry, no validation_failed', async () => {
    // validate returns empty on every call
    mockValidate.mockReturnValue([])

    const retryFn = vi.fn()
    const result = await validateAndRetry(cleanSnapshot, retryFn, noopRegistry)

    expect(retryFn).not.toHaveBeenCalled()
    expect(result.validation_failed).toBeUndefined()
    expect(result.diagnostics).toBeUndefined()
    expect(result.snapshot).toBe(cleanSnapshot)
    // validate was called exactly once
    expect(mockValidate).toHaveBeenCalledTimes(1)
  })

  it('Test 2: first attempt has COLOR_LITERAL error → retry fires with diagnostic text → second is clean → no validation_failed', async () => {
    // First call: error. Second call: clean.
    mockValidate.mockReturnValueOnce([colorError]).mockReturnValueOnce([])

    const retryFn = vi.fn().mockResolvedValue(cleanSnapshot)
    const result = await validateAndRetry(dirtySnapshot, retryFn, noopRegistry)

    // Retry was called once
    expect(retryFn).toHaveBeenCalledTimes(1)

    // The retry message should inline the diagnostic
    const retryMessage: string = retryFn.mock.calls[0][0]
    expect(retryMessage).toContain('Validation failed:')
    expect(retryMessage).toContain('COLOR_LITERAL_IN_PAINT')
    expect(retryMessage).toContain(colorError.message)
    expect(retryMessage).toContain(colorError.path)
    expect(retryMessage).toContain(
      'Fix every issue above and re-emit the entire snapshot',
    )

    // No validation_failed since second attempt is clean
    expect(result.validation_failed).toBeUndefined()
    // No diagnostics when second is fully clean
    expect(result.diagnostics).toBeUndefined()
    expect(result.snapshot).toBe(cleanSnapshot)
  })

  it('Test 3: both attempts have errors → validation_failed: true + diagnostics populated', async () => {
    // Both calls return an error
    const secondError: Diagnostic = {
      code: 'COLOR_LITERAL_IN_PAINT',
      severity: 'error',
      path: 'styles[0].paint.circle-color',
      message: 'Literal color "#0000ff" found in circle-color',
    }
    mockValidate
      .mockReturnValueOnce([colorError])
      .mockReturnValueOnce([secondError])

    const retryFn = vi.fn().mockResolvedValue(dirtySnapshot)
    const result = await validateAndRetry(dirtySnapshot, retryFn, noopRegistry)

    // Retry was called once (not twice — budget is 1)
    expect(retryFn).toHaveBeenCalledTimes(1)

    expect(result.validation_failed).toBe(true)
    expect(result.diagnostics).toBeDefined()
    expect(result.diagnostics).toEqual([secondError])
    expect(result.snapshot).toBe(dirtySnapshot)
  })

  it('Test 4: clean snapshot with DEAD_PARAM warning → no retry, diagnostics populated, validation_failed absent', async () => {
    mockValidate.mockReturnValue([deadParamWarning])

    const retryFn = vi.fn()
    const result = await validateAndRetry(cleanSnapshot, retryFn, noopRegistry)

    // No retry for warnings
    expect(retryFn).not.toHaveBeenCalled()
    expect(result.validation_failed).toBeUndefined()
    expect(result.diagnostics).toEqual([deadParamWarning])
    expect(result.snapshot).toBe(cleanSnapshot)
    // validate called once
    expect(mockValidate).toHaveBeenCalledTimes(1)
  })

  it('only one retry fires even when first attempt has multiple errors', async () => {
    const anotherError: Diagnostic = {
      code: 'MISSING_LEGEND_CONFIG',
      severity: 'error',
      path: 'sources[0]',
      message: 'source has no legend_config',
    }
    // Both calls return errors
    mockValidate
      .mockReturnValueOnce([colorError, anotherError])
      .mockReturnValueOnce([colorError])

    const retryFn = vi.fn().mockResolvedValue(dirtySnapshot)
    await validateAndRetry(dirtySnapshot, retryFn, noopRegistry)

    // Exactly 1 retry, not 2
    expect(retryFn).toHaveBeenCalledTimes(1)
    // validate called twice total (once per attempt)
    expect(mockValidate).toHaveBeenCalledTimes(2)
  })

  it('retry message lists all error-severity diagnostics, not warnings', async () => {
    // First call: one error + one warning
    mockValidate
      .mockReturnValueOnce([colorError, deadParamWarning])
      .mockReturnValueOnce([])

    const retryFn = vi.fn().mockResolvedValue(cleanSnapshot)
    await validateAndRetry(dirtySnapshot, retryFn, noopRegistry)

    const retryMessage: string = retryFn.mock.calls[0][0]
    // Error is included
    expect(retryMessage).toContain('COLOR_LITERAL_IN_PAINT')
    // Warning is NOT included in the retry message (only errors should be there)
    expect(retryMessage).not.toContain('DEAD_PARAM')
  })
})
