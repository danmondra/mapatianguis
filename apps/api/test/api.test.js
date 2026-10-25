import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.js';
import { filterTianguis } from '@mapatianguis/contracts/commerce';
import { normalizeText } from '@mapatianguis/contracts';
import { getDirectory, getMercomuna } from '../src/domains/commerce/commerce.service.js';
import { getMetroStations } from '../src/domains/mobility/mobility.service.js';

describe('datos migrados', () => {
  it('conserva los conteos del visor legado', async () => {
    const { msr, tianguis } = await getDirectory();
    assert.equal(msr.length, 51);
    assert.equal(tianguis.length, 1_367);
    assert.equal((await getMetroStations()).length, 195);
  });

  it('filtra tianguis por alcaldía sin distinguir acentos', async () => {
    const { tianguis } = await getDirectory();
    const matches = filterTianguis(tianguis, { alcaldia: 'ÁLVARO OBREGÓN' });
    assert.ok(matches.length > 0);
    assert.ok(matches.every((tianguis) => tianguis.alcaldia === 'ALVARO OBREGON'));
  });

  it('filtra tianguis por día con acentos normalizados', async () => {
    const { tianguis } = await getDirectory();
    const wednesday = filterTianguis(tianguis, { day: 'MIERCOLES' });
    assert.ok(wednesday.length > 100);
    assert.ok(wednesday.every((tianguis) => /MIÉRCOLES|MIERCOLES/i.test(tianguis.dia)));
  });
});

describe('directorio Mercomuna', () => {
  it('conserva los conteos del cruce de Incertianguis', async () => {
    const { resumen } = await getMercomuna();
    assert.equal(resumen.total, 8_798);
    assert.equal(resumen.precisos, 2_029);
    assert.equal(resumen.aproximados, 6_755);
    assert.equal(resumen.sinUbicacion, 14);
    assert.equal(resumen.porCp, 691);
  });

  it('nunca marca como precisa una coordenada de centroide de CP', async () => {
    const { comercios } = await getMercomuna();
    const aproximados = comercios.filter((comercio) => comercio.precision === 'cp');
    assert.ok(aproximados.every((comercio) => comercio.imprecisa === true));
    assert.ok(
      comercios
        .filter((comercio) => comercio.precision === 'exacta')
        .every((comercio) => comercio.imprecisa === false)
    );
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
    assert.equal(data.mercados, undefined);
    assert.equal(data.msr.length, 51);
    assert.equal(data.tianguis.length, 1_367);
  });

  it('sirve el directorio de comercios con vales Mercomuna', async () => {
    const response = await fetch(`${baseUrl}/commerce/mercomuna`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.comercios.length, 8_798);
    assert.equal(data.porCp.length, 691);
    assert.equal(data.vigenteHasta, '2026-12-31');
    assert.ok(data.comercios.every((comercio) => comercio.aceptaVales === true));
  });

  it('filtra Mercomuna por texto y por alimentos', async () => {
    const response = await fetch(`${baseUrl}/commerce/mercomuna?alimentos=1&q=carniceria`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.ok(data.comercios.length > 0);
    assert.ok(data.comercios.every((comercio) => comercio.alimentos));
    // El buscador ignora acentos: "Carnicería" entra en "carniceria".
    assert.ok(
      data.comercios.every((comercio) =>
        normalizeText(
          `${comercio.nombre} ${comercio.categoria ?? ''} ${comercio.giro} ${comercio.calle}`
        ).includes('carniceria')
      )
    );
    assert.ok(data.porCp.length <= 691);
  });

  it('ya no expone el endpoint de mercados públicos', async () => {
    const response = await fetch(`${baseUrl}/commerce/mercados`);
    assert.equal(response.status, 404);
  });

  it('sirve estaciones sin trazos de movilidad', async () => {
    const response = await fetch(`${baseUrl}/mobility/network`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.transport, undefined);
    assert.equal(data.metroStations.length, 195);
    assert.equal(data.metrobusStations.length, 324);
  });

  it('ya no expone el planificador de rutas', async () => {
    const response = await fetch(`${baseUrl}/routing/plan`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from: 'Bellas Artes', to: 'Mercado Jamaica' })
    });
    assert.equal(response.status, 404);
  });
});
