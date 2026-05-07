import type { ExampleConfig } from '#/lib/types'

const config = {
  metadata: {
    title: 'Expression — step',
    description:
      'Earthquake data colored by magnitude using step expression with parameterized breaks',
    tier: 'intermediate',
  },
  config: {
    sources: [
      {
        id: 'earthquakes',
        type: 'geojson',
        data: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson',
      },
    ],
    styles: [
      {
        source: 'earthquakes',
        type: 'circle',
        paint: {
          'circle-color': [
            'step',
            ['get', 'mag'],
            '@@#params.color1',
            '@@#params.break1',
            '@@#params.color2',
            '@@#params.break2',
            '@@#params.color3',
          ],
          'circle-radius': 4,
          'circle-opacity': '@@#params.opacity',
        },
        layout: {
          visibility: '@@#params.visibility',
        },
      },
    ],
  },
  params_config: [
    { key: 'color1', default: '#22c55e', group: 'legend' },
    { key: 'color2', default: '#eab308', group: 'legend' },
    { key: 'color3', default: '#ef4444', group: 'legend' },
    {
      key: 'break1',
      default: 3,
      min: 0,
      max: 10,
      step: 0.5,
      group: 'legend',
    },
    {
      key: 'break2',
      default: 5,
      min: 0,
      max: 10,
      step: 0.5,
      group: 'legend',
    },
    { key: 'opacity', default: 0.8, min: 0, max: 1, step: 0.05 },
    {
      key: 'visibility',
      default: 'visible',
      options: ['visible', 'none'],
    },
  ],
  legend_config: {
    type: 'choropleth',
    items: [
      { label: 'Low (< 3)', value: '@@#params.color1' },
      { label: 'Moderate (3–5)', value: '@@#params.color2' },
      { label: 'High (> 5)', value: '@@#params.color3' },
    ],
  },
} satisfies ExampleConfig

export default config
