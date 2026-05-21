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
            { label: '', value: '@@#params.heatmap_bg' },
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
            { label: 'Stroke', value: '@@#params.circles_stroke_color' },
          ],
        },
      },
    ],
    styles: [
      {
        source: 'earthquakes_heatmap',
        type: 'heatmap',
        maxzoom: 9,
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
            '@@#params.heatmap_bg',
            0.2,
            '@@#params.heatmap_low',
            1.0,
            '@@#params.heatmap_high',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 6, 9, 30],
          'heatmap-opacity': '@@#params.earthquakes_heatmap_opacity',
        },
        layout: {
          visibility: '@@#params.earthquakes_heatmap_visibility',
        },
      },
      {
        source: 'earthquakes_circles',
        type: 'circle',
        minzoom: 6,
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
          'circle-stroke-color': '@@#params.circles_stroke_color',
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6,
            0,
            8,
            0.5,
          ],
          'circle-opacity': '@@#params.earthquakes_circles_opacity',
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
        layout: {
          visibility: '@@#params.earthquakes_circles_visibility',
        },
      },
    ],
  },
  params_config: [
    { key: 'heatmap_bg', default: 'rgba(0,0,0,0)', group: 'legend' },
    { key: 'heatmap_low', default: '#2c7bb6', group: 'legend' },
    { key: 'heatmap_high', default: '#d7191c', group: 'legend' },
    {
      key: 'earthquakes_heatmap_opacity',
      source: 'earthquakes_heatmap',
      default: 0.9,
      min: 0,
      max: 1,
      step: 0.05,
    },
    {
      key: 'earthquakes_heatmap_visibility',
      source: 'earthquakes_heatmap',
      default: 'visible',
      options: ['visible', 'none'],
    },
    { key: 'circle_color_low', default: '#fee08b', group: 'legend' },
    { key: 'circle_color_high', default: '#7a0177', group: 'legend' },
    { key: 'circles_stroke_color', default: '#ffffff', group: 'legend' },
    {
      key: 'earthquakes_circles_opacity',
      source: 'earthquakes_circles',
      default: 0.85,
      min: 0,
      max: 1,
      step: 0.05,
    },
    {
      key: 'earthquakes_circles_visibility',
      source: 'earthquakes_circles',
      default: 'visible',
      options: ['visible', 'none'],
    },
  ],
} satisfies ExampleConfig

export default config
