import { API_ROUTES } from '@mapatianguis/contracts';
import { requestJson } from '../../shared/http.js';

/** @returns {Promise<import('@mapatianguis/contracts/commerce').CommerceDirectory>} */
export function fetchCommerceDirectory() {
  return requestJson(API_ROUTES.commerce.directory);
}

/**
 * Directorio de comercios que aceptan vales Mercomuna. Se pide aparte porque la
 * capa es opcional: mientras el chip está apagado no se descarga.
 * @returns {Promise<import('@mapatianguis/contracts/commerce').MercomunaDirectory>}
 */
export function fetchMercomuna() {
  return requestJson(API_ROUTES.commerce.mercomuna);
}
