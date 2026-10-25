import { filterMercomuna, filterTianguis } from '@mapatianguis/contracts/commerce';
import { readData } from '../../data/store.js';

/** @returns {Promise<import('@mapatianguis/contracts/commerce').CommerceDirectory>} */
export async function getDirectory() {
  const [msr, tianguis] = await Promise.all([
    readData('commerce/msr.json'),
    readData('commerce/tianguis.json')
  ]);
  return { msr, tianguis };
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

/** Directorio completo de comercios que aceptan vales Mercomuna. */
/** @returns {Promise<import('@mapatianguis/contracts/commerce').MercomunaDirectory>} */
export function getMercomuna() {
  return readData('commerce/mercomuna.json');
}

/**
 * @param {{ q?: string, alimentos?: boolean }} [filters]
 * @returns {Promise<import('@mapatianguis/contracts/commerce').MercomunaDirectory>}
 */
export async function searchMercomuna(filters = {}) {
  const directory = await getMercomuna();
  const comercios = filterMercomuna(directory.comercios, filters);
  const visibles = new Set(
    comercios.filter((item) => item.precision === 'cp').map((item) => item.cp)
  );
  return {
    ...directory,
    comercios,
    porCp: directory.porCp.filter((entry) => visibles.has(entry.cp))
  };
}

