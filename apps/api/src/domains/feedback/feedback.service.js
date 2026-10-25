import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { summarizeFeedback } from '@mapatianguis/contracts/feedback';
import { DATA_DIR } from '../../data/store.js';

/**
 * Archivo de eventos. Se resuelve en cada llamada para que los tests puedan
 * apuntar a un archivo temporal con FEEDBACK_FILE.
 */
export function feedbackFile() {
  return process.env.FEEDBACK_FILE
    ? path.resolve(process.env.FEEDBACK_FILE)
    : path.join(DATA_DIR, 'feedback', 'events.json');
}

/** @returns {Promise<import('@mapatianguis/contracts/feedback').FeedbackEvent[]>} */
export async function readEvents() {
  try {
    return JSON.parse(await readFile(feedbackFile(), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

// Las escrituras se encadenan para no perder eventos con peticiones simultáneas.
let queue = Promise.resolve();

/**
 * Agrega un evento ya validado. Escribe a un temporal y renombra para no dejar
 * el archivo a medias.
 * @param {import('@mapatianguis/contracts/feedback').FeedbackEvent} event
 */
export function appendEvent(event) {
  const task = queue.then(async () => {
    const file = feedbackFile();
    const events = await readEvents();
    events.push(event);
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, `${JSON.stringify(events, null, 1)}\n`, 'utf8');
    await rename(tmp, file);
    return events.length;
  });
  queue = task.catch(() => {});
  return task;
}

/** @returns {Promise<import('@mapatianguis/contracts/feedback').FeedbackSummary>} */
export async function getSummary() {
  return summarizeFeedback(await readEvents());
}
