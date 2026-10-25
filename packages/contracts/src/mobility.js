/**
 * Contrato del dominio Movilidad Integrada.
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
 * Estaciones más cercanas a un punto, para dar contexto sin navegación.
 * @template {{ lat: number, lon: number }} T
 * @param {T[]} stations
 * @param {number} lat
 * @param {number} lon
 * @param {{ limit?: number, maxDistanceMeters?: number }} [options]
 * @returns {{ station: T, distanceMeters: number }[]}
 */
export function findNearbyStations(
  stations,
  lat,
  lon,
  { limit = 2, maxDistanceMeters = 1000 } = {}
) {
  return stations
    .map((station) => ({
      station,
      distanceMeters: getDistanceMeters(lat, lon, station.lat, station.lon)
    }))
    .filter(({ distanceMeters }) => distanceMeters <= maxDistanceMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}
