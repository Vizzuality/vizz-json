type schema = {
  "config": {
    "source": {
      // mapbox / maplibre source spec
    },
    "styles": [
      // mapbox / maplibre layers
    ]
  },
  "params_config": [
      {
        key: string,
        default: unknown
      }
  ],
  "legend_config": {
    "type": "basic" | "choropleth" | "gradient",
    "items": [{
      label: string,
      value: string | number,
    }]
  }
}