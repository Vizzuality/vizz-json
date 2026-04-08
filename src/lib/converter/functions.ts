import type { ColormapStop } from '#/lib/colormap'
import { interpolateColormap } from '#/lib/colormap'

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
  const intervals = interpolateColormap(stops)
  if (intervals.length === 0) return intervals

  const first = intervals[0]
  const last = intervals[intervals.length - 1]

  return [
    [[-1e10, first[0][1]], first[1]],
    ...intervals.slice(1, -1),
    [[last[0][0], 1e10], last[1]],
  ]
}

export const registeredFunctions: Readonly<
  Record<string, (props: any) => unknown>
> = {
  setQueryParams,
  ifParam,
  buildColormap,
}
