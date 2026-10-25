/**
 * Contrato del dominio Retroalimentación (feedback) de vales Mercomuna.
 *
 * Un evento es una respuesta voluntaria y anónima sobre un comercio: ¿aceptaron el vale?,
 * ¿encontró lo que buscaba?, ¿qué le costó trabajo?, ¿qué le gustaría encontrar cerca?
 * No contiene datos personales ni coordenadas: el CP y el giro son los del comercio.
 *
 * @typedef {Object} FeedbackEvent
 * @property {string} fecha YYYY-MM-DD, sin hora.
 * @property {string} cp Código postal de la CDMX (01000-16999).
 * @property {string} giro Giro o tipo de lugar (p. ej. "Tortillería", "Tianguis").
 * @property {'aceptado'|'no_aceptado'|null} respuesta
 * @property {'si'|'parcial'|'no'|null} encontro
 * @property {'distancia'|'horario'|'no_aceptaban'|'sin_producto'|'nada'|null} dificultad
 * @property {string | null} busca Texto corto: qué le gustaría encontrar cerca.
 *
 * @typedef {Object} FeedbackGroup
 * @property {string} cp
 * @property {string} giro
 * @property {number} eventos
 * @property {number} aceptados
 * @property {number} noAceptados
 * @property {number | null} tasaAceptacion aceptados / (aceptados + noAceptados), 0-1.
 * @property {number | null} tasaRechazo
 * @property {{ si: number, parcial: number, no: number }} encontro
 * @property {string | null} dificultadComun
 * @property {{ producto: string, n: number }[]} productosBuscados
 *
 * @typedef {Object} FeedbackSummary
 * @property {number} totalEventos
 * @property {FeedbackGroup[]} grupos
 * @property {{ producto: string, n: number }[]} productosBuscados
 */

import { normalizeText } from './constants.js';

export const FEEDBACK_FIELDS = Object.freeze([
  'fecha',
  'cp',
  'giro',
  'respuesta',
  'encontro',
  'dificultad',
  'busca'
]);
export const FEEDBACK_RESPUESTAS = Object.freeze(['aceptado', 'no_aceptado']);
export const FEEDBACK_ENCONTRO = Object.freeze(['si', 'parcial', 'no']);
export const FEEDBACK_DIFICULTADES = Object.freeze([
  'distancia',
  'horario',
  'no_aceptaban',
  'sin_producto',
  'nada'
]);
export const FEEDBACK_MAX_BUSCA = 60;
export const FEEDBACK_MAX_GIRO = 40;

const CP_CDMX = /^(0[1-9]|1[0-6])\d{3}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
// Señales de dato personal o ubicación en texto libre: números largos (teléfono, coordenada),
// correos, URLs, CURP/RFC.
const DATO_SENSIBLE = [
  { patron: /\d{3,}/, motivo: 'contiene números (posible teléfono, dirección o coordenada)' },
  { patron: /-?\d{1,3}\.\d{3,}/, motivo: 'parece una coordenada' },
  { patron: /@/, motivo: 'parece un correo' },
  { patron: /https?:|www\./i, motivo: 'contiene una URL' },
  { patron: /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/i, motivo: 'parece una CURP' },
  { patron: /\b[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}\b/i, motivo: 'parece un RFC' }
];

/**
 * Valida un evento de retroalimentación. Rechaza campos no previstos (p. ej. lat/lon,
 * nombre, teléfono) y texto que parezca dato personal.
 * @param {unknown} body
 * @returns {{ ok: true, event: FeedbackEvent } | { ok: false, errors: string[] }}
 */
