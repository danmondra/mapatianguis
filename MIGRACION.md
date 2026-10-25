# Migración `tianuisCDMX` → `mapatianguis`

> Documento de trabajo. Resume la auditoría del visor legado, la arquitectura objetivo, lo que ya quedó migrado y lo que falta para que la migración sea realmente útil.

---

## 1. Resumen ejecutivo

El visor legado era un **HTML autocontenido de 3.6 MB**: datos, CSS, fuentes, lógica y renderizado en un solo archivo. Eso impedía reutilizar los datos, probar la lógica, iterar la UI y separar responsabilidades.

La migración ya tiene un **walking skeleton funcional**:

- Cliente React que consume una API Node; ya no hay datos incrustados en el HTML.
- Mapa Leaflet idéntico, con las mismas capas de comercio, popups, chips, ficha de detalle, buscador y sidebar colapsable.
- Backend por dominios (`geo`, `commerce`, `mobility`) con datos cacheados y endpoints versionados.
- Contratos compartidos en `packages/contracts`.
- Datos extraídos del HTML legado, separados por dominio y validados con checksum.
- Tests de datos y endpoints; build de producción verificado.

Lo que **falta** para completar la intención original (JS en todo el pipeline) es la parte más costosa y menos visible: portar el ETL de Python a Node. El runtime ya no depende de Python.

---

## 2. Auditoría del punto de partida

| Activo | Estado legado | Problema |
| --- | --- | --- |
| Visor | `mapa_comercio_movilidad_cdmx.html` (3.6 MB) | Datos, CSS y lógica en un archivo; no cacheable por capas |
| Datos | `data/processed/map_bundle.json` (3.4 MB) + CSV/GeoJSON | Duplicados entre HTML y bundle; sin API |
| CSS | 24 KB dentro del HTML + fuentes base64 | Sin tokens ni componentes reutilizables |
| Lógica de mapa | ~700 líneas de JS global con `onclick` | Acoplada a IDs del DOM; difícil de testear |
| Búsqueda | Solo mercados, lineal sobre el bundle | Sin contrato ni índice |
| Filtro “Abrir Hoy” | `includes()` sin normalizar acentos | Fallaba para `MIÉRCOLES` y `SÁBADO` |
| Ruteo | Heurística “Metro más cercano” en el navegador | No usaba el motor real `route_calculator.py` |
| ETL | Python: `normalize_all.py`, `generate_catalog.py`, `compile_advanced_bundle.py` | Fuera del stack JS objetivo |
| Ruteo real | Python: NetworkX + SciPy + pickle | No portable a Node tal cual |
| Generador de HTML | `generate_cdmx_app_style.py` | Queda obsoleto al adoptar Vite/React |

### Volumen real de datos

| Dominio | Archivo | Raw | Gzip |
| --- | --- | ---: | ---: |
| Geo | alcaldías | 665 KB | 253 KB |
| Geo | ZMVM | 1.2 MB | 230 KB |
| Movilidad | estaciones Metro | 39 KB | 7 KB |
| Movilidad | estaciones Metrobús | 38 KB | 8 KB |
| Comercio | tianguis | 295 KB | 53 KB |
| **Total** | | **2.2 MB** | **~0.55 MB** |

La API responde con `compression`; la primera carga completa queda por debajo de 1 MB comprimido. No es urgente vectorizar ni teselar.

---

## 3. Qué significa “que funcione como cliente”

Criterios que ya se cumplen:

1. El navegador **no contiene los datos**: los pide a `/api/v1/*`.
2. La API es la única fuente de verdad para datos.
3. El cliente puede desplegarse aparte (Vite) o servirse desde el mismo Node.
4. Cada dominio tiene una interfaz pequeña y estable:
   - `GET /commerce/directory`
   - `GET /mobility/network`
   - `GET /geo/alcaldias`
5. El mapa sigue siendo Leaflet y se ve igual; React solo orquesta estado y UI.

Lo que **no** significa: reescribir el mapa con otra librería o cambiar el diseño. Eso habría agregado riesgo sin beneficio para el objetivo.

---

## 4. Arquitectura objetivo

