import L from 'leaflet';
import { useEffect } from 'react';
import { matchesDay, normalizeText } from '@mapatianguis/contracts';
import { useMapContext } from '../../map/MapProvider.jsx';

/**
 * Capas del comercio popular: mercados, MSR y tianguis.
 * Expone una API imperativa mínima para buscador y filtro "Abrir Hoy".
 * @param {{
 *   data: import('@mapatianguis/contracts/commerce').CommerceDirectory,
 *   onSelect: (selection: { kind: 'mercado'|'msr'|'tianguis', data: any }) => void,
 *   onReady?: (api: {
 *     focusMercado: (query: string) => void,
 *     setDayFilter: (day: string | null) => void
 *   } | null) => void
 * }} props
 */
export function CommerceLayers({ data, onSelect, onReady }) {
  const { map, registerLayer, unregisterLayer } = useMapContext();

  useEffect(() => {
    if (!data) return undefined;

    const mercadosLayer = L.featureGroup();
    const markerByMercado = new Map();

    for (const mercado of data.mercados ?? []) {
      const marker = L.circleMarker([mercado.lat, mercado.lon], {
        radius: mercado.radio,
        fillColor: '#f59e0b',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      });

      marker.bindPopup(`
        <div style="font-weight:800; color:#b45309; font-size:0.95rem; margin-bottom:2px;">
          Mercado ${mercado.nombre}
        </div>
        <div style="font-size:0.75rem; color:#475569; margin-bottom:4px;">
          ${mercado.alcaldia} · ${mercado.colonia}
        </div>
        <div>
          <span style="background:#fef3c7; color:#92400e; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px;">
            ${mercado.locales} locales
          </span>
          <span style="background:#e0f2fe; color:#0369a1; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px;">
            ${mercado.categoria}
          </span>
        </div>
      `);

      marker.on('click', () => {
        onSelect({ kind: 'mercado', data: mercado });
      });

      mercadosLayer.addLayer(marker);
      markerByMercado.set(mercado, marker);
    }

    const msrLayer = L.featureGroup();
    for (const msr of data.msr ?? []) {
      const marker = L.circleMarker([msr.lat, msr.lon], {
        radius: msr.radio,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      });

      marker.bindPopup(`
        <div style="font-weight:800; color:#047857; font-size:0.95rem; margin-bottom:2px;">
          MSR: ${msr.ruta}
        </div>
        <div style="font-size:0.75rem; color:#475569; margin-bottom:4px;">
          ${msr.alcaldia} · ${msr.colonia}
        </div>
        <div>
          <span style="background:#d1fae5; color:#065f46; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px;">
            Día: ${msr.dia}
          </span>
          <span style="background:#dbeafe; color:#1e40af; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px;">
            ${msr.oferentes} oferentes
          </span>
        </div>
      `);

      marker.on('click', () => {
        onSelect({ kind: 'msr', data: msr });
      });

      msrLayer.addLayer(marker);
    }

    const tianguisLayer = L.featureGroup();
    const tianguisMarkers = (data.tianguis ?? []).map((tianguis) => {
      const marker = L.circleMarker([tianguis.lat, tianguis.lon], {
        radius: 5.5,
        fillColor: '#0f5953',
        color: '#ffffff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.8
      });

      marker.bindPopup(`
        <div style="font-weight:800; color:#0f5953; font-size:0.92rem; margin-bottom:2px;">
          Tianguis Móvil
        </div>
        <div style="font-size:0.75rem; color:#475569; margin-bottom:4px;">
          ${tianguis.alcaldia} · ${tianguis.colonia}
        </div>
        <div style="font-size:0.7rem; color:#64748b; margin-bottom:4px;">
          📍 ${tianguis.ubicacion}
        </div>
        <span style="background:#ccfbf1; color:#0f766e; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px;">
          ${tianguis.dia}
        </span>
        <span style="background:#e2e8f0; color:#334155; font-size:0.7rem; padding:2px 6px; border-radius:4px;">
          ${tianguis.horario}
        </span>
      `);

      marker.on('click', () => {
        onSelect({ kind: 'tianguis', data: tianguis });
      });

      return { marker, tianguis };
    });

    const renderTianguis = (day = null) => {
      tianguisLayer.clearLayers();
      for (const { marker, tianguis } of tianguisMarkers) {
        if (!day || matchesDay(tianguis.dia, day)) tianguisLayer.addLayer(marker);
      }
    };
    renderTianguis();

    // Método imperativo para el chip "Abrir Hoy".
    tianguisLayer.setDayFilter = renderTianguis;

    registerLayer('mercados', mercadosLayer);
    registerLayer('msr', msrLayer);
    registerLayer('tianguis', tianguisLayer);

    const focusMercado = (query) => {
      const term = normalizeText(query);
      if (!term) return;
      const mercado = (data.mercados ?? []).find(
        (item) =>
          normalizeText(item.nombre).includes(term) ||
          normalizeText(item.colonia).includes(term) ||
          normalizeText(item.alcaldia).includes(term)
      );
      if (!mercado) return;
      const marker = markerByMercado.get(mercado);
      map?.setView([mercado.lat, mercado.lon], 15);
      marker?.openPopup();
      onSelect({ kind: 'mercado', data: mercado });
    };

    onReady?.({ focusMercado, setDayFilter: renderTianguis });

    return () => {
      onReady?.(null);
      unregisterLayer('mercados', mercadosLayer);
      unregisterLayer('msr', msrLayer);
      unregisterLayer('tianguis', tianguisLayer);
    };
  }, [data, map, onSelect, onReady, registerLayer, unregisterLayer]);

  return null;
}
