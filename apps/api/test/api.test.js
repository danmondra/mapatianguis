import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.js';
import { filterTianguis, findMercado } from '@mapatianguis/contracts/commerce';
import { getDirectory } from '../src/domains/commerce/commerce.service.js';
import { getMetroStations } from '../src/domains/mobility/mobility.service.js';
import { planRoute } from '../src/domains/routing/routing.service.js';

describe('datos migrados', () => {
  it('conserva los conteos del visor legado', async () => {
    const { mercados, msr, tianguis } = await getDirectory();
    assert.equal(mercados.length, 329);
    assert.equal(msr.length, 51);
    assert.equal(tianguis.length, 1_367);
    assert.equal((await getMetroStations()).length, 195);
  });

  it('busca mercados sin distinguir acentos', async () => {
    const mercado = findMercado(await getDirectory().then((data) => data.mercados), 'jamaica');
    assert.match(mercado.nombre, /JAMAICA/);
  });

  it('filtra tianguis por día con acentos normalizados', async () => {
    const { tianguis } = await getDirectory();
    const wednesday = filterTianguis(tianguis, { day: 'MIERCOLES' });
    assert.ok(wednesday.length > 100);
    assert.ok(wednesday.every((tianguis) => /MIÉRCOLES|MIERCOLES/i.test(tianguis.dia)));
  });
});

describe('planificador de rutas', () => {
  it('devuelve caminata, metro y caminata', async () => {
    const plan = await planRoute({ from: 'Zócalo', to: 'Mercado Jamaica' });
    assert.equal(plan.legs.length, 3);
    assert.deepEqual(
      plan.legs.map((leg) => leg.mode),
      ['walk', 'transit', 'walk']
    );
    assert.match(plan.title, /Ruta a Mercado JAMAICA/);
    assert.equal(plan.fareMxn, 5);
  });

  it('usa la ubicación del cliente cuando no hay hito', async () => {
    const plan = await planRoute({
      from: 'Mi ubicación',
      to: 'Mercado Jamaica',
      coordinates: { lat: 19.4326, lon: -99.1332 }
    });
    assert.equal(plan.originLabel, 'Mi ubicación');
    assert.equal(plan.legs[0].points[0].lat, 19.4326);
  });
});

describe('API HTTP', () => {
  /** @type {import('node:http').Server} */
  let server;
  let baseUrl;

  before(async () => {
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  });

  after(async () => {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  });

  it('sirve el bundle de comercio', async () => {
    const response = await fetch(`${baseUrl}/commerce/directory`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.mercados.length, 329);
    assert.equal(data.tianguis.length, 1_367);
  });

  it('planifica una ruta por POST', async () => {
    const response = await fetch(`${baseUrl}/routing/plan`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from: 'Bellas Artes', to: 'Mercado Jamaica' })
    });
    assert.equal(response.status, 200);
    const plan = await response.json();
    assert.equal(plan.legs.length, 3);
  });
});
