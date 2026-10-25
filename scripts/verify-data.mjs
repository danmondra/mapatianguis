#!/usr/bin/env node
/**
 * Verifica que los artefactos migrados mantengan el contrato mínimo que la API
 * y el cliente esperan. Se ejecuta en CI y antes de un release de datos.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, 'data', relativePath), 'utf8'));
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function hasCoordinates(record) {
  return Number.isFinite(record.lat) && Number.isFinite(record.lon);
}

function validateCollection(name, items, requiredFields) {
  expect(Array.isArray(items), `${name}: debe ser un arreglo`);
  for (const [index, item] of items.entries()) {
    for (const field of requiredFields) {
      expect(
        item[field] !== undefined && item[field] !== null && item[field] !== '',
        `${name}[${index}]: falta ${field}`
      );
    }
  }
}

const meta = await readJson('meta.json');
const alcaldias = await readJson('geo/alcaldias.json');
const zmvm = await readJson('geo/zmvm.json');
const metroStations = await readJson('mobility/metro-stations.json');
const metrobusStations = await readJson('mobility/metrobus-stations.json');
const msr = await readJson('commerce/msr.json');
const tianguis = await readJson('commerce/tianguis.json');
const mercomuna = await readJson('commerce/mercomuna.json');

expect(alcaldias.type === 'FeatureCollection', 'alcaldias: no es FeatureCollection');
expect(zmvm.type === 'FeatureCollection', 'zmvm: no es FeatureCollection');
expect(alcaldias.features.length === meta.counts.alcaldias, 'alcaldias: conteo distinto al meta');
expect(zmvm.features.length === meta.counts.zmvm, 'zmvm: conteo distinto al meta');

expect(metroStations.length === meta.counts.metroStations, 'metroStations: conteo distinto');
expect(metrobusStations.length === meta.counts.metrobusStations, 'metrobusStations: conteo distinto');
expect(msr.length === meta.counts.msr, 'msr: conteo distinto');
expect(tianguis.length === meta.counts.tianguis, 'tianguis: conteo distinto');

validateCollection('metroStations', metroStations, [
  'nombre',
  'linea',
  'color',
  'icon_class',
  'tipo',
  'alcaldia',
  'lat',
  'lon'
]);
validateCollection('metrobusStations', metrobusStations, [
  'nombre',
  'linea',
  'alcaldia',
  'lat',
  'lon'
]);
validateCollection('msr', msr, ['ruta', 'dia', 'oferentes', 'direccion', 'alcaldia', 'colonia']);
validateCollection('tianguis', tianguis, [
  'alcaldia',
  'colonia',
  'ubicacion',
  'dia',
  'horario',
  'lat',
  'lon'
]);

// Mercomuna: directorio de comercios que aceptan vales. La invariancia que
// importa es que ningún registro declare coordenada sin saber su precisión, y
// que los agrupados por CP nunca se confundan con ubicaciones exactas.
expect(Array.isArray(mercomuna.comercios), 'mercomuna: comercios debe ser un arreglo');
expect(Array.isArray(mercomuna.porCp), 'mercomuna: porCp debe ser un arreglo');
expect(mercomuna.vigenteHasta === '2026-12-31', 'mercomuna: fecha límite de vales distinta');

const mercomunaPrecisiones = ['exacta', 'cp', 'sin_ubicacion'];
const mercomunaCpConCoordenada = new Set();
for (const [index, comercio] of mercomuna.comercios.entries()) {
  expect(typeof comercio.id === 'string' && comercio.id !== '', `mercomuna[${index}]: falta id`);
  expect(
    typeof comercio.nombre === 'string' && comercio.nombre !== '',
    `mercomuna[${index}]: falta nombre`
  );
  expect(
    mercomunaPrecisiones.includes(comercio.precision),
    `mercomuna[${index}]: precision desconocida (${comercio.precision})`
  );
  expect(comercio.aceptaVales === true, `mercomuna[${index}]: aceptaVales distinto de true`);

  const tieneCoordenada = hasCoordinates(comercio);
  expect(
    comercio.precision !== 'sin_ubicacion' || !tieneCoordenada,
    `mercomuna[${index}]: sin_ubicacion con coordenadas`
  );
  expect(
    comercio.precision === 'sin_ubicacion' || tieneCoordenada,
    `mercomuna[${index}]: ubicado sin coordenadas`
  );
  expect(
    comercio.imprecisa === (comercio.precision === 'cp'),
    `mercomuna[${index}]: imprecisa no coincide con precision`
  );
  expect(
    comercio.idsEstrato === null || comercio.precision === 'exacta',
    `mercomuna[${index}]: idsEstrato sin ubicación exacta`
  );

  if (comercio.precision === 'cp') mercomunaCpConCoordenada.add(comercio.cp);
}

expect(
  mercomuna.porCp.length === mercomunaCpConCoordenada.size,
  'mercomuna: porCp no cubre todos los CP con comercios aproximados'
);
for (const [index, entry] of mercomuna.porCp.entries()) {
  expect(hasCoordinates(entry), `mercomuna.porCp[${index}]: coordenadas inválidas`);
  expect(entry.comercios > 0, `mercomuna.porCp[${index}]: sin comercios`);
  expect(
    entry.comerciosAlimentos <= entry.comercios,
    `mercomuna.porCp[${index}]: alimentos mayor que el total`
  );
}

for (const [name, items] of [
  ['msr', msr],
  ['tianguis', tianguis]
]) {
  for (const [index, item] of items.entries()) {
    expect(hasCoordinates(item), `${name}[${index}]: coordenadas inválidas`);
  }
}

if (failures.length > 0) {
  console.error(`Datos inválidos (${failures.length} problemas):`);
  for (const failure of failures.slice(0, 50)) console.error(`  - ${failure}`);
  if (failures.length > 50) console.error(`  ... y ${failures.length - 50} más`);
  process.exitCode = 1;
} else {
  console.log('Datos OK:', JSON.stringify(meta.counts));
  console.log(`Checksum legado: ${meta.legacyChecksum}`);
}
