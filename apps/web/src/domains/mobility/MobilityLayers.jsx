import L from 'leaflet';
import { useEffect } from 'react';
import { useMapContext } from '../../map/MapProvider.jsx';

const AGENCY_LAYER_KEYS = {
  METRO: 'metro',
  MB: 'metrobus',
  TROLE: 'trolebus',
  CBB: 'cablebus',
  RTP: 'rtp',
  TL: 'tren',
  CC: 'concesionado'
};

/**
 * Trazos de la Red MI, estaciones de Metro y Metrobús.
 * @param {{
 *   data: import('@mapatianguis/contracts/mobility').MobilityNetwork,
 *   onSelect: (selection: { kind: 'metro'|'transport', data: any }) => void
 * }} props
 */
export function MobilityLayers({ data, onSelect }) {
  const { registerLayer, unregisterLayer } = useMapContext();

  useEffect(() => {
    if (!data) return undefined;

    const groups = Object.fromEntries(
      Object.values(AGENCY_LAYER_KEYS).map((key) => [key, L.featureGroup()])
    );
    const metroIcons = L.featureGroup();
    const metrobusIcons = L.featureGroup();

    for (const [agency, layerData] of Object.entries(data.transport ?? {})) {
      const key = AGENCY_LAYER_KEYS[agency];
      const group = groups[key];
      if (!group) continue;

      for (const feature of layerData.features ?? []) {
        const properties = feature.properties;
        const polyline = L.polyline(
          feature.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
          {
            color: properties.color,
            weight: properties.weight,
            opacity: 0.9
          }
        );

        polyline.bindPopup(`
          <div style="font-weight:800; color:${properties.color}; font-size:0.92rem; margin-bottom:2px;">
            ${properties.agency_name}
          </div>
          <div style="font-size:0.75rem; color:#334155; margin-bottom:4px;">
            Ruta: <b>${properties.route_short || ''} ${properties.route_long || ''}</b>
          </div>
          <div style="font-size:0.7rem; color:#64748b;">
            ${properties.headsign || 'Servicio Concesionado / Red'}
          </div>
        `);

        polyline.on('click', () => {
          const [lon, lat] = feature.geometry.coordinates[0];
          onSelect({ kind: 'transport', data: properties, anchor: { lat, lon } });
        });

        group.addLayer(polyline);
      }
    }

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

      const marker = L.marker([station.lat, station.lon], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-weight:800; color:${station.color}; font-size:0.92rem; margin-bottom:2px;">
          Metro ${station.nombre}
        </div>
        <div style="font-size:0.75rem; color:#475569; margin-bottom:4px;">
          Línea ${station.linea} · ${station.tipo} · ${station.alcaldia}
        </div>
        <span style="background:#fee2e2; color:#991b1b; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px;">
          Tarifa: $5.00 MXN
        </span>
      `);

      marker.on('click', () => {
        onSelect({ kind: 'metro', data: station });
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

      const marker = L.marker([station.lat, station.lon], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-weight:800; color:#d81b60; font-size:0.92rem; margin-bottom:2px;">
          Metrobús ${station.nombre}
        </div>
        <div style="font-size:0.75rem; color:#475569; margin-bottom:4px;">
          ${station.linea} · Alcaldía ${station.alcaldia}
        </div>
        <span style="background:#fce7f3; color:#9d174d; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px;">
          Tarifa: $6.00 MXN
        </span>
      `);

      metrobusIcons.addLayer(marker);
    }

    for (const [key, layer] of Object.entries(groups)) registerLayer(key, layer);
    registerLayer('metro_icons', metroIcons);
    registerLayer('metrobus_icons', metrobusIcons);

    return () => {
      for (const [key, layer] of Object.entries(groups)) unregisterLayer(key, layer);
      unregisterLayer('metro_icons', metroIcons);
      unregisterLayer('metrobus_icons', metrobusIcons);
    };
  }, [data, onSelect, registerLayer, unregisterLayer]);

  return null;
}
