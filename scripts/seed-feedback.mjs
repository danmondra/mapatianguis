/**
 * Genera data/feedback/events.json con 60 eventos SINTÉTICOS de retroalimentación,
 * repartidos en Iztapalapa, Tlalpan y Coyoacán (20 cada una). Son deterministas.
 *
 * Los CP son reales y se eligieron con los datos de Incertianguis para que el
 * informe semanal tenga casos que mostrar: CP de IDS bajo sin comercios Mercomuna
 * (eventos en tianguis o mercados), CP con rechazo alto y productos buscados sin
 * oferta afiliable en el CP. Las respuestas son inventadas.
 *
 * Uso: npm run seed:feedback
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFeedbackEvent } from '@mapatianguis/contracts/feedback';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'feedback', 'events.json');

// [cp, giro, eventos, rechazos, dificultad cuando sí aceptan, productos buscados]
const PLAN = [
  // Iztapalapa
  ['09440', 'Abarrotes y misceláneas', 6, 3, 'horario', []],
  ['09096', 'Tianguis', 5, 3, 'distancia', ['pan', 'pan', 'pan dulce']],
  ['09577', 'Mercado', 4, 1, 'distancia', ['pan', 'tortillas']],
  ['09438', 'Abarrotes y misceláneas', 5, 1, 'sin_producto', ['carne', 'carne', 'verduras']],
  // Tlalpan
  ['14250', 'Pollería', 6, 3, 'horario', []],
  ['14250', 'Carnicería', 3, 1, 'nada', []],
  ['14734', 'Tianguis', 7, 4, 'distancia', ['carne', 'queso', 'queso', 'carne']],
  ['14426', 'Tianguis', 4, 2, 'distancia', ['tortillas', 'tortillas', 'una tortillería']],
  // Coyoacán
  ['04850', 'Mercado', 6, 2, 'distancia', ['carne', 'pan', 'pescado']],
  ['04620', 'Pollería', 5, 2, 'sin_producto', ['fruta', 'verduras']],
  ['04909', 'Abarrotes y misceláneas', 5, 0, 'nada', ['medicinas']],
  ['04480', 'Cremería, lácteos y embutidos', 4, 0, 'nada', []]
];

const events = [];
for (const [cp, giro, total, rechazos, dificultad, busca] of PLAN) {
  for (let i = 0; i < total; i += 1) {
    const rechazado = i < rechazos;
    const event = {
      fecha: `2026-10-${String(19 + (events.length % 7)).padStart(2, '0')}`,
      cp,
      giro,
      respuesta: rechazado ? 'no_aceptado' : 'aceptado',
      encontro: rechazado ? 'no' : i % 2 ? 'parcial' : 'si',
      dificultad: rechazado ? 'no_aceptaban' : dificultad,
      busca: busca[i] ?? null
    };
    const result = validateFeedbackEvent(event);
    if (!result.ok) throw new Error(`Evento sintético inválido: ${result.errors.join('; ')}`);
    events.push(result.event);
  }
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(events, null, 1)}\n`, 'utf8');
console.log(`${events.length} eventos sintéticos -> ${path.relative(ROOT, OUT)}`);
