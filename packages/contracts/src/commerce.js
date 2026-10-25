/**
 * Contrato del dominio Comercio Popular.
 *
 * @typedef {Object} Tianguis
 * @property {string} alcaldia
 * @property {string} colonia
 * @property {string} ubicacion
 * @property {string} dia
 * @property {string} horario
 * @property {number} lat
 * @property {number} lon
 * @property {string} [giro] Texto original del directorio, sin normalizar.
 * @property {string[]} [categorias] Ids del catálogo de giros, el principal primero.
 * @property {boolean} [sinGiro] El directorio no declara giro para este tianguis.
 *
 * @typedef {Object} Vialidad
 * @property {string} id
 * @property {string} nombre
 * @property {string[]} alias Formas en que el directorio escribe la vialidad.
 *
 * @typedef {Object} CommerceDirectory
 * @property {Tianguis[]} tianguis
 *
 * @typedef {Object} CommerceFilters
 * @property {string} [q] Texto libre: calle, colonia, alcaldía, giro, día o vialidad.
 * @property {string} [day]
 * @property {string} [alcaldia]
 * @property {string} [colonia]
 * @property {string} [direccion] Tramo exacto de `ubicacion`.
 * @property {string | string[]} [giro] Id(s) del catálogo de giros.
 * @property {string | string[]} [vialidad] Id(s) de `VIALIDADES`.
 *
 * @typedef {Object} CommerceSearchOptions
 * @property {number} total Resultados con todos los filtros aplicados.
 * @property {number} dayTotal Resultados sin el filtro de día.
 * @property {number} giroTotal Resultados sin el filtro de giro.
 * @property {number} vialidadTotal Resultados sin el filtro de vialidad.
 * @property {number} direccionTotal Resultados sin el filtro de dirección.
 * @property {number} coloniaTotal Resultados sin el filtro de colonia.
 * @property {number} alcaldiaTotal Resultados sin el filtro de alcaldía.
 * @property {{ value: string, count: number }[]} days
 * @property {{ value: string, count: number }[]} giros
 * @property {{ value: string, count: number }[]} vialidades
 * @property {{ value: string, count: number }[]} direcciones
 * @property {{ value: string, count: number }[]} colonias
 * @property {{ value: string, count: number }[]} alcaldias
 */

import { matchesDay, normalizeText, WEEK_DAYS } from './constants.js';
import { categoriaDeTianguis, categoriaPorId, TODAS_LAS_CATEGORIAS } from './giros.js';

/**
 * Tipos de vialidad presentes en `ubicacion`. El orden es el de la lista que
 * ve el usuario; los alias resuelven las abreviaturas del directorio.
 * @type {readonly Vialidad[]}
 */
export const VIALIDADES = Object.freeze([
  { id: 'AVENIDA', nombre: 'Avenida', alias: ['AVENIDA', 'AV.', 'AV'] },
  { id: 'CALLE', nombre: 'Calle', alias: ['CALLE'] },
  { id: 'CALZADA', nombre: 'Calzada', alias: ['CALZADA', 'CALZ.', 'CALZ'] },
  { id: 'EJE', nombre: 'Eje vial', alias: ['EJE'] },
  { id: 'CERRADA', nombre: 'Cerrada', alias: ['CERRADA', 'CDA.', 'CDA'] },
  { id: 'PROLONGACION', nombre: 'Prolongación', alias: ['PROLONGACIÓN', 'PROLONGACION', 'PROL.', 'PROL'] },
  { id: 'BOULEVARD', nombre: 'Boulevard', alias: ['BOULEVARD', 'BOULEVAR', 'BLVD.', 'BLVD'] },
  { id: 'CARRETERA', nombre: 'Carretera', alias: ['CARRETERA'] },
  { id: 'CAMINO', nombre: 'Camino', alias: ['CAMINO'] },
  { id: 'ANDADOR', nombre: 'Andador', alias: ['ANDADOR'] },
  { id: 'CALLEJON', nombre: 'Callejón', alias: ['CALLEJÓN', 'CALLEJON'] },
  { id: 'PRIVADA', nombre: 'Privada', alias: ['PRIVADA'] },
  { id: 'PASEO', nombre: 'Paseo o pasaje', alias: ['PASEO', 'PASAJE'] },
  { id: 'PLAZA', nombre: 'Plaza o plazuela', alias: ['PLAZUELA', 'PLAZA'] },
  { id: 'EXPLANADA', nombre: 'Explanada', alias: ['EXPLANADA'] },
  { id: 'CIRCUITO', nombre: 'Circuito', alias: ['CIRCUITO'] },
  { id: 'DIAGONAL', nombre: 'Diagonal', alias: ['DIAGONAL'] },
  { id: 'RETORNO', nombre: 'Retorno', alias: ['RETORNO'] },
  { id: 'PERIFERICO', nombre: 'Periférico', alias: ['PERIFÉRICO', 'PERIFERICO'] },
  { id: 'VIADUCTO', nombre: 'Viaducto', alias: ['VIADUCTO'] },
  { id: 'PARQUE', nombre: 'Parque o jardín', alias: ['PARQUE', 'JARDÍN', 'JARDIN'] },
  { id: 'AUTOPISTA', nombre: 'Autopista', alias: ['AUTOPISTA'] },
  { id: 'SIN_TIPO', nombre: 'Sin tipo declarado', alias: [] }
]);