```text
apps/web (React + Vite)          apps/api (Node + Express)
┌──────────────────────┐         ┌─────────────────────────┐
│ shell                │         │ core / data store       │
│  ├─ geo              │  HTTP   │  ├─ geo                 │
│  ├─ commerce         │ <─────> │  ├─ commerce            │
│  └─ mobility         │         │  └─ mobility            │
└──────────┬───────────┘         └───────────┬─────────────┘
           │                                 │
           └──── packages/contracts ─────────┘
                 tipos JSDoc + constantes
                 + utilidades puras
```

### Slices y responsabilidades

| Slice | Cliente | API | Datos |
| --- | --- | --- | --- |
| `geo` | `GeoLayers` | `geo.routes/service` | alcaldías, ZMVM |
| `commerce` | `CommerceLayers`, `CommerceSearch`, `CommerceControls` | `commerce.routes/service` | tianguis |
| `mobility` | `MobilityLayers`, `MobilitySection` | `mobility.routes/service` | estaciones Metro/Metrobús |
| `shell` | `Sidebar`, `DetailCard`, `MapFabStack`, `QuickAccess` | — | — |
| `shared` | HTTP, `Chip`, `Section`, selección | errores HTTP | — |

Reglas:

- Cada slice es dueña de su API client, sus capas y sus componentes.
- El shell compone; no importa internals de otra slice.
- Los contratos y helpers puros viven en `packages/contracts` para que API y cliente no se desincronicen.

### El seam del mapa

React no renderiza los marcadores. `MapProvider` crea el mapa y mantiene un registro de capas; cada slice registra sus `FeatureGroup`/`GeoJSON` y `MapProvider` aplica visibilidad. Esto:

- conserva los `divIcon`, popups y estilos exactos;
- evita el costo de migrar a `react-leaflet`;
- deja una interfaz pequeña: crear capa, registrarla, alternar visibilidad.

---

## 5. Lo que ya quedó migrado

- [x] Extracción reproducible del `MAP_DATA` legado a archivos por dominio.
- [x] CSS y fuente de iconografía de estaciones conservados.
- [x] API Node con endpoints por dominio, caché en memoria, gzip y cache headers.
- [x] React con mapa Leaflet, capas, chips, buscador, ficha de detalle, “Abrir Hoy”, geolocalización, FABs y sidebar colapsable.
- [x] Contratos JSDoc compartidos y utilidades de normalización de texto/días.
- [x] Tests de datos y API (`npm test`).
- [x] Validación de artefactos (`npm run verify:data`).
- [x] Build de producción y servido desde el mismo Node.
- [x] Verificación visual 1440×900 sin errores de consola.

### Cambios intencionales respecto al legado

| Cambio | Motivo |
| --- | --- |
| Calendario semanal de tianguis con conteo por día, opción “Todos” y el día actual seleccionado | Reemplaza el botón “Abrir Hoy”; normaliza acentos para `MIÉRCOLES`/`SÁBADO` |
| Se retiraron los 329 mercados públicos y las 51 rutas MSR | El producto se enfoca solo en tianguis; se eliminaron datos, endpoints, capas, chips y fichas |
| Se retiraron los trazos de la Red MI | Las estaciones quedan como referencia; se eliminaron datos, capas y selector de líneas |
| Las estaciones se atenúan y aparecen con zoom 14 | Evitan saturar la vista metropolitana sin perder el detalle local |
| Se eliminó el planificador y todo el dominio de ruteo | La app es informativa sobre tianguis, no una app de navegación |
| El buscador filtra por dirección, día, giro, vialidad, colonia y alcaldía, y muestra las opciones en lista | Reemplaza la búsqueda lineal de mercados del legado y el `focusTianguis` que sólo abría el primer resultado |

---

## 6. Plan restante, en orden de valor

### P0 — Cerrar decisiones de proyecto (antes de seguir)

1. **Repositorio y remoto**: `mapatianguis` aún no es un repo git. Definir si se inicializa aquí y cuál será el remoto.
2. **Paquete**: se usó npm workspaces. Confirmar npm o migrar a pnpm.
3. **Despliegue**: elegir entre (a) un solo Node que sirve API + estáticos, o (b) front en CDN y API aparte. La app ya soporta ambas.
4. **Política de datos**: decidir si `data/` se versiona (hoy son 2.2 MB) o se regenera en CI.
5. **Compatibilidad**: fijar versión mínima de Node (hoy `>=20`; se probó con Node 26).

