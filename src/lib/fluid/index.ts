export {
  createSimulation,
  stepSimulation,
  renderDisplay,
  addSplat,
  resizeSimulation,
  destroySimulation,
} from './simulation'

export { shouldDisableSimulation } from './device'
export { speedToSplatColor } from './color'

export { DEFAULT_FLUID_CONFIG } from './types'
export type { FluidConfig, SplatInput, SimulationState } from './types'
