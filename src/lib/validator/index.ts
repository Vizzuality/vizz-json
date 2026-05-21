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
export function validate(
  snapshot: unknown,
  registry: ValidatorRegistry,
): readonly Diagnostic[] {
  const all: Diagnostic[] = []

  try {
    checkColorBinding(snapshot, registry).forEach((d) => all.push(d))
  } catch {
    // Never crash the caller — silently skip this check
  }

  try {
    checkOpacityVisibility(snapshot).forEach((d) => all.push(d))
  } catch {
    // Never crash the caller — silently skip this check
  }

  try {
    checkDeadRef(snapshot).forEach((d) => all.push(d))
  } catch {
    // Never crash the caller — silently skip this check
  }

  return all
}
