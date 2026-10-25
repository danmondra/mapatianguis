import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTodayName } from '@mapatianguis/contracts';
import { buildSearchOptions } from '@mapatianguis/contracts/commerce';
import { findNearbyStations } from '@mapatianguis/contracts/mobility';
import { MapProvider, useMapContext } from '../map/MapProvider.jsx';
import { useUserLocation } from '../map/useUserLocation.js';
import { Sidebar } from '../shell/Sidebar.jsx';
import { MapFabStack } from '../shell/MapFabStack.jsx';
import { QuickAccess } from '../shell/QuickAccess.jsx';
import { TianguisPreview } from '../shell/TianguisPreview.jsx';
import { GeoLayers } from '../domains/geo/GeoLayers.jsx';
import { fetchGeoLayers } from '../domains/geo/api.js';
import { CommerceLayers } from '../domains/commerce/CommerceLayers.jsx';
import { CommerceSearch } from '../domains/commerce/CommerceSearch.jsx';
import { CommerceControls } from '../domains/commerce/CommerceControls.jsx';
import { fetchCommerceDirectory } from '../domains/commerce/api.js';
import { MobilityLayers } from '../domains/mobility/MobilityLayers.jsx';
import { MobilityLegend } from '../domains/mobility/MobilityLegend.jsx';
import { fetchMobilityNetwork } from '../domains/mobility/api.js';
import { HomeScreen } from './HomeScreen.jsx';

const TIANGUIS_PREVIEW_ZOOM = 16;
/** Mitad del panel derecho: deja el marcador en el centro del área visible. */
const PREVIEW_PANEL_OFFSET_PX = 180;

/** Filtros que no dependen del calendario ni de los giros del panel. */
const EMPTY_SEARCH_FILTERS = Object.freeze({
  q: '',
  vialidad: null,
  direccion: null,
  colonia: null,
  alcaldia: null
});

export default function App() {
  // El home es la entrada. El visor se monta al abrirlo y se desmonta al
  // volver, para no dejar el mapa vivo debajo de una pantalla estática.
  const [view, setView] = useState('home');

  if (view === 'home') {
    return <HomeScreen onOpenMap={() => setView('map')} />;
  }

  return (
    <MapProvider>
      <AppShell onGoHome={() => setView('home')} />
    </MapProvider>
  );
}

