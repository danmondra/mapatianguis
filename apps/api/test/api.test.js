import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.js';
import {
  buildSearchOptions,
  filterTianguis,
  vialidadDeTianguis
} from '@mapatianguis/contracts/commerce';
import { getDirectory } from '../src/domains/commerce/commerce.service.js';
import { getMetroStations } from '../src/domains/mobility/mobility.service.js';

describe('datos migrados', () => {
  it('conserva los conteos del visor legado', async () => {
    const { tianguis } = await getDirectory();
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

  it('adjunta el índice y las fotos importadas a cada tianguis', async () => {
    const { tianguis } = await getDirectory();
    const conFoto = tianguis.find((item) => item.fotos?.principal);

    assert.ok(conFoto, 'el manifiesto debe tener al menos una foto principal');
    assert.equal(conFoto.idx, tianguis.indexOf(conFoto));
    assert.match(conFoto.fotos.principal.thumb, /^\/tianguis\/fotos\/\d{4}\//);
    assert.match(conFoto.fotos.principal.full, /^\/tianguis\/fotos\/\d{4}\//);
    assert.ok(tianguis.filter((item) => item.fotos).length >= 400);
  });

  it('filtra por giro usando el catálogo, no el texto libre', async () => {
    const { tianguis } = await getDirectory();
    const bazar = filterTianguis(tianguis, { giro: 'CAT_BAZAR_CHACHARAS' });
    assert.ok(bazar.length > 0);
    assert.ok(
      bazar.every((tianguis) => tianguis.categorias?.[0] === 'CAT_BAZAR_CHACHARAS')
    );
  });

  it('deriva la vialidad del tramo principal de la ubicación', async () => {
    const { tianguis } = await getDirectory();

    // Abreviaturas y acentos: AV. / AVENIDA / CALLE. El tramo antes de
    // "ENTRE" manda; las calles que cruzan no cambian la clasificación.
    assert.equal(
      vialidadDeTianguis({ ubicacion: 'AV. CHICAGO ENTRE URANO Y JÚPITER' }),
      'AVENIDA'
    );
    assert.equal(
      vialidadDeTianguis({ ubicacion: 'CALZ. DE LAS ÁGUILAS ENT. AGAMENÓN E ILÍADA' }),
      'CALZADA'
    );
    assert.equal(
      vialidadDeTianguis({ ubicacion: 'CDA. CAPULÍN ENT. 14 DE FEBRERO Y AV. 29 DE OCT.' }),
      'CERRADA'
    );
    assert.equal(
      vialidadDeTianguis({ ubicacion: 'ADOLFO DE LA HUERTA ENTRE RUIZ CORTINEZ Y BENITO JUAREZ' }),
      'CALLE'
    );

    const avenidas = filterTianguis(tianguis, { vialidad: 'AVENIDA' });
    assert.ok(avenidas.length > 0);
    assert.ok(avenidas.every((tianguis) => vialidadDeTianguis(tianguis) === 'AVENIDA'));
  });

  it('busca en vivo por calle, colonia, giro, día y vialidad', async () => {
    const { tianguis } = await getDirectory();
    const matches = filterTianguis(tianguis, { q: 'insurgentes' });
    assert.ok(matches.length > 0);
    assert.ok(
      matches.every((tianguis) =>
        `${tianguis.ubicacion} ${tianguis.colonia} ${tianguis.alcaldia}`
          .toLowerCase()
          .includes('insurgentes')
      )
    );
  });

  it('cuenta opciones sin aplicar la dimensión que se está eligiendo', async () => {
    const { tianguis } = await getDirectory();
    const options = buildSearchOptions(tianguis, { day: 'LUNES' });

    assert.equal(options.total, filterTianguis(tianguis, { day: 'LUNES' }).length);
    assert.equal(options.dayTotal, tianguis.length);
    assert.equal(options.giroTotal, options.total);
    assert.equal(options.vialidadTotal, options.total);

    const lunes = options.days.find((day) => day.value === 'LUNES');
    assert.equal(lunes.count, filterTianguis(tianguis, { day: 'LUNES' }).length);
    assert.ok(options.direcciones.length > 0);
    assert.ok(options.alcaldias.length > 0);
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
    assert.equal(data.msr, undefined);
    assert.equal(data.tianguis.length, 1_367);
  });

  it('ya no expone el directorio Mercomuna', async () => {
    const response = await fetch(`${baseUrl}/commerce/mercomuna`);
    assert.equal(response.status, 404);
  });

  it('ya no expone el endpoint de mercados públicos', async () => {
    const response = await fetch(`${baseUrl}/commerce/mercados`);
    assert.equal(response.status, 404);
  });

  it('ya no expone el endpoint de MSR', async () => {
    const response = await fetch(`${baseUrl}/commerce/msr`);
    assert.equal(response.status, 404);
  });

  it('filtra por giro y vialidad desde la API', async () => {
    const giro = await fetch(`${baseUrl}/commerce/tianguis?giro=CAT_BAZAR_CHACHARAS`);
    assert.equal(giro.status, 200);
    assert.ok((await giro.json()).length > 0);

    const vialidad = await fetch(`${baseUrl}/commerce/tianguis?vialidad=AVENIDA`);
    assert.equal(vialidad.status, 200);
    const avenidas = await vialidad.json();
    assert.ok(avenidas.length > 0);
    assert.ok(avenidas.every((tianguis) => vialidadDeTianguis(tianguis) === 'AVENIDA'));
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
