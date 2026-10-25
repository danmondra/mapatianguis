import L from 'leaflet';
import { useEffect } from 'react';
import { STATION_MIN_ZOOM } from '@mapatianguis/contracts';
import { useMapContext } from '../../map/MapProvider.jsx';

const STATION_OPACITY = 0.55;

/**
 * Estaciones de Metro y Metrobús. Se dibujan tenues y solo a partir del zoom
 * definido en `STATION_MIN_ZOOM` para no saturar la vista metropolitana.
 * @param {{
 *   data: import('@mapatianguis/contracts/mobility').MobilityNetwork,
 *   onSelect: (selection: { kind: 'metro'|'metrobus', data: any }) => void
 * }} props
 */
export function MobilityLayers({ data, onSelect }) {
  const { registerLayer, unregisterLayer } = useMapContext();

  useEffect(() => {
    if (!data) return undefined;

    const metroIcons = L.featureGroup();
    const metrobusIcons = L.featureGroup();

    const fade = (marker) => {
      marker.setOpacity(STATION_OPACITY);
      marker.on('mouseover', () => marker.setOpacity(1));
      marker.on('mouseout', () => marker.setOpacity(STATION_OPACITY));
    };

    for (const station of data.metroStations ?? []) {
      const glyphHtml = station.has_glyph
        ? `<em class="${station.icon_class}"></em>`
        : `<span style="font-size:8.5px; font-weight:800; color:#fff;">${station.fallback_text || 'M'}</span>`;

      const customIcon = L.divIcon({
        className: 'custom-metro-icon-container',
        html: `
          <div class="metro-station-badge" style="background:${station.color};" title="${station.nombre} (Línea ${station.linea})">
            ${glyphHtml}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([station.lat, station.lon], {
        icon: customIcon,
        opacity: STATION_OPACITY
      });
      marker.bindPopup(`
        <div style="font-weight:800; color:${station.color}; font-size:0.92rem; margin-bottom:2px;">
          Metro ${station.nombre}
        </div>
        <div style="font-size:0.75rem; color:#475569;">
          Línea ${station.linea} · ${station.tipo} · ${station.alcaldia}
        </div>
      `);

      marker.on('click', () => {
        onSelect({ kind: 'metro', data: station });
      });

      fade(marker);
      metroIcons.addLayer(marker);
    }

    for (const station of data.metrobusStations ?? []) {
      const customIcon = L.divIcon({
        className: 'custom-mb-icon-container',
        html: `<div class="mb-station-badge" title="${station.nombre} (${station.linea})">MB</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([station.lat, station.lon], {
        icon: customIcon,
        opacity: STATION_OPACITY
      });
      marker.bindPopup(`
        <div style="font-weight:800; color:#d81b60; font-size:0.92rem; margin-bottom:2px;">
          Metrobús ${station.nombre}
        </div>
        <div style="font-size:0.75rem; color:#475569;">
          ${station.linea} · Alcaldía ${station.alcaldia}
        </div>
      `);

      marker.on('click', () => {
        onSelect({ kind: 'metrobus', data: station });
      });

      fade(marker);
      metrobusIcons.addLayer(marker);
    }

    registerLayer('metro_icons', metroIcons, { minZoom: STATION_MIN_ZOOM });
    registerLayer('metrobus_icons', metrobusIcons, { minZoom: STATION_MIN_ZOOM });

    return () => {
      unregisterLayer('metro_icons', metroIcons);
      unregisterLayer('metrobus_icons', metrobusIcons);
    };
  }, [data, onSelect, registerLayer, unregisterLayer]);

  return null;
}
