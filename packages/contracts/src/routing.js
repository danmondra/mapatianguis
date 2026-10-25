/**
 * Contrato del dominio Ruteo.
 *
 * @typedef {Object} RoutePoint
 * @property {number} lat
 * @property {number} lon
 * @property {string} [label]
 *
 * @typedef {Object} RouteLeg
 * @property {'walk'|'transit'} mode
 * @property {string} color
 * @property {boolean} dashed
 * @property {number} weight
 * @property {string} popup
 * @property {RoutePoint[]} points
 *
 * @typedef {Object} RouteStep
 * @property {string} icon
 * @property {string} text
 * @property {string} [html] Texto enriquecido con las mismas palabras que `text`.
 *
 * @typedef {Object} RoutePlan
 * @property {string} title
 * @property {string} originLabel
 * @property {string} destinationLabel
 * @property {[number, number]} estimatedMinutes
 * @property {number} fareMxn
 * @property {number} co2SavedKg
 * @property {RouteStep[]} steps
 * @property {RouteLeg[]} legs
 * @property {RoutePoint[]} bounds
 */

/** @param {number} fare */
export function formatFare(fare) {
  return `$${Number(fare).toFixed(2)} MXN`;
}
