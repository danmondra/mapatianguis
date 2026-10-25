/**
 * Catálogo de giros: las nueve categorías del equipo de datos
 * (`data/catalog/giros_catalogo.json`) y el marcador con que se dibuja cada una
 * en el mapa.
 *
 * Cada categoría tiene su ilustración en `apps/web/public/tianguis/`, idéntica
 * salvo el color del toldo, la mesa y los letreros. Los tianguis cuyo `GIRO`
 * original viene vacío (`na`) usan el puesto rojo original.
 *
 * @typedef {Object} CategoriaGiro
 * @property {string} id
 * @property {string} nombre
 * @property {string} icono
 * @property {string} tono Color del toldo: popup, ficha y leyenda del mapa.
 * @property {string} imagen Archivo dentro de `public/tianguis/`.
 */

/** @type {readonly CategoriaGiro[]} */
export const CATEGORIAS_GIRO = Object.freeze([
  {
    id: 'CAT_ALIM_FRESCOS',
    nombre: 'Alimentos frescos',
    icono: '🥦',
    tono: '#22b95e',
    imagen: 'puesto_cat_alim_frescos_verde.png'
  },
  {
    id: 'CAT_ABARROTES_CANASTA',
    nombre: 'Abarrotes y canasta básica',
    icono: '🥫',
    tono: '#d1921f',
    imagen: 'puesto_cat_abarrotes_canasta_ambar.png'
  },
  {
    id: 'CAT_COMIDA_PREPARADA',
    nombre: 'Comida preparada',
    icono: '🌮',
    tono: '#d95f1f',
    imagen: 'puesto_cat_comida_preparada_naranja.png'
  },
  {
    id: 'CAT_ROPA_CALZADO_TEXTIL',
    nombre: 'Ropa y calzado',
    icono: '👕',
    tono: '#2f62d4',
    imagen: 'puesto_cat_ropa_calzado_textil_azul.png'
  },
  {
    id: 'CAT_HOGAR_FERRETERIA',
    nombre: 'Hogar y ferretería',
    icono: '🔨',
    tono: '#26a8b8',
    imagen: 'puesto_cat_hogar_ferreteria_cian.png'
  },
  {
    id: 'CAT_SALUD_BELLEZA',
    nombre: 'Salud y belleza',
    icono: '✂️',
    tono: '#d1356f',
    imagen: 'puesto_cat_salud_belleza_rosa.png'
  },
  {
    id: 'CAT_PAPELERIA_TECNOLOGIA',
    nombre: 'Papelería y tecnología',
    icono: '✏️',
    tono: '#7b37d1',
    imagen: 'puesto_cat_papeleria_tecnologia_morado.png'
  },
  {
    id: 'CAT_OFICIOS_SERVICIOS',
    nombre: 'Oficios y servicios',
    icono: '🪛',
    tono: '#84ac2c',
    imagen: 'puesto_cat_oficios_servicios_olivo.png'
  },
  {
    id: 'CAT_BAZAR_CHACHARAS',
    nombre: 'Bazar y chácharas',
    icono: '📦',
    tono: '#a33850',
    imagen: 'puesto_cat_bazar_chacharas_terracota.png'
  }
]);

/** Tianguis sin giro declarado: 1,053 de 1,367 en el directorio oficial. */
export const CATEGORIA_SIN_GIRO = Object.freeze({
  id: 'SIN_GIRO',
  nombre: 'Giro no declarado',
  icono: '🏷️',
  tono: '#e02a2f',
  imagen: 'puesto_original_rojo.png'
});

/** Todas las categorías dibujables, incluida la de los tianguis sin dato. */
export const TODAS_LAS_CATEGORIAS = Object.freeze([
  ...CATEGORIAS_GIRO,
  CATEGORIA_SIN_GIRO
]);

/** @param {string | null | undefined} id */
export function categoriaPorId(id) {
  return TODAS_LAS_CATEGORIAS.find((categoria) => categoria.id === id) ?? CATEGORIA_SIN_GIRO;
}

/**
 * Categoría con la que se dibuja un tianguis: la principal de su lista o la de
 * los que no declaran giro.
 * @param {{ categorias?: string[] }} tianguis
 * @returns {CategoriaGiro}
 */
export function categoriaDeTianguis(tianguis) {
  return categoriaPorId(tianguis?.categorias?.[0]);
}

/** URL del marcador de una categoría. @param {CategoriaGiro} categoria */
export function imagenDeCategoria(categoria) {
  return `/tianguis/${categoria.imagen}`;
}
