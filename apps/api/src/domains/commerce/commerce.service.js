import { filterTianguis, findMercado } from '@mapatianguis/contracts/commerce';
import { normalizeText } from '@mapatianguis/contracts';
import { readData } from '../../data/store.js';

/** @returns {Promise<import('@mapatianguis/contracts/commerce').CommerceDirectory>} */
export async function getDirectory() {
  const [mercados, msr, tianguis] = await Promise.all([
    readData('commerce/mercados.json'),
    readData('commerce/msr.json'),
    readData('commerce/tianguis.json')
  ]);
  return { mercados, msr, tianguis };
}

/** @returns {Promise<import('@mapatianguis/contracts/commerce').Mercado[]>} */
export function getMercados() {
  return readData('commerce/mercados.json');
}

/** @returns {Promise<import('@mapatianguis/contracts/commerce').MercadoSobreRuedas[]>} */
export function getMsr() {
  return readData('commerce/msr.json');
}

/** @returns {Promise<import('@mapatianguis/contracts/commerce').Tianguis[]>} */
export function getTianguis() {
  return readData('commerce/tianguis.json');
}

/**
 * @param {{ day?: string, alcaldia?: string, q?: string }} [filters]
 * @returns {Promise<import('@mapatianguis/contracts/commerce').Tianguis[]>}
 */
export async function searchTianguis(filters) {
  return filterTianguis(await getTianguis(), filters);
}

/**
 * @param {{ q?: string, alcaldia?: string }} [filters]
 * @returns {Promise<import('@mapatianguis/contracts/commerce').Mercado[]>}
 */
export async function searchMercados(filters = {}) {
  const mercados = await getMercados();
  const query = normalizeText(filters.q);
  return mercados.filter((mercado) => {
    if (filters.alcaldia && normalizeText(mercado.alcaldia) !== normalizeText(filters.alcaldia)) {
      return false;
    }
    if (!query) return true;
    return (
      normalizeText(mercado.nombre).includes(query) ||
      normalizeText(mercado.colonia).includes(query) ||
      normalizeText(mercado.alcaldia).includes(query)
    );
  });
}

/**
 * @param {string} query
 * @returns {Promise<import('@mapatianguis/contracts/commerce').Mercado|undefined>}
 */
export async function findMercadoByName(query) {
  return findMercado(await getMercados(), query);
}
