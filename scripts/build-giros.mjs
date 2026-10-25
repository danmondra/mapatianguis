#!/usr/bin/env node
/**
 * Añade a `data/commerce/tianguis.json` el giro declarado de cada tianguis.
 *
 * El visor legado no publicaba el campo `GIRO` del directorio ADIP; el CSV
 * fuente (`tianguis-cdmx.csv`) sí lo trae, pero como texto libre: 1,053 de
 * 1,367 filas vienen vacías (`na`), 136 con el centinela `0`, 27 con conteos de
 * puestos y el resto con descripciones de una o varias familias. Este script
 * cruza por la llave natural (alcaldía + colonia + ubicación + día) y escribe
 * tres campos:
 *
 * - `giro`: el texto tal cual viene del CSV, sin perder información.
 * - `categorias`: ids del catálogo de giros, el principal primero.
 * - `sinGiro`: true cuando el directorio no declara giro.
 *
 * Uso:
 *   npm run build:giros
 *   npm run build:giros -- ../otro/tianguis-cdmx.csv
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { girosDeTexto, tianguisKey } from './lib/giro-csv.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.resolve(process.argv[2] ?? path.join(ROOT, '..', 'tianguis-cdmx.csv'));
const TARGET = path.join(ROOT, 'data', 'commerce', 'tianguis.json');

/**
 * Parser CSV (RFC 4180) con las peculiaridades del archivo del ADIP: celdas
 * entre comillas, comillas escapadas con `\"` y comas dentro de la dirección.
 * @param {string} text
 * @returns {Record<string, string>[]}
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const body = text.replace(/^\uFEFF/, '');

  const pushCell = (value) => {
    row.push(value.trim());
    cell = '';
  };
  const pushRow = () => {
    if (row.length > 1) rows.push(row);
    row = [];
  };

  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];

    if (quoted) {
      if (char === '"' && body[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      // Comilla de apertura a media celda (p. ej. `103 BÁSICOS", ...`): se
      // descarta, igual que las comillas de cierre huérfanas.
      quoted = true;
    } else if (char === ',') {
      pushCell(cell);
    } else if (char === '\n') {
      pushCell(cell);
      pushRow();
    } else if (char !== '\r') {
      cell += char;
    }
  }
  pushCell(cell);
  pushRow();

  const [header, ...data] = rows;
  return data.map((cells) =>
    Object.fromEntries(header.map((column, index) => [column, cells[index] ?? '']))
  );
}

async function main() {
  const [csv, current] = await Promise.all([
    readFile(SOURCE, 'utf8'),
    readFile(TARGET, 'utf8').then(JSON.parse)
  ]);

  /** @type {Map<string, { giro: string, categorias: string[], sinGiro: boolean }[]>} */
  const porLlave = new Map();
  for (const row of parseCsv(csv)) {
    if (!row.giro) continue;
    const categorias = girosDeTexto(row.giro);
    const entry = {
      giro: row.giro,
      categorias,
      sinGiro: categorias.length === 0
    };
    const key = tianguisKey(row);
    const bucket = porLlave.get(key) ?? [];
    bucket.push(entry);
    porLlave.set(key, bucket);
  }

  const usadas = new Map();
  let enriquecidos = 0;
  let sinGiro = 0;
  const porCategoria = new Map();

  const enriched = current.map((tianguis) => {
    const key = tianguisKey(tianguis);
    const bucket = porLlave.get(key) ?? [];
    const used = usadas.get(key) ?? 0;
    // Varias filas con la misma llave: se asignan en orden de aparición.
    const match = bucket[used];

    if (!match) {
      sinGiro += 1;
      return { ...tianguis, giro: null, categorias: [], sinGiro: true };
    }

    usadas.set(key, used + 1);
    enriquecidos += 1;
    if (match.sinGiro) sinGiro += 1;
    const principal = match.categorias[0];
    if (principal) porCategoria.set(principal, (porCategoria.get(principal) ?? 0) + 1);

    return { ...tianguis, ...match };
  });

  await writeFile(TARGET, `${JSON.stringify(enriched)}\n`, 'utf8');

  console.log(`Fuente:  ${path.relative(ROOT, SOURCE)}`);
  console.log(`Destino: ${path.relative(ROOT, TARGET)}`);
  console.log(`  tianguis emparejados   ${enriquecidos} / ${current.length}`);
  console.log(`  sin giro declarado     ${sinGiro}`);
  console.log('  por categoría principal:');
  for (const [categoria, total] of [...porCategoria].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${categoria.padEnd(28)} ${total}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
