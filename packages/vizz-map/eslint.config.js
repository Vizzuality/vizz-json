import rootConfig from '../../eslint.config.js'

export default rootConfig
  .filter((c) => !c.ignores?.includes('packages/**'))
  .concat({
    ignores: ['eslint.config.js', 'vitest.config.ts', 'tsup.config.ts'],
  })
