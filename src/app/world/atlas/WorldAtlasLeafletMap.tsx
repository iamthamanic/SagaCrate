/**
 * WorldAtlasLeafletMap — CRS.Simple Leaflet + Geoman Free editor (#702).
 * Location: src/app/world/atlas/WorldAtlasLeafletMap.tsx
 */
import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'leaflet/dist/leaflet.css';
import type {
  WorldAtlasBounds,
  WorldAtlasFeatureCollection,
} from '../../../domains/world/atlas';

export type WorldAtlasLeafletMapProps = {
  readonly bounds: WorldAtlasBounds;
  readonly layers: WorldAtlasFeatureCollection;
  readonly canEdit: boolean;
  readonly onLayersChange?: (layers: WorldAtlasFeatureCollection) => void;
};

type LeafletMapWithPm = L.Map & {
  pm: {
    addControls: (opts: Record<string, unknown>) => void;
    removeControls: () => void;
    disableDraw: () => void;
    disableGlobalEditMode: () => void;
    disableGlobalRemovalMode: () => void;
    setLang: (lang: string) => void;
  };
};

function AtlasMapController({
  bounds,
  layers,
  canEdit,
  onLayersChange,
}: WorldAtlasLeafletMapProps) {
  const map = useMap() as LeafletMapWithPm;
  const geoRef = useRef<L.GeoJSON | null>(null);
  const onChangeRef = useRef(onLayersChange);
  onChangeRef.current = onLayersChange;

  const leafletBounds = useMemo(
    () =>
      L.latLngBounds(
        L.latLng(bounds.minY, bounds.minX),
        L.latLng(bounds.maxY, bounds.maxX),
      ),
    [bounds],
  );

  useEffect(() => {
    map.setMaxBounds(leafletBounds.pad(0.2));
    map.fitBounds(leafletBounds, { animate: false });
    // Flex layouts often mount Leaflet at 0×0 — force a redraw once size is known.
    const t = window.setTimeout(() => map.invalidateSize(), 50);
    return () => window.clearTimeout(t);
  }, [map, leafletBounds]);

  useEffect(() => {
    if (geoRef.current) {
      map.removeLayer(geoRef.current);
      geoRef.current = null;
    }

    // Visible ground plane so CRS.Simple is never a blank navy void.
    const ground = L.rectangle(leafletBounds, {
      color: '#334155',
      weight: 1,
      fillColor: '#1E293B',
      fillOpacity: 1,
      interactive: false,
    });
    const gridGroup = L.layerGroup([ground]);
    const stepX = Math.max(50, (bounds.maxX - bounds.minX) / 10);
    const stepY = Math.max(50, (bounds.maxY - bounds.minY) / 10);
    for (let x = bounds.minX; x <= bounds.maxX; x += stepX) {
      gridGroup.addLayer(
        L.polyline(
          [
            [bounds.minY, x],
            [bounds.maxY, x],
          ],
          { color: '#334155', weight: 1, opacity: 0.6, interactive: false },
        ),
      );
    }
    for (let y = bounds.minY; y <= bounds.maxY; y += stepY) {
      gridGroup.addLayer(
        L.polyline(
          [
            [y, bounds.minX],
            [y, bounds.maxX],
          ],
          { color: '#334155', weight: 1, opacity: 0.6, interactive: false },
        ),
      );
    }
    gridGroup.addTo(map);

    const layer = L.geoJSON(layers as GeoJSON.FeatureCollection, {
      style: {
        color: '#06B6D4',
        weight: 2,
        fillColor: '#06B6D4',
        fillOpacity: 0.35,
      },
      pointToLayer: (_feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 8,
          color: '#F59E0B',
          fillColor: '#E8A641',
          fillOpacity: 0.95,
          weight: 2,
        }),
    });
    layer.addTo(map);
    geoRef.current = layer;

    const emit = () => {
      if (!onChangeRef.current || !geoRef.current) return;
      const fc = geoRef.current.toGeoJSON() as WorldAtlasFeatureCollection;
      onChangeRef.current(fc);
    };

    map.on('pm:create', (e: { layer: L.Layer }) => {
      if (geoRef.current) {
        geoRef.current.addLayer(e.layer);
      }
      emit();
    });
    map.on('pm:remove', () => emit());
    map.on('pm:edit', () => emit());
    map.on('pm:dragend', () => emit());

    return () => {
      map.off('pm:create');
      map.off('pm:remove');
      map.off('pm:edit');
      map.off('pm:dragend');
      map.removeLayer(gridGroup);
      if (geoRef.current) {
        map.removeLayer(geoRef.current);
        geoRef.current = null;
      }
    };
  }, [map, layers, leafletBounds, bounds]);

  useEffect(() => {
    if (!canEdit) {
      map.pm.removeControls();
      map.pm.disableDraw();
      map.pm.disableGlobalEditMode();
      map.pm.disableGlobalRemovalMode();
      return;
    }
    map.pm.addControls({
      position: 'topleft',
      drawMarker: true,
      drawPolyline: true,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: false,
      drawCircleMarker: false,
      drawText: false,
      cutPolygon: false,
      rotateMode: false,
      editMode: true,
      dragMode: true,
      removalMode: true,
    });
    map.pm.setLang('de');
    return () => {
      map.pm.removeControls();
    };
  }, [map, canEdit]);

  return null;
}

export function WorldAtlasLeafletMap(props: WorldAtlasLeafletMapProps) {
  const { bounds } = props;
  const center = useMemo(
    () =>
      [
        (bounds.minY + bounds.maxY) / 2,
        (bounds.minX + bounds.maxX) / 2,
      ] as [number, number],
    [bounds],
  );

  return (
    <MapContainer
      crs={L.CRS.Simple}
      center={center}
      zoom={0}
      minZoom={-2}
      maxZoom={6}
      className="h-full w-full min-h-[20rem] rounded-lg border border-border bg-slate-900"
      data-world-atlas-leaflet
      attributionControl={false}
      preferCanvas
    >
      <AtlasMapController {...props} />
    </MapContainer>
  );
}
