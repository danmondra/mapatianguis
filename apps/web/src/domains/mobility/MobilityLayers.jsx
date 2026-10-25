import L from 'leaflet';
import { useEffect } from 'react';
import { STATION_MIN_ZOOM } from '@mapatianguis/contracts';
import { useMapContext } from '../../map/MapProvider.jsx';

const STATION_OPACITY = 0.55;

/**
 * Estaciones de Metro y Metrobús como referencia visual. Se dibujan tenues y
 * solo a partir de `STATION_MIN_ZOOM`.
 *
 * No son seleccionables: únicamente los tianguis y las alcaldías lo son. Sus
 * iconos tampoco deben robar clicks a los tianguis que queden debajo.
 * @param {{
 *   data: import('@mapatianguis/contracts/mobility').MobilityNetwork
 * }} props
 */
export function MobilityLayers({ data }) {
  const { registerLayer, unregisterLayer } = useMapContext();

  useEffect(() => {
    if (!data) return undefined;

    const metroIcons = L.featureGroup();
    const metrobusIcons = L.featureGroup();

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
        opacity: STATION_OPACITY,
        interactive: false,
        keyboard: false
      });

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
        opacity: STATION_OPACITY,
        interactive: false,
        keyboard: false
      });

      metrobusIcons.addLayer(marker);
    }

    registerLayer('metro_icons', metroIcons, { minZoom: STATION_MIN_ZOOM });
    registerLayer('metrobus_icons', metrobusIcons, { minZoom: STATION_MIN_ZOOM });

    return () => {
      unregisterLayer('metro_icons', metroIcons);
      unregisterLayer('metrobus_icons', metrobusIcons);
    };
  }, [data, registerLayer, unregisterLayer]);

  return null;
}
