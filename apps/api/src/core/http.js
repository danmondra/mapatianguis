export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   */
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/**
 * Envuelve handlers async para que Express reciba los errores.
 * @template {import('express').RequestHandler} T
 * @param {T} handler
 * @returns {import('express').RequestHandler}
 */
export function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
