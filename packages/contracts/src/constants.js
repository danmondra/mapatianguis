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
    mercados: `${API_PREFIX}/commerce/mercados`,
    msr: `${API_PREFIX}/commerce/msr`,
    tianguis: `${API_PREFIX}/commerce/tianguis`
  },
  mobility: {
    network: `${API_PREFIX}/mobility/network`,
    metroStations: `${API_PREFIX}/mobility/stations/metro`,
    metrobusStations: `${API_PREFIX}/mobility/stations/metrobus`
  },
  routing: {
    plan: `${API_PREFIX}/routing/plan`
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

export const AGENCIES = Object.freeze(['METRO', 'MB', 'TROLE', 'CBB', 'RTP', 'TL', 'CC']);

export const AGENCY_LABELS = Object.freeze({
  METRO: 'Metro (Líneas 1-12)',
  MB: 'Metrobús (L1-L7)',
  TROLE: 'Trolebús',
  CBB: 'Cablebús',
  RTP: 'RTP Pasajeros',
  TL: 'Tren Ligero',
  CC: 'Corredores Concesionados'
});

export const AGENCY_BADGES = Object.freeze({
  METRO: { text: 'M', color: '#ef4444' },
  MB: { text: 'MB', color: '#ec4899' },
  TROLE: { text: 'TE', color: '#10b981' },
  CBB: { text: 'CB', color: '#06b6d4' },
  RTP: { text: 'RTP', color: '#15803d' },
  TL: { text: 'TL', color: '#3b82f6' },
  CC: { text: 'CC', color: '#8e24aa' }
});

export const RTPONKY_URL = 'https://rtponky.lat/';

export const LAYER_KEYS = Object.freeze([
  'zmvm',
  'alcaldias',
  'metro',
  'metrobus',
  'trolebus',
  'cablebus',
  'rtp',
  'tren',
  'concesionado',
  'metro_icons',
  'metrobus_icons',
  'mercados',
  'tianguis',
  'msr'
]);

export const DEFAULT_LAYER_VISIBILITY = Object.freeze({
  zmvm: true,
  alcaldias: true,
  metro: true,
  metrobus: true,
  trolebus: true,
  cablebus: true,
  rtp: true,
  tren: true,
  concesionado: true,
  metro_icons: true,
  metrobus_icons: true,
  mercados: true,
  tianguis: true,
  msr: true
});

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
