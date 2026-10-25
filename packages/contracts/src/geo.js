/**
 * Contrato del dominio Cartografía.
 *
 * @typedef {Object} GeoFeature
 * @property {'Feature'} type
 * @property {Record<string, unknown>} properties
 * @property {{ type: string, coordinates: unknown }} geometry
 *
 * @typedef {Object} GeoFeatureCollection
 * @property {'FeatureCollection'} type
 * @property {GeoFeature[]} features
 *
 * @typedef {Object} GeoLayers
 * @property {GeoFeatureCollection} alcaldias
 * @property {GeoFeatureCollection} zmvm
 */

/**
 * @param {GeoFeature} feature
 * @returns {string}
 */
export function featureLabel(feature) {
  const properties = feature?.properties ?? {};
  return (
    /** @type {string} */ (properties.nomgeo) ||
    /** @type {string} */ (properties.alcaldia) ||
    /** @type {string} */ (properties.NOMGEO) ||
    'CDMX'
  );
}
