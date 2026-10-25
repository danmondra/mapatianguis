/**
 * Contrato del dominio Comercio Popular.
 *
 * @typedef {Object} Mercado
 * @property {string} nombre
 * @property {string} numero
 * @property {string} alcaldia
 * @property {string} colonia
 * @property {number} locales
 * @property {number} superficie_m2
 * @property {string} categoria
 * @property {number} radio
 * @property {string} giro
 * @property {number} lat
 * @property {number} lon
 *
 * @typedef {Object} MercadoSobreRuedas
 * @property {string} ruta
 * @property {string} dia
 * @property {number} oferentes
 * @property {string} direccion
 * @property {string} alcaldia
 * @property {string} colonia
 * @property {number} lat
 * @property {number} lon
 * @property {number} radio
 *
 * @typedef {Object} Tianguis
 * @property {string} alcaldia
 * @property {string} colonia
 * @property {string} ubicacion
 * @property {string} dia
 * @property {string} horario
 * @property {number} lat
 * @property {number} lon
 *
 * @typedef {Object} CommerceDirectory
 * @property {Mercado[]} mercados
 * @property {MercadoSobreRuedas[]} msr
 * @property {Tianguis[]} tianguis
 */

import { matchesDay, normalizeText } from './constants.js';

/** @param {Partial<Mercado>} mercado */
export function isMercado(mercado) {
  return Number.isFinite(mercado?.lat) && Number.isFinite(mercado?.lon);
}

/** @param {Tianguis} tianguis @param {string} day */
export function tianguisMatchesDay(tianguis, day) {
  return matchesDay(tianguis?.dia, day);
}

/**
 * @param {Tianguis[]} tianguis
 * @param {{ day?: string, alcaldia?: string, q?: string }} [filters]
 * @returns {Tianguis[]}
 */
export function filterTianguis(tianguis, filters = {}) {
  const query = normalizeText(filters.q);
  return tianguis.filter((item) => {
    if (filters.day && !tianguisMatchesDay(item, filters.day)) return false;
    if (filters.alcaldia && normalizeText(item.alcaldia) !== normalizeText(filters.alcaldia)) {
      return false;
    }
    if (!query) return true;
    return (
      normalizeText(item.colonia).includes(query) ||
      normalizeText(item.alcaldia).includes(query) ||
      normalizeText(item.ubicacion).includes(query)
    );
  });
}

/**
 * @param {Mercado[]} mercados
 * @param {string} query
 * @returns {Mercado|undefined}
 */
export function findMercado(mercados, query) {
  const needle = normalizeText(query).replace(/^mercado\s+/, '');
  if (!needle) return undefined;

  const scored = mercados
    .map((mercado) => {
      const name = normalizeText(mercado.nombre);
      let score = 0;
      if (name === needle) score = 3;
      else if (name.startsWith(needle)) score = 2;
      else if (name.includes(needle) || needle.includes(name)) score = 1;
      return { mercado, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.mercado;
}

/** @param {number} value */
export function formatSurface(value) {
  return Number(value) > 0 ? `${Number(value).toLocaleString('es-MX')} m²` : 'N/D';
}
