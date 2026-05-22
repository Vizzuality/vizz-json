export type Severity = 'error' | 'warn'

export type DiagnosticCode =
  | 'COLOR_LITERAL_IN_PAINT'
  | 'COLOR_LITERAL_IN_LEGEND'
  | 'LEGEND_LAYER_MISMATCH'
  | 'MISSING_LEGEND_CONFIG'
  | 'MISSING_OPACITY_PARAM'
  | 'MISSING_VISIBILITY_PARAM'
  | 'OPACITY_NOT_WIRED'
  | 'VISIBILITY_NOT_WIRED'
  | 'DEAD_PARAM'
  | 'GHOST_REF'

export type Diagnostic = {
  readonly code: DiagnosticCode
  readonly severity: Severity
  /** JSON path string into the snapshot, e.g. "sources[0].styles[0].paint.fill-color[2]" */
  readonly path: string
  /** Human-readable explanation */
  readonly message: string
  /** Optional structured payload (e.g. the offending literal, the orphan param key) */
  readonly meta?: Record<string, unknown>
}

export type ValidatorRegistry = {
  /** Look up a function's metadata; mirrors `getFunctionMeta` from src/lib/converter. */
  getFunctionMeta: (
    name: string,
  ) => { colorArgPaths?: readonly string[] } | undefined
}