const VIALIDAD_POR_ID = new Map(VIALIDADES.map((vialidad) => [vialidad.id, vialidad]));

// Los alias más largos se prueban primero para que "CALLEJÓN" no se lea como
// "CALLE" y "PLAZUELA" no se lea como "PLAZA".
const PATRONES_VIALIDAD = VIALIDADES.flatMap((vialidad) =>
  vialidad.alias.map((alias) => ({
    id: vialidad.id,
    patron: new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(normalizeText(alias))}(?![a-z0-9])`
    )
  }))
).sort((a, b) => b.patron.source.length - a.patron.source.length);

// "CALLE 6 ENTRE AV. X Y AV. Y": sólo el tramo antes de "ENTRE", "ESQ." o la
// coma describe la vialidad principal. Lo que sigue son las calles que cruzan.
const SEPARADOR_TRAMO = /\b(?:entre|ent|esq|esquina)\b|,/;

/** @param {string} value */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @param {string} value */
function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/** @param {string} value @returns {string | null} */
function encontrarVialidad(value) {
  for (const { id, patron } of PATRONES_VIALIDAD) {
    if (patron.test(value)) return id;
  }
  return null;
}

/**
 * Vialidad principal de un tianguis a partir del tramo de calle declarado.
 * El directorio suele omitir "CALLE": cuando no hay prefijo se asume calle,
 * que es el caso de 1,024 de los 1,367 registros.
 *
 * @param {Tianguis} tianguis
 * @returns {string}
 */
export function vialidadDeTianguis(tianguis) {
  const ubicacion = normalizeText(tianguis?.ubicacion);
  if (!ubicacion) return 'SIN_TIPO';

  const [tramo] = ubicacion.split(SEPARADOR_TRAMO);
  const principal = tramo.trim();
  const enTramo = encontrarVialidad(principal);
  if (enTramo) return enTramo;

  // Sin "ENTRE" ni esquina, toda la ubicación es un solo tramo: ahí sí vale
  // buscar el tipo en cualquier posición ("PONIENTE 85 Y AV. OBSERVATORIO").
  if (principal === ubicacion) return encontrarVialidad(ubicacion) ?? 'CALLE';

  return 'CALLE';
}

/** @param {string} id @returns {Vialidad} */
export function vialidadPorId(id) {
  return VIALIDAD_POR_ID.get(id) ?? VIALIDAD_POR_ID.get('SIN_TIPO');
}

/**
 * Texto contra el que se resuelve la búsqueda libre. Se cachea por objeto
 * porque el directorio se carga una vez y `q` cambia en cada tecla.
 * @type {WeakMap<Tianguis, { texto: string, vialidad: string, giro: string }>}
 */
const DERIVADOS = new WeakMap();

/** @param {Tianguis} tianguis */
function derivadosDe(tianguis) {
  let derivados = DERIVADOS.get(tianguis);
  if (derivados) return derivados;

  const vialidad = vialidadDeTianguis(tianguis);
  const giro = categoriaDeTianguis(tianguis).id;
  const nombresDeGiro = (tianguis.categorias ?? [])
    .map((id) => categoriaPorId(id).nombre)
    .join(' ');
  const texto = normalizeText(
    [
      tianguis.alcaldia,
      tianguis.colonia,
      tianguis.ubicacion,
      tianguis.dia,
      tianguis.giro,
      nombresDeGiro,
      vialidadPorId(vialidad).nombre
    ].join(' ')
  );

  derivados = { texto, vialidad, giro };
  DERIVADOS.set(tianguis, derivados);
  return derivados;
}

/** @param {Tianguis} tianguis @param {string} day */
export function tianguisMatchesDay(tianguis, day) {
  return matchesDay(tianguis?.dia, day);
}

/**
 * ¿Este tianguis pasa todos los filtros? Lo usan tanto el buscador como la
 * capa del mapa, para que el conteo y lo dibujado no puedan discrepar.
 *
 * @param {Tianguis} tianguis
 * @param {CommerceFilters} [filters]
 * @returns {boolean}
 */
export function tianguisMatchesFilters(tianguis, filters = {}) {
  if (filters.day && !tianguisMatchesDay(tianguis, filters.day)) return false;
  if (filters.alcaldia && normalizeText(tianguis.alcaldia) !== normalizeText(filters.alcaldia)) {
    return false;
  }
  if (filters.colonia && normalizeText(tianguis.colonia) !== normalizeText(filters.colonia)) {
    return false;
  }
  if (filters.direccion && normalizeText(tianguis.ubicacion) !== normalizeText(filters.direccion)) {
    return false;
  }

  const derivados = derivadosDe(tianguis);

  if (filters.vialidad) {
    const esperadas = asArray(filters.vialidad).map((id) => normalizeText(id));
    if (!esperadas.includes(normalizeText(derivados.vialidad))) return false;
  }

  if (filters.giro) {
    const esperados = asArray(filters.giro);
    if (!esperados.includes(derivados.giro)) return false;
  }

  const tokens = normalizeText(filters.q).split(/\s+/).filter(Boolean);
  if (tokens.length > 0 && !tokens.every((token) => derivados.texto.includes(token))) {
    return false;
  }

  return true;
}

/**
 * @param {Tianguis[]} tianguis
 * @param {CommerceFilters} [filters]
 * @returns {Tianguis[]}
 */
export function filterTianguis(tianguis, filters = {}) {
  return tianguis.filter((item) => tianguisMatchesFilters(item, filters));
}

/** @param {CommerceFilters} filters @param {keyof CommerceFilters} key */
function sinFiltro(filters, key) {
  const next = { ...filters };
  delete next[key];
  return next;
}

/**
 * Cuenta valores únicos conservando el texto original del directorio.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string | string[] | null | undefined} valueOf
 * @returns {Map<string, number>}
 */
function contar(items, valueOf) {
  const counts = new Map();
  for (const item of items) {
    for (const value of asArray(valueOf(item))) {
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

/** @param {Map<string, number>} counts @returns {{ value: string, count: number }[]} */
function porFrecuencia(counts) {
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'es-MX'));
}

/**
 * Opciones y conteos del buscador.
 *
 * Cada dimensión se cuenta sin aplicarse a sí misma (faceta estándar): así el
 * usuario ve cuántos tianguis quedarían con las otras opciones en vez de una
 * lista de ceros. El día se reparte entre los siete días de la semana; los
 * pocos tianguis con varios días aparecen en cada uno.
 *
 * @param {Tianguis[]} tianguis
 * @param {CommerceFilters} [filters]
 * @returns {CommerceSearchOptions}
 */
export function buildSearchOptions(tianguis, filters = {}) {
  const items = tianguis ?? [];

  const sinDia = filterTianguis(items, sinFiltro(filters, 'day'));
  const sinGiro = filterTianguis(items, sinFiltro(filters, 'giro'));
  const sinVialidad = filterTianguis(items, sinFiltro(filters, 'vialidad'));
  const sinDireccion = filterTianguis(items, sinFiltro(filters, 'direccion'));
  const sinColonia = filterTianguis(items, sinFiltro(filters, 'colonia'));
  const sinAlcaldia = filterTianguis(items, sinFiltro(filters, 'alcaldia'));

  const dias = new Map(WEEK_DAYS.map((day) => [day.value, 0]));
  for (const item of sinDia) {
    for (const day of WEEK_DAYS) {
      if (tianguisMatchesDay(item, day.value)) {
        dias.set(day.value, (dias.get(day.value) ?? 0) + 1);
      }
    }
  }

  // El catálogo define el orden de los giros; los que no tienen puestos en el
  // día (o con la búsqueda actual) quedan con conteo cero y el cliente los
  // oculta.
  const giros = contar(sinGiro, (item) => derivadosDe(item).giro);
  const vialidades = contar(sinVialidad, (item) => derivadosDe(item).vialidad);

  return {
    total: filterTianguis(items, filters).length,
    dayTotal: sinDia.length,
    giroTotal: sinGiro.length,
    vialidadTotal: sinVialidad.length,
    direccionTotal: sinDireccion.length,
    coloniaTotal: sinColonia.length,
    alcaldiaTotal: sinAlcaldia.length,
    days: WEEK_DAYS.map((day) => ({
      value: day.value,
      count: dias.get(day.value) ?? 0
    })),
    giros: TODAS_LAS_CATEGORIAS.map((categoria) => ({
      value: categoria.id,
      count: giros.get(categoria.id) ?? 0
    })),
    vialidades: VIALIDADES.map((vialidad) => ({
      value: vialidad.id,
      count: vialidades.get(vialidad.id) ?? 0
    })),
    direcciones: porFrecuencia(contar(sinDireccion, (item) => item.ubicacion)),
    colonias: porFrecuencia(contar(sinColonia, (item) => item.colonia)),
    alcaldias: porFrecuencia(contar(sinAlcaldia, (item) => item.alcaldia))
  };
}
