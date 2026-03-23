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

export type ResolverConfig = {
  readonly classes?: Record<string, new (props: any) => any>
  readonly components?: Record<string, (props: any) => any>
  readonly functions?: Record<string, (props: any) => unknown>
  readonly enumerations?: Record<string, Record<string, unknown>>
}

export type VizzJson = {
  readonly resolve: (json: Record<string, unknown>) => Record<string, unknown>
}
