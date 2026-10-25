import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT, 'data');

/** @type {Map<string, Promise<unknown>>} */
const cache = new Map();

/**
 * Lee un JSON de data/ y lo cachea durante la vida del proceso.
 * @template T
 * @param {string} relativePath
 * @returns {Promise<T>}
 */
export function readData(relativePath) {
  if (!cache.has(relativePath)) {
    const target = path.join(DATA_DIR, relativePath);
    const pending = readFile(target, 'utf8').then((contents) => JSON.parse(contents));
    cache.set(relativePath, pending);
    pending.catch(() => cache.delete(relativePath));
  }
  return /** @type {Promise<T>} */ (cache.get(relativePath));
}

export function clearDataCache() {
  cache.clear();
}
