import { Map, useControl } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { MapboxOverlayProps } from "@deck.gl/mapbox";
import "maplibre-gl/dist/maplibre-gl.css";

const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const INITIAL_VIEW = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
};

function DeckGlOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay({ ...props, interleaved: true }));
  overlay.setProps({ ...props, interleaved: true });
  return null;
}

type MapRendererProps = {
  readonly resolvedConfig: Record<string, unknown> | null;
  readonly error: string | null;
};

export function MapRenderer({ resolvedConfig, error }: MapRendererProps) {
  return (
    <div className="h-full w-full relative">
      <Map
        initialViewState={INITIAL_VIEW}
        style={{ width: "100%", height: "100%" }}
        mapStyle={BASEMAP_STYLE}
      >
        <DeckGlOverlay layers={[]} />
      </Map>
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-destructive/90 text-destructive-foreground px-3 py-2 rounded text-xs font-mono">
          {error}
        </div>
      )}
    </div>
  );
}
