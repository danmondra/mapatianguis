import { filterTianguis } from '@mapatianguis/contracts/commerce';
import { readData } from '../../data/store.js';

/**
 * El manifiesto de fotos se genera con `npm run import:photos`. Si todavía no
 * existe, el mapa funciona igual: cada tianguis queda con `fotos: null`.
 * @returns {Promise<Record<string, any>>}
 */
async function getPhotoIndex() {
  try {
    const manifest = await readData('commerce/photos.json');
    return manifest?.photos ?? {};
  } catch {
    return {};
  }
}

/**
 * Adjunta el índice del directorio y sus fotos a cada tianguis. El índice es
 * la llave estable con la carpeta `fotos/0002`: no depende del orden en que
 * el cliente recorra el arreglo.
 * @param {any[]} tianguis
 * @returns {Promise<any[]>}
 */
async function withPhotos(tianguis) {
  const photoIndex = await getPhotoIndex();
  return tianguis.map((item, index) => ({
    ...item,
    idx: index,
    fotos: photoIndex[index] ?? photoIndex[String(index)] ?? null
  }));
}

/** @returns {Promise<import('@mapatianguis/contracts/commerce').CommerceDirectory>} */
export async function getDirectory() {
  return { tianguis: await withPhotos(await readData('commerce/tianguis.json')) };
}

/** @returns {Promise<import('@mapatianguis/contracts/commerce').Tianguis[]>} */
export async function getTianguis() {
  return withPhotos(await readData('commerce/tianguis.json'));
}

/**
 * @param {import('@mapatianguis/contracts/commerce').CommerceFilters} [filters]
 * @returns {Promise<import('@mapatianguis/contracts/commerce').Tianguis[]>}
 */
export async function searchTianguis(filters) {
  return filterTianguis(await getTianguis(), filters);
}
