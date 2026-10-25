import { API_ROUTES } from '@mapatianguis/contracts';
import { requestJson } from '../../shared/http.js';

/** @returns {Promise<import('@mapatianguis/contracts/geo').GeoLayers>} */
export async function fetchGeoLayers() {
  const [alcaldias, zmvm] = await Promise.all([
    requestJson(API_ROUTES.geo.alcaldias),
    requestJson(API_ROUTES.geo.zmvm)
  ]);
  return { alcaldias, zmvm };
}
