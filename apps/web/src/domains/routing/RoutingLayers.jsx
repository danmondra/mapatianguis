import L from 'leaflet';
import { useEffect } from 'react';
import { useMapContext } from '../../map/MapProvider.jsx';

/**
 * Dibuja el plan de ruta devuelto por la API y ajusta el encuadre.
 * @param {{ plan: import('@mapatianguis/contracts/routing').RoutePlan | null }} props
 */
export function RoutingLayers({ plan }) {
  const { map } = useMapContext();

  useEffect(() => {
    if (!map || !plan) return undefined;

    const group = L.featureGroup();

    for (const leg of plan.legs ?? []) {
      const polyline = L.polyline(
        leg.points.map((point) => [point.lat, point.lon]),
        {
          color: leg.color,
          weight: leg.weight,
          ...(leg.dashed ? { dashArray: '6, 6' } : {})
        }
      );
      polyline.bindPopup(leg.popup);
      group.addLayer(polyline);
    }

    group.addTo(map);

    if ((plan.bounds ?? []).length > 0) {
      map.fitBounds(
        L.latLngBounds(plan.bounds.map((point) => [point.lat, point.lon])),
        { padding: [50, 50] }
      );
    }

    return () => {
      group.remove();
    };
  }, [map, plan]);

  return null;
}
