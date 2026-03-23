import type { ValueHandler } from '../index'
import { getNestedValue } from '../resolver'

const EXPRESSION_PREFIX = '@@='

export const expressionHandler: ValueHandler = {
  name: 'expression',
  type: 'value',
  test(value: string): boolean {
    return value.startsWith(EXPRESSION_PREFIX)
  },
  resolve(value: string): unknown {
    const path = value.slice(EXPRESSION_PREFIX.length)

    // Return an accessor function: (datum) => datum.path.to.property
    return (d: Record<string, unknown>) => getNestedValue(d, path)
  },
}
