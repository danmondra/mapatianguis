import { readData } from '../../data/store.js';

/** @returns {Promise<import('@mapatianguis/contracts/mobility').MetroStation[]>} */
export function getMetroStations() {
  return readData('mobility/metro-stations.json');
}

/** @returns {Promise<import('@mapatianguis/contracts/mobility').MetrobusStation[]>} */
export function getMetrobusStations() {
  return readData('mobility/metrobus-stations.json');
}

/** @returns {Promise<import('@mapatianguis/contracts/mobility').MobilityNetwork>} */
export async function getMobilityNetwork() {
  const [metroStations, metrobusStations] = await Promise.all([
    getMetroStations(),
    getMetrobusStations()
  ]);
  return { metroStations, metrobusStations };
}
