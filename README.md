# Mapatianguis

Cliente React + API Node para un mapa **informativo de tianguis y comercio popular de la CDMX** (Chilangatón 2026 · Reto 1). No es una app de navegación: sirve para descubrir qué tianguis hay, cuándo abren y qué estaciones de transporte tienen cerca. Es la migración del visor autocontenido de `tianuisCDMX` a una aplicación con datos servidos por API y estructura por dominios.

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
| `npm run build:mercomuna` | Genera `data/commerce/mercomuna.json` desde el cruce de Incertianguis |
| `npm run build:mercomuna -- --source=<ruta.csv>` | Usa otro CSV de entrada |
| `npm run seed:feedback` | Regenera `data/feedback/events.json` con 60 eventos sintéticos |

## Arquitectura

```text
apps/
  web/                 React 19 + Vite + Leaflet
    src/app/           shell: composición y estado de selección
    src/map/           MapProvider, registro de capas, geolocalización
    src/shell/         sidebar, FABs, ficha de detalle, accesos rápidos
    src/domains/
      geo/             alcaldías y ZMVM
      commerce/        MSR, tianguis, buscador y chips
      mobility/        estaciones Metro/Metrobús como referencia
    src/shared/        HTTP y primitivas de UI
  api/                 Node + Express
    src/domains/       geo | commerce | mobility
                         (routes + service por dominio)
    src/data/          lector cacheado de data/
    src/core/          errores HTTP
packages/
  contracts/           tipos JSDoc, constantes y utilidades puras compartidas
data/
  geo/ mobility/ commerce/   artefactos migrados, un archivo por dominio
scripts/
  migrate-legacy-data.mjs    extracción desde el visor legado
  build-mercomuna.mjs        CSV de Incertianguis -> commerce/mercomuna.json
  verify-data.mjs            validación del contrato de datos
  dev.mjs                    arranque paralelo
```

### Regla de las slices

Cada dominio es dueño de su **cliente API**, sus **capas de Leaflet** y sus **componentes**. El shell compone; no conoce los internos de cada slice. Los contratos compartidos viven en `packages/contracts`.

Dependencias permitidas en el backend:

```text
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
| GET | `/api/v1/mobility/network` | estaciones Metro/Metrobús |
| GET | `/api/v1/mobility/stations/metro` | 195 estaciones |
| GET | `/api/v1/mobility/stations/metrobus` | 324 estaciones |
| GET | `/api/v1/commerce/directory` | MSR + tianguis |
| GET | `/api/v1/commerce/msr` | mercados sobre ruedas |
| GET | `/api/v1/commerce/tianguis?day=&alcaldia=&q=` | tianguis filtrados |
| GET | `/api/v1/commerce/mercomuna?q=&alimentos=1` | comercios que aceptan vales Mercomuna |
| POST | `/api/v1/feedback` | registra una respuesta anónima sobre un comercio (201, o 400 si trae datos personales) |
| GET | `/api/v1/feedback/summary` | respuestas agregadas por CP y giro |

## Datos

Los artefactos provienen del visor legado y se congelaron con checksum para poder verificar la migración:

```json
{
  "alcaldias": 16,
  "zmvm": 60,
  "metroStations": 195,
  "metrobusStations": 324,
  "msr": 51,
  "tianguis": 1367
}
```

### Vales Mercomuna

Capa opcional (chip **💳 Vales Mercomuna**, apagada por defecto) con los comercios
donde se pueden usar los vales del programa Mercomuna, vigentes hasta el
**31 de diciembre de 2026**.

Viene del trabajo del equipo *Principio de Incertianguis* (Chilangatón 2026, reto
"Comercio popular y barrial"): `incertianguis/data/processed/mercomuna.csv`
— el directorio público de `comercios-mercomuna.cdmx.gob.mx` geocodificado
contra el DENUE. `scripts/build-mercomuna.mjs` lo convierte en
`data/commerce/mercomuna.json` (3 MB, ~320 KB con gzip).

```json
{
  "resumen": {
    "total": 8798,
    "alimentos": 3858,
    "precisos": 2029,
    "aproximados": 6755,
    "sinUbicacion": 14,
    "porCp": 691
  }
}
```

La capa respeta la precisión de origen, porque solo el **23%** de los comercios
tiene ubicación exacta:

| `precision` | Qué se dibuja |
| --- | --- |
| `exacta` (2,029) | chincheta propia del comercio, visible desde zoom 13 |
| `cp` (6,755) | **un círculo por código postal** (691), con el número de comercios; son centroides DENUE compartidos, no direcciones |
| `sin_ubicacion` (14) | nada; solo cuentan en el chip |

Nunca se pintan los centroides de CP como si fueran ubicaciones de comercio:
`imprecisa: true` lo deja explícito en el contrato y la ficha de detalle lo
advierte. La capa pesada se descarga solo cuando el chip se enciende por primera
vez.

Checksum del bundle legado: `3ab4cdb9614ff79410005bf886306236155c5ba99aa927fc44d1e6fff6c9d690`.

Los **329 mercados públicos** del visor legado se excluyeron del producto: no se sirven por API ni se dibujan en el mapa. Se conservan los tianguis y las rutas de mercados sobre ruedas (MSR).

También se retiraron los **trazos de la Red MI**. Solo se conservan las estaciones de Metro y Metrobús: se dibujan tenues y aparecen al llegar a zoom 14.

El runtime ya **no ejecuta Python**. La extracción desde el HTML legado es un paso de migración, no una dependencia de producción.

## Estado

- Cliente y API funcionando con paridad visual y funcional respecto al visor legado.
- Calendario semanal de tianguis con el conteo de abiertos por día, opción “Todos” y el día actual seleccionado por defecto.
- Tests de datos y endpoints: `npm test`.
- Capa de vales Mercomuna con chip apagado por defecto, respetando la precisión
  de geocodificación de origen.
- Pendientes principales: portar el ETL a Node y definir despliegue. Ver [`MIGRACION.md`](./MIGRACION.md).

### Retroalimentación (feedback)

Dominio para recibir las respuestas voluntarias del prototipo *Canjea Cerca* (repo `incertianguis`, carpeta `app/`).

- `POST /api/v1/feedback` recibe `{fecha, cp, giro, respuesta, encontro, dificultad, busca}` y responde `201 {ok:true}`. Responde `400 {error, detalles}` cuando:
  - trae cualquier otro campo (`lat`, `lon`, `nombre`, `telefono`...);
  - el texto libre parece un teléfono, correo, URL, coordenada, CURP o RFC;
  - el CP no es de la CDMX o la fecha trae hora.
- `GET /api/v1/feedback/summary` agrega por `cp` y `giro`: `aceptados`, `noAceptados`, `tasaAceptacion`, `tasaRechazo`, `encontro`, `dificultadComun` y `productosBuscados`. Va con `Cache-Control: no-store`.
- Los eventos se guardan en `data/feedback/events.json`. El archivo versionado trae **60 eventos sintéticos** (Iztapalapa, Tlalpan y Coyoacán, 20 cada una). Los CP son reales; las respuestas son inventadas. Para regenerarlos: `npm run seed:feedback`. Los tests escriben en una copia temporal (`FEEDBACK_FILE`).
- El contrato (validación y agregado) vive en `packages/contracts/src/feedback.js`.
