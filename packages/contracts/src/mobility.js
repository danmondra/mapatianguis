/**
 * Contrato del dominio Movilidad Integrada.
 *
 * @typedef {Object} TransportProperties
 * @property {string} agency
 * @property {string} agency_name
 * @property {string} route_id
 * @property {string} route_short
 * @property {string} route_long
 * @property {string} headsign
 * @property {string} color
 * @property {number} weight
 * @property {number} opacity
 *
 * @typedef {Object} TransportFeature
 * @property {'Feature'} type
 * @property {TransportProperties} properties
 * @property {{ type: 'LineString', coordinates: number[][] }} geometry
 *
 * @typedef {Object} TransportLayer
 * @property {string} name
 * @property {string} color
 * @property {TransportFeature[]} features
 *
 * @typedef {Record<string, TransportLayer>} TransportNetwork
 *
 * @typedef {Object} MetroStation
 * @property {string} nombre
 * @property {string} linea
 * @property {string} color
 * @property {string} icon_class
 * @property {string} tipo
 * @property {string} alcaldia
 * @property {number} lat
 * @property {number} lon
 * @property {boolean} has_glyph
 *
 * @typedef {Object} MetrobusStation
 * @property {string} nombre
 * @property {string} linea
 * @property {string} alcaldia
 * @property {number} lat
 * @property {number} lon
 *
 * @typedef {Object} MobilityNetwork
 * @property {TransportNetwork} transport
 * @property {MetroStation[]} metroStations
 * @property {MetrobusStation[]} metrobusStations
 */

export const EARTH_RADIUS_METERS = 6371000;

/** @param {number} value */
function radians(value) {
  return (value * Math.PI) / 180;
}

/**
 * Distancia ortodrómica en metros.
 * @param {number} lat1 @param {number} lon1 @param {number} lat2 @param {number} lon2
 * @returns {number}
 */
export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const phi1 = radians(lat1);
  const phi2 = radians(lat2);
  const deltaPhi = radians(lat2 - lat1);
  const deltaLambda = radians(lon2 - lon1);
  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * @param {MetroStation[]} stations
 * @param {number} lat
 * @param {number} lon
 * @returns {MetroStation|null}
 */
export function findClosestMetro(stations, lat, lon) {
  let nearest = null;
  let minDistance = Number.POSITIVE_INFINITY;
  for (const station of stations) {
    const distance = getDistanceMeters(lat, lon, station.lat, station.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = station;
    }
  }
  return nearest;
}

/**
 * Tarifa mostrada en la ficha de detalle de una ruta.
 * @param {string} agency
 * @returns {string}
 */
export function fareLabel(agency) {
  if (agency === 'METRO') return '$5.00';
  if (agency === 'MB') return '$6.00';
  if (agency === 'CC') return 'Por tramo';
  return '$2.00-$4.00';
}

/**
 * Forma de pago mostrada en la ficha de detalle de una ruta.
 * @param {string} agency
 * @returns {string}
 */
export function paymentLabel(agency) {
  return agency === 'CC' ? 'Efectivo / Mi' : 'Tarjeta MI';
}
