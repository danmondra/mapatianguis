#!/usr/bin/env node
/**
 * Importa las fotos de `../fotos` al cliente y genera el manifiesto que la API
 * adjunta a cada tianguis.
 *
 * Cada carpeta `fotos/0002` es el índice 0-based del tianguis en
 * `data/commerce/tianguis.json`: `featured.jpg` es la foto principal de Google
 * Maps y `streetview.jpg` la vista de calle. Se generan dos WebP por imagen
 * (miniatura para hover y tamaño de ficha) para no servir los originales.
 *
 * Requiere ImageMagick (`convert`).
 *
 * Uso:
 *   npm run import:photos
 *   npm run import:photos -- --source ../fotos --force
 */
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SOURCE = path.resolve(ROOT, '..', 'fotos');
const PUBLIC_DIR = path.join(ROOT, 'apps', 'web', 'public', 'tianguis', 'fotos');
const MANIFEST = path.join(ROOT, 'data', 'commerce', 'photos.json');

const VARIANTS = Object.freeze({
  thumb: { size: 360, quality: 70 },
  full: { size: 900, quality: 78 }
});

const SOURCES = Object.freeze({
  principal: 'featured.jpg',
  calle: 'streetview.jpg'
});

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const SOURCE = path.resolve(option('source', DEFAULT_SOURCE));
const FORCE = flag('force');
const CONCURRENCY = 8;

async function main() {
  const tianguis = JSON.parse(
    await readFile(path.join(ROOT, 'data', 'commerce', 'tianguis.json'), 'utf8')
  );

  let entries;
  try {
    entries = await readdir(SOURCE, { withFileTypes: true });
  } catch (error) {
    throw new Error(
      `No se encontró la carpeta de fotos: ${SOURCE}\n` +
        'Pásala con --source ../fotos o ejecuta desde la raíz del monorepo.'
    );
  }

  const folders = entries
    .filter((entry) => entry.isDirectory() && /^\d{4}$/.test(entry.name))
    .map((entry) => ({ index: Number(entry.name), folder: entry.name }))
    .sort((a, b) => a.index - b.index)
    .filter(({ index }) => {
      if (index < tianguis.length) return true;
      console.warn(`  ! fotos/${String(index).padStart(4, '0')} no tiene tianguis; se omite.`);
      return false;
    });

  console.log(`Origen: ${SOURCE}`);
  console.log(`Tianguis en el directorio: ${tianguis.length}`);
  console.log(`Carpetas de fotos: ${folders.length}`);
  console.log(`Destino: ${path.relative(ROOT, PUBLIC_DIR)}\n`);

  const manifest = {
    source: path.relative(ROOT, SOURCE),
    generatedAt: new Date().toISOString(),
    total: folders.length,
    photos: {}
  };

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  await runPool(folders, CONCURRENCY, async ({ index, folder }) => {
    const sourceDir = path.join(SOURCE, folder);
    const outputDir = path.join(PUBLIC_DIR, folder);
    const record = {};

    for (const [kind, fileName] of Object.entries(SOURCES)) {
      const source = path.join(sourceDir, fileName);
      if (!(await exists(source))) continue;

      const urls = {};
      for (const [variant, { size, quality }] of Object.entries(VARIANTS)) {
        const output = path.join(outputDir, `${kind}-${variant}.webp`);
        if (!FORCE && (await isCurrent(source, output))) {
          skipped += 1;
        } else {
          try {
            await mkdir(outputDir, { recursive: true });
            await convert(source, output, size, quality);
            converted += 1;
          } catch (error) {
            failed += 1;
            console.warn(`  ! No se pudo convertir ${path.relative(ROOT, source)}: ${error.message}`);
            continue;
          }
        }
        urls[variant] = `/tianguis/fotos/${folder}/${kind}-${variant}.webp`;
      }

      if (urls.thumb && urls.full) {
        record[kind] = {
          ...urls,
          credit: kind === 'principal' ? 'Google Maps' : 'Google Street View'
        };
      }
    }

    if (Object.keys(record).length > 0) {
      manifest.photos[index] = record;
    }
  });

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const withPhotos = Object.keys(manifest.photos).length;
  const withPrincipal = Object.values(manifest.photos).filter((item) => item.principal).length;
  const withCalle = Object.values(manifest.photos).filter((item) => item.calle).length;

  console.log('\nResumen:');
  console.log(`  tianguis con fotos       ${withPhotos}`);
  console.log(`  con foto principal       ${withPrincipal}`);
  console.log(`  con vista de calle       ${withCalle}`);
  console.log(`  imágenes convertidas     ${converted}`);
  console.log(`  imágenes ya vigentes     ${skipped}`);
  if (failed > 0) console.log(`  conversiones fallidas    ${failed}`);
  console.log(`  manifiesto               ${path.relative(ROOT, MANIFEST)}`);
}

async function convert(source, output, size, quality) {
  await execFileAsync('convert', [
    source,
    '-auto-orient',
    '-resize',
    `${size}x${size}>`,
    '-strip',
    '-quality',
    String(quality),
    output
  ]);
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function isCurrent(source, output) {
  try {
    const [sourceStat, outputStat] = await Promise.all([stat(source), stat(output)]);
    return outputStat.mtimeMs >= sourceStat.mtimeMs && outputStat.size > 0;
  } catch {
    return false;
  }
}

async function runPool(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await worker(item);
    }
  });
  await Promise.all(runners);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
