import type { ExampleConfig } from '#/lib/types'

const config = {
  metadata: {
    title: '@@type — Component Composition',
    description:
      'Compose a dashboard section from registered React components using @@type',
    tier: 'advanced',
    preview: 'components',
  },
  components: [
    {
      '@@type': 'InfoPanel',
      title: '@@#params.panel_title',
      description: '@@#params.panel_description',
    },
    {
      '@@type': 'StatCard',
      label: '@@#params.stat_label',
      value: '@@#params.stat_value',
      unit: '@@#params.stat_unit',
      color: '@@#params.accent_color',
    },
    {
      '@@type': 'GradientLegend',
      items: [
        { label: 'Low', value: '@@#params.color_1' },
        { label: 'Mid', value: '@@#params.color_2' },
        { label: 'High', value: '@@#params.color_3' },
      ],
    },
  ],
  params_config: [
    { key: 'panel_title', default: 'Population Overview' },
    {
      key: 'panel_description',
      default:
        'Global population distribution by density, showing gradient classification across regions.',
    },
    { key: 'stat_label', default: 'World Population' },
    { key: 'stat_value', default: '8.1B' },
    { key: 'stat_unit', default: 'people' },
    { key: 'accent_color', default: '#3b82f6' },
    { key: 'color_1', default: '#eff6ff' },
    { key: 'color_2', default: '#3b82f6' },
    { key: 'color_3', default: '#1e3a8a' },
  ],
} satisfies ExampleConfig

export default config
