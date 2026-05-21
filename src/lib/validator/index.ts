import type { Diagnostic, ValidatorRegistry } from './types'
import { checkColorBinding } from './checks/color-binding'
import { checkOpacityVisibility } from './checks/opacity-visibility'
import { checkDeadRef } from './checks/dead-ref'

export type {
  Diagnostic,
  DiagnosticCode,
  Severity,
  ValidatorRegistry,
} from './types'

/**
 * Validate a parsed VizzJson snapshot against the bidirectional color-binding
 * + per-source opacity/visibility + dead/ghost-ref rules.
 *
 * Pure function: no mutation, no I/O, no DOM, no React.
 *
 * @param snapshot Parsed JSON object matching LayerSchema (or as-parsed if
 *                 author wrote invalid JSON; the validator should not crash
 *                 on missing fields — it should emit appropriate diagnostics).
 * @param registry Adapter for function metadata lookup. In production pass
 *                 `{ getFunctionMeta }` from `src/lib/converter`. In tests
 *                 pass a stub.
 */
function runCheck(
  name: string,
  fn: () => readonly Diagnostic[],
  sink: Diagnostic[],
): void {
  try {
    fn().forEach((d) => sink.push(d))
  } catch (err) {
    // Production: never crash the caller. Dev: surface the bug so a logic
    // error inside a check doesn't get silently swallowed.
    if (import.meta.env.DEV) {
      throw err
    }
    console.error(`[validator] check "${name}" threw and was skipped:`, err)
  }
}

export function validate(
  snapshot: unknown,
  registry: ValidatorRegistry,
): readonly Diagnostic[] {
  const all: Diagnostic[] = []
  runCheck('color-binding', () => checkColorBinding(snapshot, registry), all)
  runCheck('opacity-visibility', () => checkOpacityVisibility(snapshot), all)
  runCheck('dead-ref', () => checkDeadRef(snapshot), all)
  return all
}
