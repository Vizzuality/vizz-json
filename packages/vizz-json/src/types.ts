export type KeyHandler = {
  readonly name: string
  readonly type: 'key'
  readonly key: string
  readonly resolve: (
    value: string,
    props: Record<string, unknown>,
    config: ResolverConfig,
  ) => unknown
}

export type ValueHandler = {
  readonly name: string
  readonly type: 'value'
  readonly test: (value: string) => boolean
  readonly resolve: (value: string, config: ResolverConfig) => unknown
}

export type Handler = KeyHandler | ValueHandler

/**
 * Configuration for a VizzJson resolver.
 *
 * @security All entries in `functions`, `classes`, and `components` are invoked
 * with caller-controlled props derived from the resolved JSON. Never register
 * callables that perform sensitive operations (network requests, file I/O, writes
 * to shared state) without validating their props internally. Do not expose this
 * resolver to untrusted JSON without reviewing every registered entry.
 */
export type ResolverConfig = {
  readonly classes?: Record<string, new (props: any) => any>
  readonly components?: Record<string, (props: any) => any>
  readonly functions?: Record<string, (props: any) => unknown>
  readonly enumerations?: Record<string, Record<string, unknown>>
}

export type VizzJson = {
  readonly resolve: (json: Record<string, unknown>) => Record<string, unknown>
}
