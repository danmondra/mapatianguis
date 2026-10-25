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
const transport = await readJson('mobility/transport.json');
const metroStations = await readJson('mobility/metro-stations.json');
const metrobusStations = await readJson('mobility/metrobus-stations.json');
const mercados = await readJson('commerce/mercados.json');
const msr = await readJson('commerce/msr.json');
const tianguis = await readJson('commerce/tianguis.json');

expect(alcaldias.type === 'FeatureCollection', 'alcaldias: no es FeatureCollection');
expect(zmvm.type === 'FeatureCollection', 'zmvm: no es FeatureCollection');
expect(alcaldias.features.length === meta.counts.alcaldias, 'alcaldias: conteo distinto al meta');
expect(zmvm.features.length === meta.counts.zmvm, 'zmvm: conteo distinto al meta');

const transportLines = Object.values(transport).reduce(
  (total, layer) => total + (layer.features?.length ?? 0),
  0
);
expect(
  transportLines === meta.counts.transportLines,
  `transport: ${transportLines} trazos, meta dice ${meta.counts.transportLines}`
);

for (const [agency, layer] of Object.entries(transport)) {
  expect(Array.isArray(layer.features), `transport.${agency}: sin features`);
  for (const feature of layer.features) {
    expect(feature.type === 'Feature', `transport.${agency}: feature inválido`);
    expect(
      feature.geometry?.type === 'LineString' && feature.geometry.coordinates.length > 1,
      `transport.${agency}: geometría inválida`
    );
    expect(Boolean(feature.properties?.agency_name), `transport.${agency}: sin agency_name`);
    expect(Boolean(feature.properties?.color), `transport.${agency}: sin color`);
  }
}

expect(metroStations.length === meta.counts.metroStations, 'metroStations: conteo distinto');
expect(metrobusStations.length === meta.counts.metrobusStations, 'metrobusStations: conteo distinto');
expect(mercados.length === meta.counts.mercados, 'mercados: conteo distinto');
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
validateCollection('mercados', mercados, [
  'nombre',
  'alcaldia',
  'colonia',
  'locales',
  'superficie_m2',
  'categoria',
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

for (const [name, items] of [
  ['mercados', mercados],
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
