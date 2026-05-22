/**
 * Pure helper for the color-binding validator gate with 1 retry.
 *
 * Extracted from the ai-generate route so it can be unit-tested without
 * spinning up TanStack Start server infrastructure.
 *
 * The route calls this after all existing JSON/schema/style-spec validation
 * has passed. If the color-binding validator finds error-severity diagnostics,
 * this function asks the caller to retry (via `retryFn`). If the retry also
 * has errors, the final result carries `validation_failed: true`.
 */
import type { Diagnostic, ValidatorRegistry } from '#/lib/validator'
import { validate } from '#/lib/validator'

export type ValidateAndRetryResult = {
  /** The final snapshot (from the successful or failed second attempt). */
  readonly snapshot: unknown
  /** All diagnostics (errors + warnings) from the final attempt, if any. */
  readonly diagnostics?: readonly Diagnostic[]
  /** true only when the second attempt still has error-severity diagnostics. */
  readonly validation_failed?: true
}

/**
 * Run `validate()` on `snapshot`. On the first error-severity hit, call
 * `retryFn` with the retry user-message and return the result of
 * `validate()` on the new snapshot. On the second error-severity hit, set
 * `validation_failed: true`. Warnings never trigger a retry.
 *
 * @param snapshot  The snapshot from the first model attempt.
 * @param retryFn   Async function that re-invokes the model with a given
 *                  retry message and returns the new snapshot.
 * @param registry  Function-metadata registry (`{ getFunctionMeta }`).
 */
export async function validateAndRetry(
  snapshot: unknown,
  retryFn: (retryMessage: string) => Promise<unknown>,
  registry: ValidatorRegistry,
): Promise<ValidateAndRetryResult> {
  const firstDiagnostics = validate(snapshot, registry)
  const firstErrors = firstDiagnostics.filter((d) => d.severity === 'error')

  if (firstErrors.length === 0) {
    // Clean on first attempt — return, attaching any warnings.
    return firstDiagnostics.length > 0
      ? { snapshot, diagnostics: firstDiagnostics }
      : { snapshot }
  }

  // First attempt has errors — build retry message and re-invoke.
  const lines = firstErrors
    .map((d) => `- ${d.code}: ${d.message} at ${d.path}`)
    .join('\n')
  const retryMessage = `Validation failed:\n${lines}\n\nFix every issue above and re-emit the entire snapshot. Do not include partial output or commentary.`

  const secondSnapshot = await retryFn(retryMessage)
  const secondDiagnostics = validate(secondSnapshot, registry)
  const secondErrors = secondDiagnostics.filter((d) => d.severity === 'error')

  const result: ValidateAndRetryResult = { snapshot: secondSnapshot }
  if (secondDiagnostics.length > 0) {
    ;(result as Record<string, unknown>).diagnostics = secondDiagnostics
  }
  if (secondErrors.length > 0) {
    ;(result as Record<string, unknown>).validation_failed = true
  }
  return result
}
