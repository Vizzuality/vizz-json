import { createElement, type ComponentType, type ReactNode } from 'react'
import { isComponentDescriptor } from './handlers/type'

/**
 * Recursively renders resolved super-json output.
 * Finds `$$component` descriptors and renders them via React.createElement.
 * Non-descriptor values are returned as-is (strings, numbers, null).
 */
export function Render({ value }: { readonly value: unknown }): ReactNode {
  if (value === null || value === undefined) {
    return null
  }

  if (isComponentDescriptor(value)) {
    const Component = value.$$component as ComponentType<Record<string, unknown>>
    const resolvedProps: Record<string, ReactNode> = {}

    for (const [k, v] of Object.entries(value.props)) {
      resolvedProps[k] = isComponentDescriptor(v)
        ? createElement(Render, { value: v })
        : (v as ReactNode)
    }

    return createElement(Component, resolvedProps)
  }

  if (Array.isArray(value)) {
    return value.map((item, i) =>
      isComponentDescriptor(item) ? createElement(Render, { key: i, value: item }) : item,
    ) as ReactNode
  }

  // Primitives (string, number, boolean) — return as-is for React to render
  if (typeof value !== 'object') {
    return value as ReactNode
  }

  return null
}
