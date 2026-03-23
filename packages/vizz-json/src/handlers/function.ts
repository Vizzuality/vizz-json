import type { KeyHandler, ResolverConfig } from '../index'

export const functionHandler: KeyHandler = {
  name: 'function',
  type: 'key',
  key: '@@function',
  resolve(
    fnName: string,
    props: Record<string, unknown>,
    config: ResolverConfig,
  ): unknown {
    const fn = config.functions?.[fnName]
    if (!fn) {
      throw new Error(
        `[vizz-json] Unknown function: "${fnName}". Register it in functions.`,
      )
    }
    return fn(props as never)
  },
}
