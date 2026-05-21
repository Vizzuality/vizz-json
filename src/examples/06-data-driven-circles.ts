import type { ExampleConfig } from '#/lib/types'

const config = {
  metadata: {
    title: 'Multi-Layer — Zoom Crossfade',
    description:
      'Heatmap at low zoom crossfades to magnitude-scaled circles — two styles share one source',
    tier: 'intermediate',
  },
  config: {
    sources: [
      {
        id: 'earthquakes',
        type: 'geojson',
        data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson',
        legend_config: {
          type: 'gradient',
          items: [
            { label: '', value: '@@#params.color_bg' },
            { label: 'Low', value: '@@#params.color_low' },
            { label: '', value: '@@#params.color_mid1' },
            { label: '', value: '@@#params.color_mid2' },
            { label: '', value: '@@#params.color_mid3' },
            { label: 'High', value: '@@#params.color_high' },
          ],
        },
      },
    ],
    styles: [
      {
        source: 'earthquakes',
        type: 'heatmap',
        maxzoom: 8,
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
            '@@#params.color_bg',
            0.2,
            '@@#params.color_low',
            0.4,
            '@@#params.color_mid1',
            0.6,
            '@@#params.color_mid2',
            0.8,
            '@@#params.color_mid3',
            1.0,
            '@@#params.color_high',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
          'heatmap-opacity': '@@#params.opacity',
        },
        layout: {
          visibility: '@@#params.visibility',
        },
      },
      {
        source: 'earthquakes',
        type: 'circle',
        minzoom: 5,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            1,
            ['*', 2, '@@#params.circle_scale'],
            3,
            ['*', 4, '@@#params.circle_scale'],
            5,
            ['*', 8, '@@#params.circle_scale'],
            7,
            ['*', 14, '@@#params.circle_scale'],
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            1,
            '@@#params.color_low',
            3,
            '@@#params.color_mid1',
            5,
            '@@#params.color_mid3',
            7,
            '@@#params.color_high',
          ],
          'circle-opacity': '@@#params.opacity',
        },
        layout: {
          visibility: '@@#params.visibility',
        },
      },
    ],
  },
  params_config: [
    {
      key: 'color_bg',
      default: 'rgba(0,0,0,0)',
      group: 'legend' as const,
    },
    {
      key: 'color_low',
      default: '#2c7bb6',
      group: 'legend' as const,
    },
    {
      key: 'color_mid1',
      default: '#abd9e9',
      group: 'legend' as const,
    },
    {
      key: 'color_mid2',
      default: '#ffffbf',
      group: 'legend' as const,
    },
    {
      key: 'color_mid3',
      default: '#fdae61',
      group: 'legend' as const,
    },
    {
      key: 'color_high',
      default: '#d7191c',
      group: 'legend' as const,
    },
    {
      key: 'circle_scale',
      default: 1,
      min: 0.5,
      max: 3,
      step: 0.1,
    },
    {
      key: 'opacity',
      default: 0.8,
      min: 0,
      max: 1,
      step: 0.05,
    },
    {
      key: 'visibility',
      default: 'visible',
      options: ['visible', 'none'],
    },
  ],
} satisfies ExampleConfig

export default config
