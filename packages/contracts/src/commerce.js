/**
 * Contrato del dominio Comercio Popular.
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
 * @property {MercadoSobreRuedas[]} msr
 * @property {Tianguis[]} tianguis
 *
 * @typedef {Object} ComercioMercomuna
 * @property {string} id
 * @property {string} nombre
 * @property {string} giro Giro declarado en el directorio Mercomuna.
 * @property {string | null} categoria Categoría SCIAN de alimentos; null si no lo es.
 * @property {boolean} alimentos
 * @property {string} calle
 * @property {string | null} cp
 * @property {string} alcaldia
 * @property {number | null} lat
 * @property {number | null} lon
 * @property {'exacta'|'cp'|'sin_ubicacion'} precision
 * @property {boolean} imprecisa true cuando la coordenada es el centroide de su CP.
 * @property {string | null} idsEstrato
 * @property {true} aceptaVales
 * @property {string} vigenteHasta Fecha límite de uso de los vales (AAAA-MM-DD).
 *
 * @typedef {Object} ComercioMercomunaPorCp
 * @property {string} cp
 * @property {number} lat
 * @property {number} lon
 * @property {string} alcaldia
 * @property {number} comercios
 * @property {number} comerciosAlimentos
 * @property {string[]} categorias
 *
 * @typedef {Object} MercomunaResumen
 * @property {number} total
 * @property {number} alimentos
 * @property {number} noAlimentos
 * @property {number} conCoordenada
 * @property {number} precisos
 * @property {number} aproximados
 * @property {number} sinUbicacion
 * @property {number} porCp
 * @property {Record<string, number>} porPrecision
 * @property {{ alcaldia: string, total: number }[]} porAlcaldia
 * @property {{ giro: string, total: number }[]} porGiro
 *
 * @typedef {Object} MercomunaDirectory
 * @property {string[]} fuentes
 * @property {string} nota
 * @property {string} vigenteHasta
 * @property {MercomunaResumen} resumen
 * @property {ComercioMercomuna[]} comercios
 * @property {ComercioMercomunaPorCp[]} porCp
 */

import { matchesDay, normalizeText } from './constants.js';

export const MERCOMUNA_PRECISIONS = Object.freeze(['exacta', 'cp', 'sin_ubicacion']);

/** Texto para explicar por qué un comercio no se dibuja como chincheta. */
export const MERCOMUNA_PRECISION_LABEL = Object.freeze({
  exacta: 'Ubicación exacta',
  cp: 'Solo se conoce el código postal',
  sin_ubicacion: 'Sin ubicación publicada'
});

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
 * Filtra el directorio Mercomuna por texto y, opcionalmente, solo alimentos.
 * @param {ComercioMercomuna[]} comercios
 * @param {{ q?: string, alimentos?: boolean }} [filters]
 * @returns {ComercioMercomuna[]}
 */
export function filterMercomuna(comercios, filters = {}) {
  const query = normalizeText(filters.q);
  return comercios.filter((item) => {
    if (filters.alimentos && !item.alimentos) return false;
    if (!query) return true;
    return (
      normalizeText(item.nombre).includes(query) ||
      normalizeText(item.giro).includes(query) ||
      normalizeText(item.categoria).includes(query) ||
      normalizeText(item.calle).includes(query) ||
      normalizeText(item.alcaldia).includes(query) ||
      String(item.cp ?? '').includes(query)
    );
  });
}

