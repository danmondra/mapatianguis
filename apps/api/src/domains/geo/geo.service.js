import { readData } from '../../data/store.js';

/** @returns {Promise<import('@mapatianguis/contracts/geo').GeoFeatureCollection>} */
export function getAlcaldias() {
  return readData('geo/alcaldias.json');
}

/** @returns {Promise<import('@mapatianguis/contracts/geo').GeoFeatureCollection>} */
export function getZmvm() {
  return readData('geo/zmvm.json');
}
