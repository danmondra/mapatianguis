/**
 * Constantes compartidas por API y cliente.
 * Los nombres de ruta son el contrato de transporte: si cambian, cambian aquí.
 */

export const API_PREFIX = '/api/v1';

export const API_ROUTES = Object.freeze({
  health: `${API_PREFIX}/health`,
  meta: `${API_PREFIX}/meta`,
  geo: {
    alcaldias: `${API_PREFIX}/geo/alcaldias`,
    zmvm: `${API_PREFIX}/geo/zmvm`
  },
  commerce: {
    directory: `${API_PREFIX}/commerce/directory`,
    tianguis: `${API_PREFIX}/commerce/tianguis`
  },
  feedback: {
    events: `${API_PREFIX}/feedback`,
    summary: `${API_PREFIX}/feedback/summary`
  },
  mobility: {
    network: `${API_PREFIX}/mobility/network`,
    metroStations: `${API_PREFIX}/mobility/stations/metro`,
    metrobusStations: `${API_PREFIX}/mobility/stations/metrobus`
  }
});

export const MAP_CENTER = Object.freeze({ lat: 19.4326, lng: -99.1332 });
export const MAP_DEFAULT_ZOOM = 12;
export const MAP_MIN_ZOOM = 9;
export const MAP_MAX_ZOOM = 18;

export const DAY_NAMES = Object.freeze([
  'DOMINGO',
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO'
]);

/** Semana en orden de calendario, de lunes a domingo. */
export const WEEK_DAYS = Object.freeze([
  { value: 'LUNES', short: 'Lun', label: 'Lunes' },
  { value: 'MARTES', short: 'Mar', label: 'Martes' },
  { value: 'MIERCOLES', short: 'Mié', label: 'Miércoles' },
  { value: 'JUEVES', short: 'Jue', label: 'Jueves' },
  { value: 'VIERNES', short: 'Vie', label: 'Viernes' },
  { value: 'SABADO', short: 'Sáb', label: 'Sábado' },
  { value: 'DOMINGO', short: 'Dom', label: 'Domingo' }
]);

export const LAYER_KEYS = Object.freeze([
  'zmvm',
  'alcaldias',
  'metro_icons',
  'metrobus_icons',
  'tianguis'
]);

/**
 * Visibilidad inicial de las capas del mapa.
 */
export const DEFAULT_LAYER_VISIBILITY = Object.freeze({
  zmvm: true,
  alcaldias: true,
  metro_icons: true,
  metrobus_icons: true,
  tianguis: true
});

/** Zoom mínimo para dibujar las estaciones de transporte. */
export const STATION_MIN_ZOOM = 14;

/**
 * @param {string} value
 * @returns {string}
 */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * @param {unknown} value
 * @param {string} day
 * @returns {boolean}
 */
export function matchesDay(value, day) {
  const expected = normalizeText(day);
  if (!expected) return true;
  return normalizeText(value).includes(expected);
}

/**
 * Día canónico (sin acentos, mayúsculas) para una fecha local.
 * @param {Date} [date]
 * @returns {string}
 */
export function getTodayName(date = new Date()) {
  return DAY_NAMES[date.getDay()];
}
