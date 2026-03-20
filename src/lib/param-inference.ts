import type { ParamConfig, InferredParam, ParamControlType } from './types'

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

function inferControlType(param: ParamConfig): ParamControlType {
  if (param.options && param.options.length > 0) {
    return 'select'
  }
  const value = param.default
  if (typeof value === 'boolean') return 'switch'
  if (typeof value === 'number') return 'slider'
  if (typeof value === 'string' && HEX_COLOR_REGEX.test(value))
    return 'color_picker'
  if (typeof value === 'string') return 'text_input'
  if (typeof value === 'object' && value !== null) return 'json_editor'
  return 'text_input'
}

export function inferParamControl(param: ParamConfig): InferredParam {
  return {
    key: param.key,
    value: param.default,
    control_type: inferControlType(param),
    min: param.min,
    max: param.max,
    step: param.step,
    options: param.options,
    group: param.group,
  }
}
