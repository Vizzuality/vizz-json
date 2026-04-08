import { interpolateColormap, type ColormapStop } from '#/lib/colormap'

type SetQueryParamsProps = {
  readonly url: string
  readonly query: Readonly<Record<string, unknown>>
}

type IfParamProps = {
  readonly condition: unknown
  readonly then: unknown
  readonly else: unknown
}

type BuildColormapProps = {
  readonly stops: readonly ColormapStop[]
}

function setQueryParams({ url, query }: SetQueryParamsProps): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    const serialized =
      typeof value === 'object' && value !== null
        ? JSON.stringify(value)
        : String(value)
    params.set(key, serialized)
  }
  return `${url}?${params.toString()}`
}

function ifParam({
  condition,
  then: thenValue,
  else: elseValue,
}: IfParamProps): unknown {
  return condition ? thenValue : elseValue
}

function buildColormap({ stops }: BuildColormapProps): unknown {
  return interpolateColormap(stops)
}

export const registeredFunctions: Readonly<
  Record<string, (props: any) => unknown>
> = {
  setQueryParams,
  ifParam,
  buildColormap,
}
