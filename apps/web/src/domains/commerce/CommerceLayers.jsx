import L from 'leaflet';
import { useEffect } from 'react';
import { tianguisMatchesFilters } from '@mapatianguis/contracts/commerce';
import { categoriaDeTianguis } from '@mapatianguis/contracts/giros';
import { useMapContext } from '../../map/MapProvider.jsx';
import { createTianguisIcon, tianguisIconSize } from './tianguisIcon.js';

/**
 * Capa de tianguis. Expone una API imperativa mínima para el buscador y los
 * filtros del panel.
 * @param {{
 *   data: import('@mapatianguis/contracts/commerce').CommerceDirectory,
 *   onSelect: (selection: { kind: 'tianguis', data: any }) => void,
 *   onReady?: (api: {
 *     setFilters: (filters: import('@mapatianguis/contracts/commerce').CommerceFilters) => void,
 *     fitFiltered: () => void
 *   } | null) => void
 * }} props
 */
export function CommerceLayers({ data, onSelect, onReady }) {
  const { map, zoom, registerLayer, unregisterLayer } = useMapContext();

  useEffect(() => {
    if (!data) return undefined;

    const tianguisLayer = L.featureGroup();
    const tianguisMarkers = (data.tianguis ?? []).map((tianguis) => {
      const categoria = categoriaDeTianguis(tianguis);
      const marker = L.marker([tianguis.lat, tianguis.lon], {
        icon: createTianguisIcon(map?.getZoom() ?? zoom, tianguis),
        // El puesto va en el pane de marcadores para que su tooltip y su
        // hitbox no los tape un polígono.
        pane: 'markerPane',
        title: `Tianguis · ${tianguis.colonia}`,
        alt: `Tianguis en ${tianguis.colonia} (${categoria.nombre})`,
        keyboard: true
      });

      // Al pasar el cursor se muestra la foto del tianguis; al hacer click
      // se abre la ficha completa. Sin popup intermedio para no duplicar la
      // misma información en dos capas del mapa.
      const photo = tianguis.fotos?.principal ?? tianguis.fotos?.calle;
      if (photo?.thumb) {
        marker.bindTooltip(photoTooltip(tianguis, photo), {
          className: 'tianguis-foto-tooltip',
          direction: 'top',
          offset: [0, -20],
          opacity: 1
        });
      }

      marker.on('click', () => {
        marker.closeTooltip();
        onSelect({ kind: 'tianguis', data: tianguis });
      });

      return { marker, tianguis };
    });

    // El buscador y el panel escriben un solo objeto de filtros. La capa se
    // recorre sin reconstruir los 1,367 marcadores en cada tecla.
    let filters = {};
    let visibles = [];

    const renderTianguis = () => {
      tianguisLayer.clearLayers();
      visibles = [];
      for (const { marker, tianguis } of tianguisMarkers) {
        if (!tianguisMatchesFilters(tianguis, filters)) continue;
        tianguisLayer.addLayer(marker);
        visibles.push(tianguis);
      }
    };
    renderTianguis();

    tianguisLayer.setFilters = (next) => {
      filters = next ?? {};
      renderTianguis();
    };

    // Acerca el mapa a los tianguis que pasaron los filtros. Se usa al elegir
    // una opción del buscador, no al escribir: mover el mapa en cada tecla
    // desorienta más de lo que ayuda.
    tianguisLayer.fitFiltered = () => {
      if (visibles.length === 0) return;
      if (visibles.length === 1) {
        map?.setView([visibles[0].lat, visibles[0].lon], 15);
        return;
      }
      const bounds = L.latLngBounds(
        visibles.map((tianguis) => [tianguis.lat, tianguis.lon])
      );
      map?.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    };

    // El PNG se reescala a cada tramo de zoom: así el puesto no se ve borroso
    // de cerca ni gigante de lejos.
    const syncTianguisIconSize = () => {
      const currentZoom = map?.getZoom() ?? zoom;
      const size = tianguisIconSize(currentZoom);
      for (const { marker, tianguis } of tianguisMarkers) {
        if (marker.getElement()?.querySelector('img')?.width === size) continue;
        marker.setIcon(createTianguisIcon(currentZoom, tianguis));
      }
    };

    registerLayer('tianguis', tianguisLayer);

    onReady?.({
      setFilters: tianguisLayer.setFilters,
      fitFiltered: tianguisLayer.fitFiltered
    });
    map?.on('zoomend', syncTianguisIconSize);
    syncTianguisIconSize();

    return () => {
      onReady?.(null);
      map?.off('zoomend', syncTianguisIconSize);
      unregisterLayer('tianguis', tianguisLayer);
    };
  }, [data, map, onSelect, onReady, registerLayer, unregisterLayer]);

  return null;
}

/**
 * Tarjeta HTML del tooltip de hover. Se escapan los datos del directorio
 * porque el contenido pasa por el parser HTML de Leaflet.
 */
function photoTooltip(tianguis, photo) {
  return `
    <div class="tianguis-foto-tooltip-card">
      <img class="tianguis-foto-tooltip-img" src="${escapeHtml(photo.thumb)}" alt="" loading="lazy" decoding="async" />
      <div class="tianguis-foto-tooltip-copy">
        <strong>${escapeHtml(tianguis.colonia)}</strong>
        <span>${escapeHtml(tianguis.alcaldia)} · ${escapeHtml(tianguis.dia)}</span>
        <small>Click para ver la ficha</small>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