**Criterio de salida**: README con URL de despliegue, rama principal y comando único de release.

### P1 — Portar el ETL a JS (la parte que falta para “JS en todo el pipeline”)

Orden recomendado, de menor a mayor riesgo:

1. **`compile_advanced_bundle.py` → Node**
   - Leer los GeoJSON de cartografía y de estaciones Metro/Metrobús.
   - Generar `data/mobility/*` y `data/geo/*`.
   - Test de paridad: mismos conteos y checksum por archivo contra los artefactos actuales.
2. **`generate_catalog.py` / `giro_classifier.py` → Node**
   - Mismas reglas y catálogo de 67 giros.
   - Fixtures de clasificación y comparación contra salida Python.
3. **`normalize_all.py` → Node**
   - Es el más grande: CSV, XLSX, parsing de horarios, normalización de alcaldías/colonias.
   - Extraer primero las funciones puras (parseo de días/horarios, limpieza de nombres) y cubrirlas con fixtures.
   - Mantener Python como “data factory” temporal hasta que la paridad esté verificada.
4. **Eliminar `generate_cdmx_app_style.py`** y los generadores de HTML: Vite ya produce el cliente.

Librerías sugeridas: `csv-parse`, `shapefile`, `read-excel-file` (o `xlsx`), `yaml` solo si hace falta. Evitar frameworks de ETL pesados.

**Criterio de salida**: `npm run build:data` regenera desde `data/raw/` sin Python y `npm run verify:data` pasa con los mismos conteos.

### P3 — Endurecer el producto

- **Tests E2E** con Playwright: carga, búsqueda, ficha, toggles, sidebar.
- **Regresión visual** comparando capturas del legado y del cliente.
- **Móvil**: el legado no es responsive (sidebar fijo de 420 px). Definir si se mantiene o se adapta.
- **Accesibilidad**: `aria-label`, foco, navegación por teclado en chips/menú/FABs.
- **Estado en URL**: `?day=`, `?tianguis=`, para compartir vistas.
- **Observabilidad**: logs de API, métricas de latencia, errores del cliente.
- **Datos vivos**: fuente de actualización, fecha de corte visible, atribución/licencia.

---

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Portar el ETL cambia conteos o geometrías | Datos silenciosamente incorrectos | Checksums + tests de paridad por archivo |
| El visor legado se vuelve la referencia permanente | Dependencia de Python | Fecha límite de paridad y borrado del generador HTML |
| Datos pesados en git | Repo lento | Decidir versionado vs regeneración; hoy 3.2 MB es manejable |
| El cliente crece sin disciplina de slices | Vuelve el acoplamiento | Regla de imports y revisión de PR |
| API sin autenticación | Abuso si se publica | Rate limit en el proxy/CDN; no hay datos privados |

---

## 8. Decisiones pendientes (para el equipo)

1. ¿npm o pnpm?
2. ¿Un solo servicio Node o front/CDN + API?
3. ¿Los artefactos de `data/` se versionan o se generan?
4. ¿Se mantiene JS puro con JSDoc o se migra a TypeScript más adelante? La migración actual es JS por requisito; los contratos están listos para TS si se decide.
5. ¿Express se queda o se cambia a Fastify? `createApp()` ya aísla el framework.
6. ¿Se conserva la marca “Tianguis CDMX” o se renombra a “Mapatianguis”?
7. ¿Qué licencia y atribución de datos se publica?

---

## 9. Definición de “migración terminada”

- [x] El cliente no contiene datos ni lógica de servidor.
- [x] La API sirve todos los dominios y las estaciones de referencia.
- [x] La UI es visual y funcionalmente equivalente al legado (con las mejoras documentadas).
- [x] Tests y build en verde.
- [ ] El ETL corre en Node y regenera los datos desde `data/raw/`.
- [ ] Hay despliegue, CI y una persona puede levantar el proyecto con dos comandos.
- [ ] El visor legado se archiva como referencia histórica y deja de ser necesario para producir datos.
