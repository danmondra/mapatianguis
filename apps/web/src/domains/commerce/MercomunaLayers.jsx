import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { MERCOMUNA_MIN_ZOOM } from '@mapatianguis/contracts';
import { MERCOMUNA_PRECISION_LABEL } from '@mapatianguis/contracts/commerce';
import { MAP_PANES, useMapContext } from '../../map/MapProvider.jsx';

const AMBER = '#b45309';
const AMBER_SOFT = '#fef3c7';

/**
 * Capa de comercios que aceptan vales Mercomuna.
 *
 * Tres orígenes para tres precisiones distintas:
 * - `exacta`: chincheta propia del comercio.
 * - `cp`: un círculo por código postal, con el número de comercios. Dibujar
 *   6,755 centroides compartidos como chinchetas sería inventar ubicaciones.
 * - `sin_ubicacion`: no se dibuja; solo cuenta en el chip.
 *
 * @param {{
 *   data: import('@mapatianguis/contracts/commerce').MercomunaDirectory | null,
 *   onSelect: (selection: { kind: 'mercomuna', data: any }) => void,
 *   onReady?: (api: { focusComercio: (query: string) => void } | null) => void
 * }} props
 */
export function MercomunaLayers({ data, onSelect, onReady }) {
  const { map, registerLayer, unregisterLayer } = useMapContext();

  // Los marcadores se construyen una sola vez por directorio: recrear 8,798
  // popups en cada render sería el costo dominante de la capa.
  const built = useMemo(() => {
    if (!data) return null;

    const exactos = L.featureGroup();
    const exactosMarkers = [];
    const renderer = L.svg({ pane: MAP_PANES.mercomuna });

    for (const comercio of data.comercios ?? []) {
      if (comercio.precision !== 'exacta' || comercio.lat == null) continue;

      const marker = L.circleMarker([comercio.lat, comercio.lon], {
        renderer,
        radius: 4.5,
        fillColor: AMBER,
        color: '#ffffff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.9
      });

      marker.bindPopup(popupComercio(comercio));
      marker.on('click', () => onSelect({ kind: 'mercomuna', data: comercio }));
      exactos.addLayer(marker);
      exactosMarkers.push({ marker, comercio });
    }

    const porCp = L.featureGroup();
    for (const entry of data.porCp ?? []) {
      if (entry.lat == null) continue;

      const radio = 200 + Math.sqrt(entry.comercios) * 55;
      const circle = L.circle([entry.lat, entry.lon], {
        renderer,
        radius: radio,
        fillColor: AMBER,
        color: AMBER,
        weight: 1,
        opacity: 0.45,
        fillOpacity: 0.12
      });

      circle.bindPopup(popupCp(entry));
      circle.on('click', () => onSelect({ kind: 'mercomuna_cp', data: entry }));
      porCp.addLayer(circle);
    }

    return { exactos, porCp, exactosMarkers, renderer };
  }, [data, onSelect]);

  useEffect(() => {
    if (!built) return undefined;

    // El círculo por CP se muestra de lejos; las chinchetas exactas solo desde
    // MERCOMUNA_MIN_ZOOM para no saturar el mapa a zoom de ciudad.
    registerLayer('mercomuna', built.porCp);
    registerLayer('mercomuna_exacta', built.exactos, { minZoom: MERCOMUNA_MIN_ZOOM });

    const focusComercio = (query) => {
      const term = String(query ?? '').trim().toLowerCase();
      if (!term) return;
      const match = built.exactosMarkers.find(({ comercio }) =>
        comercio.nombre.toLowerCase().includes(term)
      );
      if (!match) return;
      map?.setView([match.comercio.lat, match.comercio.lon], 16);
      match.marker.openPopup();
      onSelect({ kind: 'mercomuna', data: match.comercio });
    };

    onReady?.({ focusComercio });

    return () => {
      onReady?.(null);
      unregisterLayer('mercomuna', built.porCp);
      unregisterLayer('mercomuna_exacta', built.exactos);
      built.exactos.clearLayers();
      built.porCp.clearLayers();
      if (map?.hasLayer(built.renderer)) map.removeLayer(built.renderer);
    };
  }, [built, map, onSelect, onReady, registerLayer, unregisterLayer]);

  return null;
}

/** @param {import('@mapatianguis/contracts/commerce').ComercioMercomuna} comercio */
function popupComercio(comercio) {
  const categoria = comercio.categoria
    ? `<span style="background:${AMBER_SOFT}; color:${AMBER}; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px;">
         ${comercio.categoria}
       </span>`
    : '';

  return `
    <div style="font-weight:800; color:${AMBER}; font-size:0.95rem; margin-bottom:2px;">
      ${comercio.nombre}
    </div>
    <div style="font-size:0.75rem; color:#475569; margin-bottom:4px;">
      ${comercio.alcaldia}${comercio.cp ? ` · CP ${comercio.cp}` : ''}
    </div>
    <div style="font-size:0.7rem; color:#64748b; margin-bottom:6px;">
      📍 ${comercio.calle}
    </div>
    ${categoria}
    <span style="background:${AMBER_SOFT}; color:${AMBER}; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px;">
      Vales Mercomuna
    </span>
  `;
}

/** @param {import('@mapatianguis/contracts/commerce').ComercioMercomunaPorCp} entry */
function popupCp(entry) {
  const categorias = entry.categorias.slice(0, 4).join(' · ');
  return `
    <div style="font-weight:800; color:${AMBER}; font-size:0.95rem; margin-bottom:2px;">
      CP ${entry.cp}
    </div>
    <div style="font-size:0.75rem; color:#475569; margin-bottom:6px;">
      ${entry.alcaldia}
    </div>
    <div style="font-size:0.75rem; color:#334155; margin-bottom:4px;">
      <b>${entry.comercios}</b> comercio${entry.comercios === 1 ? '' : 's'} con vales
      ${entry.comerciosAlimentos > 0 ? `· <b>${entry.comerciosAlimentos}</b> de alimentos` : ''}
    </div>
    ${
      categorias
        ? `<div style="font-size:0.7rem; color:#64748b; margin-bottom:4px;">${categorias}</div>`
        : ''
    }
    <div style="font-size:0.68rem; color:#94a3b8;">
      ${MERCOMUNA_PRECISION_LABEL.cp}: el punto es el centroide del código postal, no cada comercio.
    </div>
  `;
}
