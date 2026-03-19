type SetQueryParamsProps = {
  readonly url: string;
  readonly query: Readonly<Record<string, unknown>>;
};

type IfParamProps = {
  readonly condition: unknown;
  readonly then: unknown;
  readonly else: unknown;
};

function setQueryParams({ url, query }: SetQueryParamsProps): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const serialized =
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : String(value);
    params.set(key, serialized);
  }
  return `${url}?${params.toString()}`;
}

function ifParam({ condition, then: thenValue, else: elseValue }: IfParamProps): unknown {
  return condition ? thenValue : elseValue;
}

export const registeredFunctions: Readonly<Record<string, (props: never) => unknown>> = {
  setQueryParams,
  ifParam,
};
