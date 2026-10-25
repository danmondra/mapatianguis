import L from 'leaflet';
import { categoriaDeTianguis, imagenDeCategoria } from '@mapatianguis/contracts/giros';

/**
 * Proporción del PNG de cada puesto (256×270). El icono es cuadrado: la
 * ilustración se ajusta dentro de ese cuadro sin deformarse y queda centrada.
 */
const IMAGE_ASPECT = 270 / 256;

/**
 * Tamaño del marcador por tramo de zoom, en píxeles de lado.
 *
 * El tianguis es un marcador, no una ilustración: a zoom de ciudad mide 30 px
 * —el doble del círculo al que reemplaza— para que 1,367 puntos se lean como
 * puestos sin tapar el mapa, y crece hasta 60 px cuando ya se mira un barrio.
 * Cada tramo cubre hasta su `maxZoom` inclusive; el último no tiene tope.
 * @type {readonly { maxZoom: number, size: number }[]}
 */
const SIZE_BY_ZOOM = Object.freeze([
  { maxZoom: 11, size: 30 },
  { maxZoom: 13, size: 36 },
  { maxZoom: 15, size: 42 },
  { maxZoom: 16, size: 51 },
  { maxZoom: Number.POSITIVE_INFINITY, size: 60 }
]);

/**
 * @param {number} zoom
 * @returns {number} lado del icono en píxeles
 */
export function tianguisIconSize(zoom) {
  const tramo = SIZE_BY_ZOOM.find(({ maxZoom }) => zoom <= maxZoom);
  return (tramo ?? SIZE_BY_ZOOM[SIZE_BY_ZOOM.length - 1]).size;
}

/** El mismo tianguis siempre cae en el mismo icono: se reutilizan instancias. */
const iconCache = new Map();

/**
 * Icono de un tianguis: el puesto se dibuja centrado en su coordenada, igual
 * que el círculo al que reemplaza, para no mover ningún punto del mapa.
 *
 * El `className` lleva la categoría para poder colorear o enfocar por giro
 * desde CSS; el `alt` sólo aparece al enfocar con teclado.
 *
 * @param {number} zoom
 * @param {{ categorias?: string[] }} tianguis
 * @returns {L.DivIcon}
 */
export function createTianguisIcon(zoom, tianguis) {
  const categoria = categoriaDeTianguis(tianguis);
  const size = tianguisIconSize(zoom);
  const cacheKey = `${categoria.id}|${size}`;
  const cached = iconCache.get(cacheKey);
  if (cached) return cached;

  const drawnWidth = Math.round(IMAGE_ASPECT > 1 ? size / IMAGE_ASPECT : size);
  const drawnHeight = Math.round(IMAGE_ASPECT > 1 ? size : size * IMAGE_ASPECT);

  const icon = L.divIcon({
    className: `tianguis-icon tianguis-icon--${categoria.id.toLowerCase()}`,
    html: `<img class="tianguis-icon-img" src="${imagenDeCategoria(categoria)}" width="${drawnWidth}" height="${drawnHeight}" style="width:${drawnWidth}px;height:${drawnHeight}px" alt="" draggable="false" />`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });

  iconCache.set(cacheKey, icon);
  return icon;
}
