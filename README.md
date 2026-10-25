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
| `npm run import:photos` | Convierte `../fotos` a WebP y genera el manifiesto de fotos |
| `npm run build:mercomuna` | Genera `data/commerce/mercomuna.json` desde el cruce de Incertianguis |
| `npm run build:mercomuna -- --source=<ruta.csv>` | Usa otro CSV de entrada |
| `npm run seed:feedback` | Regenera `data/feedback/events.json` con 60 eventos sintéticos |
| `npm run build:giros` | Cruza `tianguis-cdmx.csv` con el directorio y añade `giro` / `categorias` a cada tianguis |

## Arquitectura

```text
apps/
  web/                 React 19 + Vite + Leaflet
    src/app/           shell: composición y estado de selección
    src/map/           MapProvider, registro de capas, geolocalización
    src/shell/         sidebar, FABs, ficha de detalle, accesos rápidos
    src/domains/
      geo/             alcaldías y ZMVM
      commerce/        tianguis, buscador y chips
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
| GET | `/api/v1/commerce/directory` | tianguis |
| GET | `/api/v1/commerce/tianguis?day=&alcaldia=&colonia=&direccion=&giro=&vialidad=&q=` | tianguis filtrados |
| GET | `/api/v1/commerce/mercomuna?q=&alimentos=1` | comercios que aceptan vales Mercomuna |
| POST | `/api/v1/feedback` | registra una respuesta anónima sobre un comercio (201, o 400 si trae datos personales) |
| GET | `/api/v1/feedback/summary` | respuestas agregadas por CP y giro |

### Buscador

El buscador filtra en vivo y ofrece las opciones en una lista agrupada por
dimensión: dirección o tramo, día, giro, tipo de vialidad (`Avenida`, `Calle`,
`Calzada`, `Eje`, `Cerrada`…), colonia y alcaldía. Cada opción muestra cuántos
tianguis quedarían con los demás filtros aplicados; elegirla la convierte en un
chip removible y el mapa se acerca a los resultados.

El texto libre es tolerante a acentos y busca en calle, colonia, alcaldía, día,
giro y vialidad. La lógica vive en `packages/contracts/src/commerce.js`
(`filterTianguis`, `buildSearchOptions`, `vialidadDeTianguis`) y la comparten el
cliente y la API, para que el conteo y los marcadores dibujados no discrepen.

## Datos

Los artefactos provienen del visor legado y se congelaron con checksum para poder verificar la migración:

```json
{
  "alcaldias": 16,
  "zmvm": 60,
  "metroStations": 195,
  "metrobusStations": 324,
  "tianguis": 1367
}
```

Checksum del bundle legado: `3ab4cdb9614ff79410005bf886306236155c5ba99aa927fc44d1e6fff6c9d690`.

Los **329 mercados públicos** y las **51 rutas de mercados sobre ruedas (MSR)** del visor legado se excluyeron del producto: no se sirven por API ni se dibujan en el mapa. El mapa conserva únicamente los tianguis.

También se retiraron los **trazos de la Red MI**. Solo se conservan las estaciones de Metro y Metrobús: se dibujan tenues y aparecen al llegar a zoom 14.

## Giro de los tianguis

Cada punto del mapa es un puesto ilustrado (`apps/web/public/tianguis/`): la
misma imagen en nueve colores, uno por categoría del catálogo del equipo de
datos (`data/catalog/giros_catalogo.json`), más el rojo original para los
tianguis que no declaran giro.

El campo `GIRO` del directorio ADIP es texto libre y 1,053 de 1,367 filas vienen
vacías (`na`). `npm run build:giros` lo cruza con `../tianguis-cdmx.csv` por la
llave natural (alcaldía + colonia + calle + día) y escribe en cada tianguis:

| campo | contenido |
|---|---|
| `giro` | texto original del CSV, sin perder información |
| `categorias` | ids del catálogo, el principal primero (un giro compuesto puede traer varios) |
| `sinGiro` | `true` cuando el directorio no declara giro |

Las 27 filas que en vez de giro traen el conteo de puestos
(`"103 básicos, 192 complementarios y 14 alimentos preparados"`) se ordenan por
familias de mayor a menor puestos. El reparto actual: 1,053 sin dato, 158 bazar
y chácharas, 107 abarrotes y canasta básica, 26 ropa y calzado, 20 comida
preparada, 3 oficios y servicios.

El runtime ya **no ejecuta Python**. La extracción desde el HTML legado es un paso de migración, no una dependencia de producción.

## Fotos de los tianguis

La carpeta `../fotos` del repositorio de trabajo guarda una carpeta por tianguis.
El número de carpeta es el **índice 0-based** del tianguis en el directorio:

```text
fotos/0002/featured.jpg    -> tianguis[2]  (foto principal de Google Maps)
fotos/0002/streetview.jpg  -> tianguis[2]  (vista de calle)
```

`npm run import:photos` (requiere ImageMagick) genera dos WebP por imagen —una
miniatura de 360 px para el hover y una versión de 900 px para la ficha— en
`apps/web/public/tianguis/fotos/`, y escribe `data/commerce/photos.json`. La API
adjunta ese manifiesto como `idx` y `fotos` a cada tianguis del directorio. Si
una imagen no existe, el tianguis conserva su ficha y el marcador no muestra
tooltip de foto.

En el mapa, pasar el cursor sobre un puesto abre una tarjeta con su foto; al
hacer click se abre la vista previa con la galería, las miniaturas `Foto` y
`Calle`, y la foto en grande. Los archivos generados no se editan a mano: se
regeneran con el comando anterior (`-- --force` rehace todo).

## Estado

- Cliente y API funcionando con paridad visual y funcional respecto al visor legado.
- Calendario semanal de tianguis con el conteo de abiertos por día, opción “Todos” y el día actual seleccionado por defecto.
- Tests de datos y endpoints: `npm test`.
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
