import L from 'leaflet';
import { useCallback, useEffect } from 'react';
import { useMapContext } from './MapProvider.jsx';

/**
 * Punto azul GPS con halo pulsante y círculo de precisión.
 * @param {{ onLocation?: (coordinates: { lat: number, lon: number }) => void }} options
 */
export function useUserLocation({ onLocation } = {}) {
  const { map } = useMapContext();

  useEffect(() => {
    if (!map) return undefined;

    const group = L.featureGroup().addTo(map);

    const handleFound = (event) => {
      const { lat, lng } = event.latlng;
      group.clearLayers();

      const blueDotIcon = L.divIcon({
        className: 'user-gps-container',
        html: `
          <div style="position:relative; width:16px; height:16px;">
            <div class="user-gps-pulse-halo"></div>
            <div class="user-gps-blue-dot"></div>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker(event.latlng, { icon: blueDotIcon })
        .bindPopup(
          `
          <div style="font-weight:800; color:#2563eb; font-size:0.85rem;">📍 Tu Ubicación Actual</div>
          <div style="font-size:0.72rem; color:#64748b;">Precisión GPS: +/- ${Math.round(event.accuracy)} metros</div>
        `
        )
        .openPopup();

      const accuracyCircle = L.circle(event.latlng, {
        radius: event.accuracy,
        color: '#2563eb',
        weight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.12
      });

      group.addLayer(accuracyCircle);
      group.addLayer(marker);
      onLocation?.({ lat, lon: lng });
    };

    const handleError = () => {
      alert(
        'Aviso de Ubicación: Activa el permiso de ubicación en tu navegador para mostrar tu punto azul en el mapa.'
      );
    };

    map.on('locationfound', handleFound);
    map.on('locationerror', handleError);

    return () => {
      map.off('locationfound', handleFound);
      map.off('locationerror', handleError);
      group.remove();
    };
  }, [map, onLocation]);

  const locate = useCallback(() => {
    map?.locate({ setView: true, maxZoom: 15, enableHighAccuracy: true });
  }, [map]);

  return { locate };
}
