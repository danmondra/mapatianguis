/**
 * Utilidades para leer el campo `GIRO` del CSV del directorio ADIP, que es
 * texto libre y no un catálogo.
 *
 * Vive en `scripts/lib/` y no en `@mapatianguis/contracts` a propósito: el
 * navegador solo necesita el catálogo ya resuelto (`data/commerce/tianguis.json`),
 * no este diccionario de alias ni el precio de mantenerlo en el bundle.
 */

/** Familias de giro del catálogo → patrones que las delatan en el texto libre. */
const FAMILIAS = [
  { id: 'CAT_ABARROTES_CANASTA', patrones: ['basic', 'complementario', 'abasto', 'canasta'] },
  { id: 'CAT_COMIDA_PREPARADA', patrones: ['alimentos preparados', 'comida preparada', 'antojito', 'comida'] },
  { id: 'CAT_ALIM_FRESCOS', patrones: ['alimentos frescos', 'frutas', 'verduras', 'recauderia', 'carniceria'] },
  { id: 'CAT_ROPA_CALZADO_TEXTIL', patrones: ['ropa', 'calzado', 'textil', 'tela'] },
  { id: 'CAT_HOGAR_FERRETERIA', patrones: ['hogar', 'ferreteria', 'muebles', 'limpieza'] },
  { id: 'CAT_SALUD_BELLEZA', patrones: ['salud', 'belleza', 'estetica', 'farmacia'] },
  { id: 'CAT_PAPELERIA_TECNOLOGIA', patrones: ['papeleria', 'tecnologia', 'electronica', 'juguetes', 'computo'] },
  { id: 'CAT_OFICIOS_SERVICIOS', patrones: ['oficios', 'servicios', 'reparacion', 'marcos', 'art'] },
  { id: 'CAT_BAZAR_CHACHARAS', patrones: ['chachar', 'bazar', 'antiguedad', 'segunda mano', 'varios', 'mixto'] }
];

/**
 * Descripciones que no son categorías sino el conteo de puestos por familia:
 * `"103 básicos, 192 complementarios y 14 alimentos preparados"`.
 */
const PATRON_CONTEO = /(\d+)\s*(b[aá]sicos?|complementarios?|ali?e?m?e?n?t?o?s?\s*preparados?)/g;

/** @param {unknown} value */
function normalizar(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Llave natural para cruzar CSV y directorio: alcaldía + colonia + calle + día.
 * El mismo tianguis puede repetir colonia y día, pero no la calle exacta.
 * @param {{ alcaldia?: string, colonia?: string, ubicacion?: string, dia?: string }} record
 */
export function tianguisKey(record) {
  return ['alcaldia', 'colonia', 'ubicacion', 'dia'].map(normalizar).join('|');
}

/**
 * Traduce el texto libre de `GIRO` a ids del catálogo de giros. Devuelve una
 * lista vacía solo cuando el campo viene vacío o con el centinela `na`.
 * @param {string | null | undefined} giro
 * @returns {string[]} ids, el principal primero
 */
export function girosDeTexto(giro) {
  const texto = normalizar(giro);
  if (!texto || texto === 'na') return [];

  const totales = new Map();
  for (const [, cantidad, etiqueta] of texto.matchAll(PATRON_CONTEO)) {
    const familia = /b[aá]sico/.test(etiqueta)
      ? 'CAT_ABARROTES_CANASTA'
      : /complementario/.test(etiqueta)
        ? 'CAT_ROPA_CALZADO_TEXTIL'
        : 'CAT_COMIDA_PREPARADA';
    totales.set(familia, (totales.get(familia) ?? 0) + Number(cantidad));
  }

  if (totales.size > 0) {
    return [...totales]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
  }

  const encontradas = FAMILIAS.map(({ id, patrones }) => ({
    id,
    hits: patrones.filter((patron) => texto.includes(patron)).length
  }))
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map(({ id }) => id);

  // Valores como el centinela `0`: no describen un giro, pero tampoco son nulos.
  return encontradas.length > 0 ? encontradas : ['CAT_BAZAR_CHACHARAS'];
}
