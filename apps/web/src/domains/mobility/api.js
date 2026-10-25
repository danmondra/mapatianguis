import { API_ROUTES } from '@mapatianguis/contracts';
import { requestJson } from '../../shared/http.js';

/** @returns {Promise<import('@mapatianguis/contracts/mobility').MobilityNetwork>} */
export function fetchMobilityNetwork() {
  return requestJson(API_ROUTES.mobility.network);
}
