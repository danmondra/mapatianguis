#!/usr/bin/env node
/**
 * Genera data/commerce/mercomuna.json a partir del cruce del equipo
 * Principio de Incertianguis (Chilangatón 2026, reto "Comercio popular y
 * barrial").
 *
 * Entrada: `incertianguis/data/processed/mercomuna.csv` — directorio público de
 * comercios que aceptan los vales Mercomuna (comercios-mercomuna.cdmx.gob.mx),
 * geocodificado contra el DENUE.
 *
 * Reglas que aplica esta migración:
 * - Nada de datos personales: el CSV de origen tampoco los trae.
 * - Se conserva la `precision` de cada registro (exacta | cp | sin_ubicacion):
 *   los ubicados solo a nivel de CP comparten el centroide DENUE de su CP, así
 *   que el cliente los dibuja como círculos agregados y nunca como chinchetas.
 * - `coords` es la coordenada apuntada por el registro. El flag `imprecisa`
 *   marca las que son centroide de CP, no ubicación del comercio.
 *
 * Uso:
 *   npm run build:mercomuna
 *   node scripts/build-mercomuna.mjs --source ../otra/ruta/mercomuna.csv
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'data', 'commerce', 'mercomuna.json');

const SOURCE =
  process.argv.find((arg) => arg.startsWith('--source='))?.slice('--source='.length) ??
  process.env.MERCOMUNA_CSV ??
  path.join(ROOT, '..', 'incertianguis', 'data', 'processed', 'mercomuna.csv');

/** Vales Mercomuna vigentes: fecha límite de uso publicada por el programa. */
const VALID_UNTIL = '2026-12-31';

const PRECISIONS = ['exacta', 'cp', 'sin_ubicacion'];

// --- CSV -------------------------------------------------------------------

/** Parser RFC 4180 mínimo: soporta comillas, comillas escapadas y saltos de línea. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((line) => line.length > 1 || line[0] !== '');
  return body.map((line) =>
    Object.fromEntries(header.map((column, index) => [column.trim(), line[index] ?? '']))
  );
}

// --- Transformación --------------------------------------------------------

const round = (value, decimals) => Number(value.toFixed(decimals));

/** "00820" y "820" del DENUE son el mismo CP; se normaliza a 5 dígitos. */
function normalizeCp(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? digits.padStart(5, '0') : null;
}

function toNumber(value) {
  const parsed = Number(value);
  return value === '' || value === undefined || !Number.isFinite(parsed) ? null : parsed;
}

function toBoolean(value) {
  return String(value).trim().toLowerCase() === 'true';
}

/**
 * @param {Record<string, string>} row
 * @returns {import('../packages/contracts/src/commerce.js').ComercioMercomuna | null}
 */
function toComercio(row, index) {
  const precision = PRECISIONS.includes(row.precision) ? row.precision : 'sin_ubicacion';
  const lat = toNumber(row.lat);
  const lon = toNumber(row.lon);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  // Sin coordenada válida el registro no debe llegar con lat/lon a medias.
  const effectivePrecision = hasCoords ? precision : 'sin_ubicacion';

  return {
    id: `mn-${index + 1}`,
    nombre: row.nombre?.trim() || 'Comercio sin nombre',
    giro: row.giro?.trim().toUpperCase() || 'OTRO',
    categoria: row.categoria?.trim() || null,
    alimentos: toBoolean(row.alimentos),
    calle: row.direccion?.trim() || '',
    cp: normalizeCp(row.cp),
    alcaldia: row.alcaldia?.trim().toUpperCase() || '',
    lat: hasCoords ? round(lat, 6) : null,
    lon: hasCoords ? round(lon, 6) : null,
    precision: effectivePrecision,
    // Centroide de CP compartido por varios comercios: no es ubicación propia.
    imprecisa: effectivePrecision === 'cp',
    idsEstrato: row.ids_estrato?.trim() || null,
    aceptaVales: true,
    vigenteHasta: VALID_UNTIL
  };
}

