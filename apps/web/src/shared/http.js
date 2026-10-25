/**
 * Cliente HTTP mínimo. Todas las slices consumen la API por aquí.
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json();
      detail = payload?.error ? `: ${payload.error}` : '';
    } catch {
      // El cuerpo no era JSON; se conserva el status.
    }
    throw new Error(`Error ${response.status}${detail}`);
  }

  return response.json();
}

/**
 * @param {string} path
 * @param {unknown} body
 * @returns {Promise<any>}
 */
export function postJson(path, body) {
  return requestJson(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
