import { API_ROUTES } from '@mapatianguis/contracts';
import { requestJson } from '../../shared/http.js';

/** @returns {Promise<import('@mapatianguis/contracts/commerce').CommerceDirectory>} */
export function fetchCommerceDirectory() {
  return requestJson(API_ROUTES.commerce.directory);
}
