/**
 * Named CSS color keywords accepted as valid colors.
 * Kept intentionally narrow — full CSS named color list is 140+ entries.
 * Extend as needed, but prefer hex/functional notations in configs.
 */
const NAMED_COLOR_KEYWORDS = new Set([
  'transparent',
  'currentcolor',
  'black',
  'white',
  'red',
  'green',
  'blue',
  'gray',
  'grey',
  'none',
])

/**
 * Regex patterns for CSS functional color notations.
 * Matches the function name prefix — arguments are not validated (intentionally
 * loose: configs use valid values; we only need to reject @@-prefixed strings).
 */
const FUNCTIONAL_COLOR_RE = /^(rgba?|hsla?|oklch|oklab|lab|lch|color)\s*\(/i

/** Hex color: #rgb #rrggbb #rgba #rrggbbaa */
const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * Returns true when `value` is a string that represents a CSS color.
 * Strings starting with `@@` are always rejected.
 */
export function isValidCssColor(value: unknown): boolean {
  if (typeof value !== 'string') return false
  if (value === '') return false
  if (value.startsWith('@@')) return false

  if (HEX_COLOR_RE.test(value)) return true
  if (FUNCTIONAL_COLOR_RE.test(value)) return true
  if (NAMED_COLOR_KEYWORDS.has(value.toLowerCase())) return true

  return false
}

/**
 * Resolves a legend item's color to a safe CSS string.
 *
 * Resolution order:
 * 1. If `mapping.valueParamKey` is set and `values[key]` is a string → use it
 *    (but still reject if it is itself a `@@` ref).
 * 2. Else if `item.value` is a valid CSS color string → use it.
 * 3. Otherwise → return `'transparent'`.
 *
 * NEVER returns a raw `@@#params.X` string.
 */
/**
 * Structural type matching ItemParamMapping (avoids circular import from
 * legend-param-mapping which imports from types.ts which is already stable).
 */
type MappingShape = {
  readonly valueParamKey?: string
  readonly labelParamKey?: string
}

export function resolveItemColor(
  item: { readonly value: string | number },
  mapping: MappingShape | undefined,
  values: Record<string, unknown> | undefined,
): string {
  if (mapping?.valueParamKey && values !== undefined) {
    const resolved = values[mapping.valueParamKey]
    if (typeof resolved === 'string' && isValidCssColor(resolved)) {
      return resolved
    }
    // If valueParamKey is present but resolved value is not a valid CSS color,
    // fall through to item.value check (covers missing key case).
  }

  if (isValidCssColor(item.value)) {
    return item.value as string
  }

  return 'transparent'
}
