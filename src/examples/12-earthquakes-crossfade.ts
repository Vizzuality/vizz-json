import type { ExampleConfig } from '#/lib/types'

const EARTHQUAKES_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson'

const config = {
  metadata: {
    title: 'Earthquakes — Heatmap → Circles Crossfade',
    description:
      'USGS month feed rendered as a heatmap at low zoom that crossfades into individual magnitude-coloured circles at high zoom. Same data on two duplicated sources so each style carries its own legend.',
    tier: 'advanced',
  },
  config: {
    sources: [
      {
        id: 'earthquakes_heatmap',
        type: 'geojson',
        data: EARTHQUAKES_URL,
        legend_config: {
          type: 'gradient',
          items: [
            { label: 'Sparse', value: '@@#params.heatmap_low' },
            { label: 'Dense', value: '@@#params.heatmap_high' },
          ],
        },
      },
      {
        id: 'earthquakes_circles',
        type: 'geojson',
        data: EARTHQUAKES_URL,
        legend_config: {
          type: 'gradient',
          items: [
            { label: 'Mag 2', value: '@@#params.circle_color_low' },
            { label: 'Mag 7', value: '@@#params.circle_color_high' },
          ],
        },
      },
    ],
    styles: [
      {
        source: 'earthquakes_heatmap',
        type: 'heatmap',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            0,
            0,
            6,
            1,
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            1,
            9,
            3,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,0,0)',
            0.2,
            '@@#params.heatmap_low',
            1.0,
            '@@#params.heatmap_high',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 6, 9, 30],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6,
            '@@#params.heatmap_opacity',
            8,
            0,
          ],
        },
      },
      {
        source: 'earthquakes_circles',
        type: 'circle',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            2,
            2,
            7,
            12,
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            2,
            '@@#params.circle_color_low',
            7,
            '@@#params.circle_color_high',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6,
            0,
            8,
            0.5,
          ],
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6,
            0,
            8,
            '@@#params.circle_opacity',
          ],
          'circle-stroke-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6,
            0,
            8,
            1,
          ],
        },
      },
    ],
  },
  params_config: [
    { key: 'heatmap_low', default: '#2c7bb6', group: 'legend' },
    { key: 'heatmap_high', default: '#d7191c', group: 'legend' },
    {
      key: 'heatmap_opacity',
      default: 0.9,
      min: 0,
      max: 1,
      step: 0.05,
    },
    { key: 'circle_color_low', default: '#fee08b', group: 'legend' },
    { key: 'circle_color_high', default: '#7a0177', group: 'legend' },
    {
      key: 'circle_opacity',
      default: 0.85,
      min: 0,
      max: 1,
      step: 0.05,
    },
  ],
} satisfies ExampleConfig

export default config
