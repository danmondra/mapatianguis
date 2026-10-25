import { MAP_CENTER, normalizeText } from '@mapatianguis/contracts';
import { findClosestMetro } from '@mapatianguis/contracts/mobility';
import { findMercadoByName } from '../commerce/commerce.service.js';
import { getMetroStations } from '../mobility/mobility.service.js';
import { LANDMARKS } from './landmarks.js';

const DEFAULT_DESTINATION = Object.freeze({
  lat: 19.4086,
  lon: -99.1228,
  label: 'Mercado Jamaica'
});

const FARE_MXN = 5;
const CO2_SAVED_KG = 0.45;
const ESTIMATED_MINUTES = [18, 25];

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/** @param {unknown} value */
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

/** @param {unknown} coordinates */
function validCoordinates(coordinates) {
  return (
    coordinates &&
    Number.isFinite(Number(coordinates.lat)) &&
    Number.isFinite(Number(coordinates.lon))
  );
}

/**
 * @param {{ from?: string, coordinates?: { lat: number, lon: number } }} input
 * @returns {{ lat: number, lon: number, label: string }}
 */
export function resolveOrigin(input) {
  const text = normalizeText(input.from);

  if (text) {
    const landmarkKey = Object.keys(LANDMARKS).find((key) => text.includes(key));
    if (landmarkKey) return { ...LANDMARKS[landmarkKey] };
  }

  if (validCoordinates(input.coordinates)) {
    return {
      lat: Number(input.coordinates.lat),
      lon: Number(input.coordinates.lon),
      label: 'Mi ubicación'
    };
  }

  return { ...LANDMARKS.zocalo };
}

/**
 * @param {string} to
 * @param {{ lat: number, lon: number, label?: string }} [explicit]
 * @returns {Promise<{ lat: number, lon: number, label: string }>}
 */
export async function resolveDestination(to, explicit) {
  if (validCoordinates(explicit)) {
    return {
      lat: Number(explicit.lat),
      lon: Number(explicit.lon),
      label: String(explicit.label ?? '').trim() || 'Destino seleccionado'
    };
  }

  const text = String(to ?? '').trim();
  if (!text) return { ...DEFAULT_DESTINATION };

  const mercado = await findMercadoByName(text);
  if (mercado) {
    return { lat: mercado.lat, lon: mercado.lon, label: `Mercado ${mercado.nombre}` };
  }

  const normalized = normalizeText(text);
  const landmarkKey = Object.keys(LANDMARKS).find(
    (key) => normalized.includes(key) || key.includes(normalized)
  );
  if (landmarkKey) return { ...LANDMARKS[landmarkKey] };

  return { ...DEFAULT_DESTINATION };
}

/**
 * Plan de ruta del visor: caminata → Metro → caminata.
 * El motor real (grafo multimodal) se conectará detrás de esta misma interfaz.
 *
 * @param {{
 *   from?: string,
 *   to?: string,
 *   coordinates?: { lat: number, lon: number },
 *   destination?: { lat: number, lon: number, label?: string }
 * }} input
 * @returns {Promise<import('@mapatianguis/contracts/routing').RoutePlan>}
 */
export async function planRoute(input = {}) {
  const [origin, destination, metroStations] = await Promise.all([
    Promise.resolve(resolveOrigin(input)),
    resolveDestination(input.to, input.destination),
    getMetroStations()
  ]);

  const startStation = findClosestMetro(metroStations, origin.lat, origin.lon);
  const endStation = findClosestMetro(metroStations, destination.lat, destination.lon);

  if (!startStation || !endStation) {
    return {
      title: `Ruta a ${destination.label}`,
      originLabel: origin.label,
      destinationLabel: destination.label,
      estimatedMinutes: [0, 0],
      fareMxn: FARE_MXN,
      co2SavedKg: CO2_SAVED_KG,
      steps: [],
      legs: [],
      bounds: []
    };
  }

  const points = {
    origin: { lat: origin.lat, lon: origin.lon, label: origin.label },
    startStation: {
      lat: startStation.lat,
      lon: startStation.lon,
      label: `Metro ${startStation.nombre}`
    },
    endStation: {
      lat: endStation.lat,
      lon: endStation.lon,
      label: `Metro ${endStation.nombre}`
    },
    destination: {
      lat: destination.lat,
      lon: destination.lon,
      label: destination.label
    }
  };

  return {
    title: `Ruta a ${destination.label}`,
    originLabel: origin.label,
    destinationLabel: destination.label,
    estimatedMinutes: ESTIMATED_MINUTES,
    fareMxn: FARE_MXN,
    co2SavedKg: CO2_SAVED_KG,
    steps: [
      {
        icon: '🚶',
        text: `Caminar hacia Metro ${startStation.nombre}.`,
        html: `Caminar hacia <b>Metro ${escapeHtml(startStation.nombre)}</b>.`
      },
      {
        icon: '🚇',
        text: `Abordar Metro Línea ${startStation.linea} hasta ${endStation.nombre}.`,
        html: `Abordar <b>Metro Línea ${escapeHtml(startStation.linea)}</b> hasta <b>${escapeHtml(endStation.nombre)}</b>.`
      },
      {
        icon: '🚶',
        text: `Caminar al destino final (${destination.label}).`,
        html: `Caminar al destino final (<b>${escapeHtml(destination.label)}</b>).`
      }
    ],
    legs: [
      {
        mode: 'walk',
        color: '#2563eb',
        dashed: true,
        weight: 3.5,
        popup: `🚶 Tramo 1: Caminar a ${startStation.nombre}`,
        points: [points.origin, points.startStation]
      },
      {
        mode: 'transit',
        color: startStation.color || '#ef4444',
        dashed: false,
        weight: 5,
        popup: `🚇 Tramo 2: Abordar Metro en ${startStation.nombre} hacia ${endStation.nombre}`,
        points: [points.startStation, points.endStation]
      },
      {
        mode: 'walk',
        color: '#16a34a',
        dashed: true,
        weight: 3.5,
        popup: `🚶 Tramo 3: Caminar hacia ${destination.label}`,
        points: [points.endStation, points.destination]
      }
    ],
    bounds: [
      points.origin,
      points.startStation,
      points.endStation,
      points.destination
    ]
  };
}
