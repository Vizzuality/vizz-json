import type { Diagnostic } from '../types'

const PARAM_REF_RE = /@@#params\.([A-Za-z0-9_.-]+)/g

/**
 * Collect all @@#params.X keys referenced as string values anywhere in the snapshot.
 * Walks all strings recursively through objects and arrays.
 */
function collectAllRefs(node: unknown): Set<string> {
  const refs = new Set<string>()

  function visit(val: unknown): void {
    if (typeof val === 'string') {
      let m: RegExpExecArray | null
      const re = new RegExp(PARAM_REF_RE.source, 'g')
      while ((m = re.exec(val)) !== null) {
        refs.add(m[1])
      }
    } else if (Array.isArray(val)) {
      for (const item of val) visit(item)
    } else if (val !== null && typeof val === 'object') {
      for (const v of Object.values(val as Record<string, unknown>)) {
        visit(v)
      }
    }
  }

  visit(node)
  return refs
}

export function checkDeadRef(snapshot: unknown): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  if (!snapshot || typeof snapshot !== 'object') return diagnostics

  const snap = snapshot as Record<string, unknown>
  const paramsConfig = snap.params_config
  if (!Array.isArray(paramsConfig)) return diagnostics

  const allParams = paramsConfig as readonly { key: string }[]

  // Walk the entire snapshot (including legend_config and styles)
  const allRefs = collectAllRefs(snap)

  // DEAD_PARAM: param key never referenced anywhere
  const paramKeys = new Set(allParams.map((p) => p.key))
  for (let i = 0; i < allParams.length; i++) {
    const param = allParams[i]
    if (!allRefs.has(param.key)) {
      diagnostics.push({
        code: 'DEAD_PARAM',
        severity: 'warn',
        path: `params_config[${i}]`,
        message: `Param "${param.key}" is defined but never referenced as @@#params.${param.key}.`,
        meta: { key: param.key },
      })
    }
  }

  // GHOST_REF: ref in snapshot that has no matching params_config entry
  for (const ref of allRefs) {
    if (!paramKeys.has(ref)) {
      diagnostics.push({
        code: 'GHOST_REF',
        severity: 'error',
        path: 'config',
        message: `Ref "@@#params.${ref}" has no matching entry in params_config.`,
        meta: { key: ref },
      })
    }
  }

  return diagnostics
}
