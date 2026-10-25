import { API_ROUTES } from '@mapatianguis/contracts';
import { postJson } from '../../shared/http.js';

/**
 * @param {{
 *   from?: string,
 *   to?: string,
 *   coordinates?: { lat: number, lon: number },
 *   destination?: { lat: number, lon: number, label?: string }
 * }} input
 * @returns {Promise<import('@mapatianguis/contracts/routing').RoutePlan>}
 */
export function fetchRoutePlan(input) {
  return postJson(API_ROUTES.routing.plan, input);
}
