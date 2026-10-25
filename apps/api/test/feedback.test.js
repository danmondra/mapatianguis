import assert from 'node:assert/strict';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { summarizeFeedback, validateFeedbackEvent } from '@mapatianguis/contracts/feedback';
import { createApp } from '../src/app.js';
import { DATA_DIR } from '../src/data/store.js';

const VALIDO = {
  fecha: '2026-10-25',
  cp: '04030',
  giro: 'Tortillería',
  respuesta: 'aceptado',
  encontro: 'si',
  dificultad: 'nada',
  busca: 'una carnicería'
};

describe('contrato de feedback', () => {
  it('acepta un evento válido', () => {
    assert.equal(validateFeedbackEvent(VALIDO).ok, true);
  });

  it('rechaza coordenadas y campos personales', () => {
    const result = validateFeedbackEvent({ ...VALIDO, lat: 19.34, lon: -99.14, nombre: 'Ana' });
    assert.equal(result.ok, false);
    assert.match(result.errors[0], /lat, lon, nombre/);
  });

  it('rechaza teléfonos, correos y coordenadas en texto libre', () => {
    for (const busca of ['pan 5512345678', 'ana@correo.mx', '19.3456 -99.1234']) {
      assert.equal(validateFeedbackEvent({ ...VALIDO, busca }).ok, false, busca);
    }
  });

  it('rechaza CP fuera de la CDMX, fecha con hora y valores fuera de catálogo', () => {
    assert.equal(validateFeedbackEvent({ ...VALIDO, cp: '50000' }).ok, false);
    assert.equal(validateFeedbackEvent({ ...VALIDO, fecha: '2026-10-25T10:31:00Z' }).ok, false);
    assert.equal(validateFeedbackEvent({ ...VALIDO, respuesta: 'quizas' }).ok, false);
  });

  it('agrega por CP y giro con tasa y productos', () => {
    const summary = summarizeFeedback([
      VALIDO,
      { ...VALIDO, respuesta: 'no_aceptado', dificultad: 'no_aceptaban', busca: 'Carnicería' },
      { ...VALIDO, giro: 'Pollería', respuesta: null, busca: null }
    ]);
    const tortilleria = summary.grupos.find((grupo) => grupo.giro === 'Tortillería');
    assert.equal(tortilleria.aceptados, 1);
    assert.equal(tortilleria.noAceptados, 1);
    assert.equal(tortilleria.tasaAceptacion, 0.5);
    assert.equal(tortilleria.dificultadComun, 'no_aceptaban');
    assert.deepEqual(summary.productosBuscados, [{ producto: 'carniceria', n: 2 }]);
  });
});

describe('API de feedback', () => {
  /** @type {import('node:http').Server} */
  let server;
  let baseUrl;
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'feedback-'));
    process.env.FEEDBACK_FILE = path.join(tmpDir, 'events.json');
    await copyFile(path.join(DATA_DIR, 'feedback', 'events.json'), process.env.FEEDBACK_FILE);
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/feedback`;
  });

  after(async () => {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
    delete process.env.FEEDBACK_FILE;
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('precarga 60 eventos en 3 alcaldías', async () => {
    const response = await fetch(`${baseUrl}/summary`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const summary = await response.json();
    assert.equal(summary.totalEventos, 60);
    const prefijos = new Set(summary.grupos.map((grupo) => grupo.cp.slice(0, 2)));
    assert.deepEqual([...prefijos].sort(), ['04', '09', '14']);
  });

  it('guarda un evento válido y lo refleja en el resumen', async () => {
    const post = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...VALIDO, cp: '04031' })
    });
    assert.equal(post.status, 201);
    const summary = await (await fetch(`${baseUrl}/summary`)).json();
    assert.equal(summary.totalEventos, 61);
    assert.ok(summary.grupos.some((grupo) => grupo.cp === '04031' && grupo.aceptados === 1));
  });

  it('responde 400 con coordenadas', async () => {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...VALIDO, lat: 19.345, lon: -99.147 })
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(body.detalles.some((detalle) => /lat, lon/.test(detalle)));
  });
});
