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
export {
  generateAmbientSplat,
  generateAmbientArc,
  nextAmbientDelay,
} from './ambient-splats'

export { DEFAULT_FLUID_CONFIG } from './types'
export { DEFAULT_AMBIENT_CONFIG } from './ambient-splats'
export type { FluidConfig, SplatInput, SimulationState } from './types'
export type { AmbientSplatConfig } from './ambient-splats'
