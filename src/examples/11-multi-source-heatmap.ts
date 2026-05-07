import type { ExampleConfig } from '#/lib/types'

const config = {
  metadata: {
    title: 'Multi-Source — Heatmap + Polygons',
    description:
      'Two GeoJSON sources rendered together: a polygon fill from country boundaries plus a heatmap of capital city centroids.',
    tier: 'advanced',
  },
  config: {
    sources: [
      {
        id: 'countries',
        type: 'geojson',
        data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson',
      },
      {
        id: 'capitals',
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_populated_places_simple.geojson',
      },
    ],
    styles: [
      {
        source: 'countries',
        type: 'fill',
        paint: {
          'fill-color': '@@#params.fill_color',
          'fill-opacity': '@@#params.fill_opacity',
          'fill-outline-color': '#ffffff',
        },
      },
      {
        source: 'capitals',
        type: 'heatmap',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'pop_max'],
            0,
            0,
            20000000,
            1,
          ],
          'heatmap-intensity': 1.2,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,0,0)',
            0.2,
            '@@#params.heatmap_color_low',
            0.6,
            '@@#params.heatmap_color_mid',
            1.0,
            '@@#params.heatmap_color_high',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 8, 6, 30],
          'heatmap-opacity': '@@#params.heatmap_opacity',
        },
      },
    ],
  },
  params_config: [
    { key: 'fill_color', default: '#dbeafe', group: 'legend' },
    {
      key: 'fill_opacity',
      default: 0.6,
      min: 0,
      max: 1,
      step: 0.05,
    },
    { key: 'heatmap_color_low', default: '#2c7bb6', group: 'legend' },
    { key: 'heatmap_color_mid', default: '#fdae61', group: 'legend' },
    { key: 'heatmap_color_high', default: '#d7191c', group: 'legend' },
    {
      key: 'heatmap_opacity',
      default: 0.85,
      min: 0,
      max: 1,
      step: 0.05,
    },
  ],
  legend_config: {
    type: 'gradient',
    items: [
      { label: 'Country fill', value: '@@#params.fill_color' },
      { label: 'Heatmap low', value: '@@#params.heatmap_color_low' },
      { label: 'Heatmap high', value: '@@#params.heatmap_color_high' },
    ],
  },
} satisfies ExampleConfig

export default config
