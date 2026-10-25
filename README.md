# Mapatianguis

Cliente React + API Node para el mapa de **comercio popular, barrial y movilidad integrada de la CDMX** (Chilangatón 2026 · Reto 1). Es la migración del visor autocontenido de `tianuisCDMX` a una aplicación con datos servidos por API y estructura por dominios.

## Inicio rápido

```bash
npm install
npm run dev
```

- Cliente: http://localhost:5173
- API: http://localhost:3001/api/v1/health

Para producción:

```bash
npm run build
npm start
# http://localhost:3001  (la API sirve el build de React)
```

Si necesitas regenerar los artefactos de datos desde el visor legado:

```bash
npm run migrate:data
npm run verify:data
```

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | API + Vite en paralelo |
| `npm run dev:api` | Solo API con `node --watch` |
| `npm run dev:web` | Solo cliente con Vite |
| `npm run build` | Build de producción del cliente |
| `npm start` | API en modo producción (sirve `apps/web/dist`) |
| `npm test` | Tests de contrato, datos y endpoints |
| `npm run verify:data` | Valida conteos, campos y geometrías |
| `npm run migrate:data` | Extrae datos/CSS/fuentes del HTML legado |
| `npm run migrate:data -- ../ruta/mapa.html` | Migra desde otro HTML |

## Arquitectura

```text
apps/
  web/                 React 19 + Vite + Leaflet
    src/app/           shell: composición, estado de selección y ruteo
    src/map/           MapProvider, registro de capas, geolocalización
    src/shell/         sidebar, FABs, ficha de detalle, accesos rápidos
    src/domains/
      geo/             alcaldías y ZMVM
      commerce/        mercados, MSR, tianguis, buscador y chips
      mobility/        Red MI, estaciones y control de líneas
      routing/         planificador, resultados y trazo de ruta
    src/shared/        HTTP y primitivas de UI
  api/                 Node + Express
    src/domains/       geo | commerce | mobility | routing
                         (routes + service por dominio)
    src/data/          lector cacheado de data/
    src/core/          errores HTTP
packages/
  contracts/           tipos JSDoc, constantes y utilidades puras compartidas
data/
  geo/ mobility/ commerce/   artefactos migrados, un archivo por dominio
scripts/
  migrate-legacy-data.mjs    extracción desde el visor legado
  verify-data.mjs            validación del contrato de datos
  dev.mjs                    arranque paralelo
```

### Regla de las slices

Cada dominio es dueño de su **cliente API**, sus **capas de Leaflet** y sus **componentes**. El shell compone; no conoce los internos de cada slice. Los contratos compartidos viven en `packages/contracts`.

Dependencias permitidas en el backend:

```text
routing -> commerce, mobility
commerce, mobility, geo -> data store
```

Ningún dominio importa las rutas ni los componentes de otro.

### Mapa

Se conserva **Leaflet** y el lenguaje visual original. React es dueño del estado y la UI; Leaflet es dueño de las primitivas del mapa a través de un registro de capas (`MapProvider`). Así se evitan reescrituras de popups, `divIcon` y grupos de capas que no aportarían ningún beneficio visible.

## API

| Método | Ruta | Devuelve |
| --- | --- | --- |
| GET | `/api/v1/health` | estado del servicio |
| GET | `/api/v1/meta` | conteos, checksum y endpoints |
| GET | `/api/v1/geo/alcaldias` | GeoJSON de 16 alcaldías |
| GET | `/api/v1/geo/zmvm` | GeoJSON de 60 municipios conurbados |
| GET | `/api/v1/mobility/network` | trazos MI + estaciones Metro/Metrobús |
| GET | `/api/v1/mobility/stations/metro` | 195 estaciones |
| GET | `/api/v1/mobility/stations/metrobus` | 324 estaciones |
| GET | `/api/v1/commerce/directory` | mercados + MSR + tianguis |
| GET | `/api/v1/commerce/mercados?q=&alcaldia=` | mercados filtrados |
| GET | `/api/v1/commerce/msr` | mercados sobre ruedas |
| GET | `/api/v1/commerce/tianguis?day=&alcaldia=&q=` | tianguis filtrados |
| POST | `/api/v1/routing/plan` | plan de ruta |

```bash
curl -X POST http://localhost:3001/api/v1/routing/plan \
  -H 'content-type: application/json' \
  -d '{"from":"Zócalo","to":"Mercado Jamaica"}'
```

## Datos

Los artefactos provienen del visor legado y se congelaron con checksum para poder verificar la migración:

```json
{
  "alcaldias": 16,
  "zmvm": 60,
  "transportLines": 205,
  "metroStations": 195,
  "metrobusStations": 324,
  "mercados": 329,
  "msr": 51,
  "tianguis": 1367
}
```

Checksum del bundle legado: `3ab4cdb9614ff79410005bf886306236155c5ba99aa927fc44d1e6fff6c9d690`.

El runtime ya **no ejecuta Python**. La extracción desde el HTML legado es un paso de migración, no una dependencia de producción.

## Estado

- Cliente y API funcionando con paridad visual y funcional respecto al visor legado.
- Tests de datos, ruteo y endpoints: `npm test`.
- Pendientes principales: portar el ETL a Node, conectar el motor real de ruteo y definir despliegue. Ver [`MIGRACION.md`](./MIGRACION.md).
