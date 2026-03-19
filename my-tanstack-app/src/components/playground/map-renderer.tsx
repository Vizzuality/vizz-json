import { Map, useControl, type MapRef } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { MapboxOverlayProps } from "@deck.gl/mapbox";
import { useEffect, useRef, useCallback } from "react";
import { LegendPanel } from "./legend-panel";
import type { LegendConfig } from "#/lib/types";
import "maplibre-gl/dist/maplibre-gl.css";

const SOURCE_ID = "playground-source";
const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const INITIAL_VIEW = { longitude: 0, latitude: 20, zoom: 2 };

function DeckGlOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(
    () => new MapboxOverlay({ ...props, interleaved: true })
  );
  overlay.setProps({ ...props, interleaved: true });
  return null;
}

type MapRendererProps = {
  readonly resolvedConfig: Record<string, unknown> | null;
  readonly error: string | null;
  readonly legendConfig: LegendConfig | null;
};

export function MapRenderer({
  resolvedConfig,
  error,
  legendConfig,
}: MapRendererProps) {
  const mapRef = useRef<MapRef>(null);
  const layerIdsRef = useRef<readonly string[]>([]);

  const clearLayers = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const idsToRemove = [...layerIdsRef.current].reverse();
    for (const id of idsToRemove) {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
    }
    layerIdsRef.current = [];

    if (map.getSource(SOURCE_ID)) {
      map.removeSource(SOURCE_ID);
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !resolvedConfig) return;

    const source = resolvedConfig.source as
      | Record<string, unknown>
      | undefined;
    const styles = resolvedConfig.styles as
      | readonly Record<string, unknown>[]
      | undefined;

    if (!source || !styles) return;

    const apply = () => {
      clearLayers();
      try {
        map.addSource(SOURCE_ID, source as maplibregl.SourceSpecification);

        const newLayerIds: string[] = [];
        styles.forEach((style, i) => {
          const layerId = `playground-layer-${i}`;
          map.addLayer({
            id: layerId,
            source: SOURCE_ID,
            ...style,
          } as maplibregl.LayerSpecification);
          newLayerIds.push(layerId);
        });
        layerIdsRef.current = newLayerIds;
      } catch (err) {
        console.error("Failed to apply layer config:", err);
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("styledata", apply);
    }

    return () => {
      clearLayers();
    };
  }, [resolvedConfig, clearLayers]);

  return (
    <div className="h-full w-full relative">
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        style={{ width: "100%", height: "100%" }}
        mapStyle={BASEMAP_STYLE}
      >
        <DeckGlOverlay layers={[]} />
      </Map>
      <LegendPanel config={legendConfig} />
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-destructive/90 text-destructive-foreground px-3 py-2 rounded text-xs font-mono">
          {error}
        </div>
      )}
    </div>
  );
}