function AppShell({ onGoHome }) {
  const { map, toggleBaseMap, resetView, refreshSize, setLayerVisible } =
    useMapContext();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [data, setData] = useState({ geo: null, mobility: null, commerce: null });
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedDay, setSelectedDay] = useState(() => getTodayName());
  // Lista vacía = todos los giros. Se guarda como arreglo ordenado para que el
  // filtro del mapa se reaplique sólo cuando cambia de verdad.
  const [selectedGiros, setSelectedGiros] = useState([]);
  // Filtros del buscador que no tienen un control propio en el panel.
  const [searchFilters, setSearchFilters] = useState(EMPTY_SEARCH_FILTERS);

  const commerceMapRef = useRef(null);
  // El mapa se sincroniza en un efecto: el buscador y el panel comparten un
  // solo objeto de filtros y no pueden quedar desfasados.
  const filtersRef = useRef(null);
  const fitNextRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchGeoLayers(),
      fetchMobilityNetwork(),
      fetchCommerceDirectory()
    ])
      .then(([geo, mobility, commerce]) => {
        if (!cancelled) setData({ geo, mobility, commerce });
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openSidebar = useCallback(() => {
    setSidebarCollapsed(false);
    setTimeout(refreshSize, 300);
  }, [refreshSize]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((previous) => !previous);
    setTimeout(refreshSize, 300);
  };

  const { locate } = useUserLocation();

  const handleSelect = useCallback(
    (selection) => {
      // Solo los tianguis abren la ficha de selección.
      if (selection?.kind !== 'tianguis') return;

      setSelected(selection);
      // La previsualización siempre muestra las estaciones de referencia.
      setLayerVisible('metro_icons', true);
      setLayerVisible('metrobus_icons', true);
    },
    [setLayerVisible]
  );

  const handleCloseSelection = useCallback(() => setSelected(null), []);

  // Al previsualizar un tianguis se hace zoom y se compensa el panel derecho.
  useEffect(() => {
    if (!map || selected?.kind !== 'tianguis') return;

    const { lat, lon } = selected.data;
    const offsetX = window.matchMedia('(max-width: 820px)').matches
      ? 0
      : PREVIEW_PANEL_OFFSET_PX;
    const point = map.project([lat, lon], TIANGUIS_PREVIEW_ZOOM).add([offsetX, 0]);
    const center = map.unproject(point, TIANGUIS_PREVIEW_ZOOM);

    map.flyTo(center, TIANGUIS_PREVIEW_ZOOM, { duration: 0.8 });
  }, [map, selected]);

  const handleCommerceReady = useCallback((api) => {
    commerceMapRef.current = api;
    if (api && filtersRef.current) api.setFilters(filtersRef.current);
  }, []);

  const handleDayChange = (day) => setSelectedDay(day || null);

  // Un giro se prende y apaga; sin ninguno prendido el mapa muestra todos.
  const handleToggleGiro = (giroId) => {
    setSelectedGiros((previous) =>
      previous.includes(giroId)
        ? previous.filter((id) => id !== giroId)
        : [...previous, giroId]
    );
  };

  const handleClearGiros = () => setSelectedGiros([]);

  const handleSearchQuery = useCallback((q) => {
    setSearchFilters((previous) => ({ ...previous, q }));
  }, []);

  // Elegir una opción de la lista aplica ese filtro y limpia el texto: el
  // valor ya quedó expresado como chip, no hace falta seguir buscándolo.
  const handleApplySearchOption = useCallback(({ family, value }) => {
    setSearchFilters((previous) => ({ ...previous, q: '' }));

    if (family === 'day') {
      setSelectedDay((previous) => (previous === value ? null : value));
    } else if (family === 'giro') {
      setSelectedGiros((previous) =>
        previous.includes(value) ? previous.filter((id) => id !== value) : [value]
      );
    } else {
      setSearchFilters((previous) => ({
        ...previous,
        q: '',
        [family]: previous[family] === value ? null : value
      }));
    }

    fitNextRef.current = true;
  }, []);

  const handleRemoveSearchFilter = useCallback(({ family, value }) => {
    if (family === 'day') {
      setSelectedDay(null);
    } else if (family === 'giro') {
      setSelectedGiros((previous) => previous.filter((id) => id !== value));
    } else {
      setSearchFilters((previous) => ({ ...previous, [family]: null }));
    }
    fitNextRef.current = true;
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchFilters(EMPTY_SEARCH_FILTERS);
    setSelectedDay(null);
    setSelectedGiros([]);
    fitNextRef.current = true;
  }, []);

  const commerceFilters = useMemo(
    () => ({
      q: searchFilters.q,
      vialidad: searchFilters.vialidad,
      direccion: searchFilters.direccion,
      colonia: searchFilters.colonia,
      alcaldia: searchFilters.alcaldia,
      day: selectedDay,
      giro: selectedGiros.length > 0 ? selectedGiros : null
    }),
    [searchFilters, selectedDay, selectedGiros]
  );

  // Un solo punto de sincronización con la capa: filtros del buscador, día y
  // giros llegan juntos, y la cámara sólo se mueve al elegir una opción.
  useEffect(() => {
    filtersRef.current = commerceFilters;
    const api = commerceMapRef.current;
    if (!api) return;
    api.setFilters(commerceFilters);
    if (fitNextRef.current) {
      fitNextRef.current = false;
      api.fitFiltered();
    }
  }, [commerceFilters]);

  const commerce = data.commerce;

  // Opciones y conteos del buscador. Se calculan con todo el directorio una
  // sola vez por cambio de filtros; cada dimensión se cuenta sin aplicarse a
  // sí misma para que la lista no se llene de ceros.
  const searchOptions = useMemo(
    () => buildSearchOptions(commerce?.tianguis ?? [], commerceFilters),
    [commerce, commerceFilters]
  );

  const dayCounts = useMemo(
    () => Object.fromEntries(searchOptions.days.map((day) => [day.value, day.count])),
    [searchOptions]
  );

  // El panel sólo ofrece los giros con puestos en el mapa con los filtros
  // actuales (día, búsqueda y vialidad incluidos).
  const giroCounts = useMemo(
    () =>
      new Map(
        searchOptions.giros
          .filter((giro) => giro.count > 0)
          .map((giro) => [giro.value, giro.count])
      ),
    [searchOptions]
  );

  const activeSearchFilters = useMemo(
    () => ({
      ...searchFilters,
      day: selectedDay,
      giros: selectedGiros
    }),
    [searchFilters, selectedDay, selectedGiros]
  );

  const stationIndex = useMemo(
    () => [
      ...(data.mobility?.metroStations ?? []).map((station) => ({
        ...station,
        mode: 'Metro'
      })),
      ...(data.mobility?.metrobusStations ?? []).map((station) => ({
        ...station,
        mode: 'Metrobús'
      }))
    ],
    [data.mobility]
  );

  const nearbyStations = useMemo(() => {
    if (selected?.kind !== 'tianguis') return [];
    return findNearbyStations(stationIndex, selected.data.lat, selected.data.lon);
  }, [selected, stationIndex]);

  return (
    <>
      <button
        type="button"
        id="btn-open-sidebar"
        style={{ display: sidebarCollapsed ? 'flex' : 'none' }}
        onClick={openSidebar}
      >
        <span>☰</span>
        <span>Abrir Menú</span>
      </button>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        onGoHome={onGoHome}
      >
        <CommerceSearch
          options={searchOptions}
          filters={activeSearchFilters}
          onQueryChange={handleSearchQuery}
          onSelect={handleApplySearchOption}
          onRemove={handleRemoveSearchFilter}
          onClear={handleClearSearch}
        />

        {commerce && (
          <CommerceControls
            dayCounts={dayCounts}
            giroCounts={giroCounts}
            totalCount={searchOptions.dayTotal}
            selectedDay={selectedDay}
            onDayChange={handleDayChange}
            selectedGiros={selectedGiros}
            onToggleGiro={handleToggleGiro}
            onClearGiros={handleClearGiros}
          />
        )}

        <MobilityLegend />
        <QuickAccess />
      </Sidebar>

      <main id="map-wrapper">
        <div id="map" />

        <MapFabStack
          onLocate={locate}
          onReset={resetView}
          onToggleBase={toggleBaseMap}
        />

        {loadError && (
          <div className="map-status is-error">
            No se pudieron cargar los datos: {loadError}
          </div>
        )}
        {!loadError && !commerce && <div className="map-status">Cargando capas…</div>}

        <GeoLayers data={data.geo} />
        <MobilityLayers data={data.mobility} />
        <CommerceLayers
          data={commerce}
          onSelect={handleSelect}
          onReady={handleCommerceReady}
        />

        <TianguisPreview
          selection={selected}
          nearbyStations={nearbyStations}
          onClose={handleCloseSelection}
        />
      </main>
    </>
  );
}