/**
 * Un punto por CP para los comercios ubicados solo a nivel de CP.
 * Nunca se dibujan como chinchetas individuales.
 */
function buildPorCp(comercios) {
  /** @type {Map<string, any>} */
  const porCp = new Map();

  for (const comercio of comercios) {
    if (comercio.precision !== 'cp' || !comercio.cp) continue;

    let entry = porCp.get(comercio.cp);
    if (!entry) {
      entry = {
        cp: comercio.cp,
        lat: comercio.lat,
        lon: comercio.lon,
        alcaldia: comercio.alcaldia,
        comercios: 0,
        comerciosAlimentos: 0,
        categorias: new Set()
      };
      porCp.set(comercio.cp, entry);
    }

    entry.comercios += 1;
    if (comercio.alimentos) {
      entry.comerciosAlimentos += 1;
      if (comercio.categoria) entry.categorias.add(comercio.categoria);
    }
  }

  return [...porCp.values()]
    .map((entry) => ({
      ...entry,
      categorias: [...entry.categorias].sort((a, b) => a.localeCompare(b, 'es'))
    }))
    .sort((a, b) => a.cp.localeCompare(b.cp));
}

function buildResumen(comercios, porCp) {
  const byPrecision = Object.fromEntries(PRECISIONS.map((key) => [key, 0]));
  /** @type {Map<string, number>} */
  const byAlcaldia = new Map();
  /** @type {Map<string, number>} */
  const byGiro = new Map();

  let alimentos = 0;
  for (const comercio of comercios) {
    byPrecision[comercio.precision] += 1;
    if (comercio.alimentos) alimentos += 1;
    byAlcaldia.set(comercio.alcaldia, (byAlcaldia.get(comercio.alcaldia) ?? 0) + 1);
    byGiro.set(comercio.giro, (byGiro.get(comercio.giro) ?? 0) + 1);
  }

  const toSortedList = (map, key) =>
    [...map.entries()]
      .map(([name, total]) => ({ [key]: name, total }))
      .sort((a, b) => b.total - a.total || String(a[key]).localeCompare(String(b[key]), 'es'));

  return {
    total: comercios.length,
    alimentos,
    noAlimentos: comercios.length - alimentos,
    conCoordenada: comercios.length - byPrecision.sin_ubicacion,
    precisos: byPrecision.exacta,
    aproximados: byPrecision.cp,
    sinUbicacion: byPrecision.sin_ubicacion,
    porCp: porCp.length,
    porPrecision: byPrecision,
    porAlcaldia: toSortedList(byAlcaldia, 'alcaldia'),
    porGiro: toSortedList(byGiro, 'giro')
  };
}

// --- Ejecución -------------------------------------------------------------

const raw = await readFile(SOURCE, 'utf8');
const rows = parseCsv(raw);
const comercios = rows.map(toComercio).filter(Boolean);
const porCp = buildPorCp(comercios);
const resumen = buildResumen(comercios, porCp);

if (comercios.length === 0) throw new Error(`El CSV de origen no produjo registros: ${SOURCE}`);

const payload = {
  fuentes: [
    'comercios-mercomuna.cdmx.gob.mx (directorio público) geocodificado contra INEGI DENUE',
    'cruce procesado en incertianguis/data/processed/mercomuna.csv'
  ],
  nota:
    'Los comercios con precision "cp" comparten el centroide DENUE de su código postal: ' +
    'se dibujan como círculos agregados, nunca como ubicaciones individuales. ' +
    'El campo idsEstrato solo se llena con ubicación exacta.',
  vigenteHasta: VALID_UNTIL,
  resumen,
  comercios,
  porCp
};

await writeFile(OUTPUT, JSON.stringify(payload));

console.log(`mercomuna.json escrito: ${path.relative(ROOT, OUTPUT)}`);
console.log(
  `  ${resumen.total} comercios · ${resumen.alimentos} de alimentos · ` +
    `${resumen.precisos} precisos · ${resumen.aproximados} por CP (${resumen.porCp} CP) · ` +
    `${resumen.sinUbicacion} sin ubicación`
);
