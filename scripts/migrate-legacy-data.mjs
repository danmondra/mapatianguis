#!/usr/bin/env node
/**
 * Extrae los artefactos del visor legado (HTML autocontenido) y los deja en
 * archivos por dominio, listos para que la API los sirva.
 *
 * Uso:
 *   node scripts/migrate-legacy-data.mjs [ruta/al/mapa.html]
 *
 * Por defecto lee ../tianuisCDMX/mapa_comercio_movilidad_cdmx.html.
 */
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEGACY_HTML =
  process.argv[2] ?? path.resolve(ROOT, '..', 'tianuisCDMX', 'mapa_comercio_movilidad_cdmx.html');
const LEGACY_DIR = path.dirname(LEGACY_HTML);

async function writeJson(relativePath, value) {
  const target = path.join(ROOT, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value)}\n`, 'utf8');
  console.log(`  ✓ ${relativePath}`);
}

function extractMapData(html) {
  const line = html
    .split('\n')
    .find((candidate) => candidate.includes('const MAP_DATA = '));
  if (!line) throw new Error('No se encontró "const MAP_DATA =" en el HTML legado.');

  const raw = line
    .slice(line.indexOf('const MAP_DATA = ') + 'const MAP_DATA = '.length)
    .trim()
    .replace(/;$/, '');

  return { data: JSON.parse(raw), raw };
}

/**
 * Quita del catálogo de giros los campos heredados de Mercomuna. El catálogo
 * conserva la clasificación de giros, pero el programa Mercomuna ya no forma
 * parte del producto.
 */
async function sanitizeGirosCatalog() {
  const jsonPath = path.join(ROOT, 'data', 'catalog', 'giros_catalogo.json');
  try {
    const catalog = JSON.parse(await readFile(jsonPath, 'utf8'));
    for (const categoria of catalog.categorias ?? []) delete categoria.mercomuna_default;
    for (const subgiro of catalog.subgiros ?? []) delete subgiro.mercomuna;
    await writeFile(jsonPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  } catch {
    // Si el legado no trae catálogo, no hay nada que limpiar.
  }

  const csvPath = path.join(ROOT, 'data', 'catalog', 'giros_catalogo.csv');
  try {
    const lines = (await readFile(csvPath, 'utf8')).split('\n');
    const column = lines[0].split(',').indexOf('mercomuna');
    if (column < 0) return;
    await writeFile(
      csvPath,
      lines.map((line) => removeCsvColumn(line, column)).join('\n'),
      'utf8'
    );
  } catch {
    // Igual que arriba: el catálogo es opcional para el mapa.
  }
}

/** Quita una columna de una línea CSV respetando las celdas entre comillas. */
function removeCsvColumn(line, index) {
  if (!line) return line;

  let quoted = false;
  let start = 0;
  const spans = [];

  for (let cursor = 0; cursor < line.length; cursor += 1) {
    const character = line[cursor];
    if (character === '"') {
      if (quoted && line[cursor + 1] === '"') {
        cursor += 1;
        continue;
      }
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      spans.push([start, cursor]);
      start = cursor + 1;
    }
  }
  spans.push([start, line.length]);

  if (index >= spans.length) return line;
  const [from, to] = spans[index];
  return index < spans.length - 1
    ? line.slice(0, from) + line.slice(to + 1)
    : line.slice(0, from - 1) + line.slice(to);
}

function extractStyles(html) {
  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  if (!match) throw new Error('No se encontró el bloque <style> en el HTML legado.');

  return match[1].replace(
    /@font-face\s*\{[\s\S]*?\}/,
    `@font-face {
      font-family: 'estaciones';
      src: url('/fonts/estaciones.woff') format('woff');
      font-weight: normal;
      font-style: normal;
    }`
  );
}

async function main() {
  console.log(`Leyendo legado: ${LEGACY_HTML}`);
  const html = await readFile(LEGACY_HTML, 'utf8');
  const { data, raw } = extractMapData(html);

  const checksum = createHash('sha256').update(raw).digest('hex');
  const counts = {
    alcaldias: data.alcaldias?.features?.length ?? 0,
    zmvm: data.zmvm?.features?.length ?? 0,
    metroStations: data.metro_stations?.length ?? 0,
    metrobusStations: data.metrobus_stations?.length ?? 0,
    tianguis: data.tianguis?.length ?? 0
  };

  console.log('Escribiendo datos por dominio...');
  await writeJson('data/geo/alcaldias.json', data.alcaldias);
  await writeJson('data/geo/zmvm.json', data.zmvm);
  // El legado incluye los trazos de la Red MI; el producto solo publica estaciones.
  await writeJson('data/mobility/metro-stations.json', data.metro_stations ?? []);
  await writeJson('data/mobility/metrobus-stations.json', data.metrobus_stations ?? []);
  // El legado incluye 329 mercados públicos y 51 rutas MSR; el producto no los publica.
  await writeJson('data/commerce/tianguis.json', data.tianguis ?? []);
  await writeJson('data/meta.json', {
    source: 'tianuisCDMX/mapa_comercio_movilidad_cdmx.html',
    legacyChecksum: checksum,
    extractedAt: new Date().toISOString(),
    counts
  });

  // Catálogo de giros (ya no vive dentro del mapa, pero es parte del dominio).
  for (const file of ['giros_catalogo.json', 'giros_catalogo.csv']) {
    try {
      await cp(
        path.join(LEGACY_DIR, 'data', 'catalog', file),
        path.join(ROOT, 'data', 'catalog', file)
      );
      console.log(`  ✓ data/catalog/${file}`);
    } catch {
      console.warn(`  ! No se encontró data/catalog/${file}; se omite.`);
    }
  }
  await sanitizeGirosCatalog();

  // Estilos y fuentes: se conservan para que el mapa se vea idéntico.
  const css = extractStyles(html);
  const cssTarget = path.join(ROOT, 'apps', 'web', 'src', 'app', 'styles', 'legacy.css');
  await mkdir(path.dirname(cssTarget), { recursive: true });
  await writeFile(
    cssTarget,
    `/* Generado por scripts/migrate-legacy-data.mjs — no editar a mano. */\n${css}\n`,
    'utf8'
  );
  console.log('  ✓ apps/web/src/app/styles/legacy.css');

  for (const font of ['estaciones.woff', 'estaciones.ttf']) {
    try {
      await cp(
        path.join(LEGACY_DIR, 'assets', 'fonts', font),
        path.join(ROOT, 'apps', 'web', 'public', 'fonts', font)
      );
      console.log(`  ✓ apps/web/public/fonts/${font}`);
    } catch {
      console.warn(`  ! No se encontró assets/fonts/${font}; se omite.`);
    }
  }

  console.log('\nResumen:');
  for (const [key, value] of Object.entries(counts)) {
    console.log(`  ${key.padEnd(18)} ${value}`);
  }
  console.log(`\nChecksum del bundle legado: ${checksum}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
