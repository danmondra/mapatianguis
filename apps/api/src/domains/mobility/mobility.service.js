import { readData } from '../../data/store.js';

/** @returns {Promise<import('@mapatianguis/contracts/mobility').TransportNetwork>} */
export function getTransportNetwork() {
  return readData('mobility/transport.json');
}

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
  const [transport, metroStations, metrobusStations] = await Promise.all([
    getTransportNetwork(),
    getMetroStations(),
    getMetrobusStations()
  ]);
  return { transport, metroStations, metrobusStations };
}