export function validateFeedbackEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: ['El cuerpo debe ser un objeto JSON'] };
  }

  const errors = [];
  const extra = Object.keys(body).filter((key) => !FEEDBACK_FIELDS.includes(key));
  if (extra.length) {
    errors.push(`Campos no permitidos (no se aceptan datos personales ni coordenadas): ${extra.join(', ')}`);
  }

  const texto = (value) => (value === undefined || value === null ? null : String(value).trim());
  const event = {
    fecha: texto(body.fecha),
    cp: texto(body.cp),
    giro: texto(body.giro),
    respuesta: texto(body.respuesta) || null,
    encontro: texto(body.encontro) || null,
    dificultad: texto(body.dificultad) || null,
    busca: texto(body.busca) || null
  };

  if (!event.fecha || !FECHA.test(event.fecha) || Number.isNaN(Date.parse(event.fecha))) {
    errors.push('fecha debe tener formato YYYY-MM-DD (sin hora)');
  }
  if (!event.cp || !CP_CDMX.test(event.cp)) {
    errors.push('cp debe ser un código postal de la CDMX de 5 dígitos');
  }
  if (!event.giro || event.giro.length > FEEDBACK_MAX_GIRO) {
    errors.push(`giro es obligatorio y de máximo ${FEEDBACK_MAX_GIRO} caracteres`);
  }
  for (const [campo, valores] of [
    ['respuesta', FEEDBACK_RESPUESTAS],
    ['encontro', FEEDBACK_ENCONTRO],
    ['dificultad', FEEDBACK_DIFICULTADES]
  ]) {
    if (event[campo] !== null && !valores.includes(event[campo])) {
      errors.push(`${campo} debe ser uno de: ${valores.join(', ')}`);
    }
  }
  if (event.busca && event.busca.length > FEEDBACK_MAX_BUSCA) {
    errors.push(`busca admite máximo ${FEEDBACK_MAX_BUSCA} caracteres`);
  }
  if (!event.respuesta && !event.encontro && !event.dificultad && !event.busca) {
    errors.push('El evento no trae ninguna respuesta');
  }
  for (const campo of ['giro', 'busca']) {
    const valor = event[campo];
    if (!valor) continue;
    const hallazgo = DATO_SENSIBLE.find(({ patron }) => patron.test(valor));
    if (hallazgo) errors.push(`${campo} ${hallazgo.motivo}; no envíes datos personales`);
  }

  return errors.length ? { ok: false, errors } : { ok: true, event };
}

/**
 * Normaliza lo que la persona escribió en "¿Qué te gustaría encontrar cerca?".
 * @param {string | null} value
 */
export function normalizeProduct(value) {
  return normalizeText(value)
    .replace(/^(un|una|unos|unas|el|la|los|las|mas|más)\s+/, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {Map<string, number>} counts
 */
function ranking(counts) {
  return [...counts.entries()]
    .map(([producto, n]) => ({ producto, n }))
    .sort((a, b) => b.n - a.n || a.producto.localeCompare(b.producto));
}

/**
 * Agrega eventos por CP y giro.
 * @param {FeedbackEvent[]} events
 * @returns {FeedbackSummary}
 */
export function summarizeFeedback(events) {
  /** @type {Map<string, any>} */
  const groups = new Map();
  /** @type {Map<string, number>} */
  const globalProducts = new Map();

  for (const event of events) {
    const key = `${event.cp}|${event.giro}`;
    if (!groups.has(key)) {
      groups.set(key, {
        cp: event.cp,
        giro: event.giro,
        eventos: 0,
        aceptados: 0,
        noAceptados: 0,
        encontro: { si: 0, parcial: 0, no: 0 },
        dificultades: new Map(),
        productos: new Map()
      });
    }
    const group = groups.get(key);
    group.eventos += 1;
    if (event.respuesta === 'aceptado') group.aceptados += 1;
    if (event.respuesta === 'no_aceptado') group.noAceptados += 1;
    if (event.encontro) group.encontro[event.encontro] += 1;
    if (event.dificultad && event.dificultad !== 'nada') {
      group.dificultades.set(event.dificultad, (group.dificultades.get(event.dificultad) ?? 0) + 1);
    }
    const producto = normalizeProduct(event.busca);
    if (producto) {
      group.productos.set(producto, (group.productos.get(producto) ?? 0) + 1);
      globalProducts.set(producto, (globalProducts.get(producto) ?? 0) + 1);
    }
  }

  const grupos = [...groups.values()]
    .map(({ dificultades, productos, ...group }) => {
      const confirmados = group.aceptados + group.noAceptados;
      const [dificultadComun] = ranking(dificultades);
      return {
        ...group,
        tasaAceptacion: confirmados ? round(group.aceptados / confirmados) : null,
        tasaRechazo: confirmados ? round(group.noAceptados / confirmados) : null,
        dificultadComun: dificultadComun?.producto ?? null,
        productosBuscados: ranking(productos)
      };
    })
    .sort((a, b) => a.cp.localeCompare(b.cp) || a.giro.localeCompare(b.giro));

  return { totalEventos: events.length, grupos, productosBuscados: ranking(globalProducts) };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
