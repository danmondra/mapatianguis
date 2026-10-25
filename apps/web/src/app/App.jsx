import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTodayName, WEEK_DAYS } from '@mapatianguis/contracts';
import { tianguisMatchesDay } from '@mapatianguis/contracts/commerce';
import { findNearbyStations } from '@mapatianguis/contracts/mobility';
import { MapProvider, useMapContext } from '../map/MapProvider.jsx';
import { useUserLocation } from '../map/useUserLocation.js';
import { Sidebar } from '../shell/Sidebar.jsx';
import { MapFabStack } from '../shell/MapFabStack.jsx';
import { QuickAccess } from '../shell/QuickAccess.jsx';
import { DetailCard } from '../shell/DetailCard.jsx';
import { TianguisPreview } from '../shell/TianguisPreview.jsx';
import { GeoLayers } from '../domains/geo/GeoLayers.jsx';
import { fetchGeoLayers } from '../domains/geo/api.js';
import { CommerceLayers } from '../domains/commerce/CommerceLayers.jsx';
import { CommerceSearch } from '../domains/commerce/CommerceSearch.jsx';
import { CommerceControls } from '../domains/commerce/CommerceControls.jsx';
import { fetchCommerceDirectory, fetchMercomuna } from '../domains/commerce/api.js';
import { MercomunaLayers } from '../domains/commerce/MercomunaLayers.jsx';
import { MobilityLayers } from '../domains/mobility/MobilityLayers.jsx';
import { MobilitySection } from '../domains/mobility/MobilitySection.jsx';
import { fetchMobilityNetwork } from '../domains/mobility/api.js';

const TIANGUIS_PREVIEW_ZOOM = 16;
/** Mitad del panel derecho: deja el marcador en el centro del área visible. */
const PREVIEW_PANEL_OFFSET_PX = 180;

export default function App() {
  return (
    <MapProvider>
      <AppShell />
    </MapProvider>
  );
}

function AppShell() {
  const { map, toggleBaseMap, resetView, refreshSize, visibleLayers, setLayerVisible } =
    useMapContext();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [data, setData] = useState({ geo: null, mobility: null, commerce: null });
  const [mercomuna, setMercomuna] = useState(null);
  const [mercomunaError, setMercomunaError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedDay, setSelectedDay] = useState(() => getTodayName());

  const commerceMapRef = useRef(null);
  const selectedDayRef = useRef(selectedDay);

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

  // La capa de vales es opcional: se pide solo la primera vez que se enciende.
  useEffect(() => {
    if (!visibleLayers.mercomuna || mercomuna) return undefined;

    let cancelled = false;
    setMercomunaError(null);

    fetchMercomuna()
      .then((directory) => {
        if (!cancelled) setMercomuna(directory);
      })
      .catch((error) => {
        if (!cancelled) setMercomunaError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [visibleLayers.mercomuna, mercomuna]);

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
      setSelected(selection);

      if (selection?.kind === 'tianguis') {
        // La previsualización siempre muestra las estaciones de referencia.
        setLayerVisible('metro_icons', true);
        setLayerVisible('metrobus_icons', true);
        return;
      }

      openSidebar();
    },
    [openSidebar, setLayerVisible]
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
    api?.setDayFilter(selectedDayRef.current);
  }, []);

  const handleSearch = (query) => {
    commerceMapRef.current?.focusTianguis(query);
  };

  const handleDayChange = (day) => {
    const nextDay = day || null;
    selectedDayRef.current = nextDay;
    setSelectedDay(nextDay);
    commerceMapRef.current?.setDayFilter(nextDay);
  };

  const commerce = data.commerce;

  const dayCounts = useMemo(() => {
    const counts = Object.fromEntries(WEEK_DAYS.map((day) => [day.value, 0]));
    for (const tianguis of commerce?.tianguis ?? []) {
      for (const day of WEEK_DAYS) {
        if (tianguisMatchesDay(tianguis, day.value)) counts[day.value] += 1;
      }
    }
    return counts;
  }, [commerce]);

  const tianguisCount = selectedDay
    ? dayCounts[selectedDay] ?? 0
    : commerce?.tianguis.length ?? 0;

  const mercomunaCount = mercomuna?.resumen.conCoordenada ?? null;

  // Aviso honesto cuando el chip está activo pero la capa no puede dibujarse.
  const mercomunaHint = mercomunaError
    ? `No se pudieron cargar los comercios con vales: ${mercomunaError}`
    : !mercomuna
      ? 'Cargando comercios con vales…'
      : mercomuna.resumen.sinUbicacion > 0
        ? `Se dibujan ${mercomuna.resumen.conCoordenada.toLocaleString('es-MX')} comercios. ` +
          `${mercomuna.resumen.aproximados.toLocaleString('es-MX')} se agrupan por código postal ` +
          `y ${mercomuna.resumen.sinUbicacion} no tienen ubicación publicada.`
        : null;

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
    if (!selected || (selected.kind !== 'tianguis' && selected.kind !== 'msr')) {
      return [];
    }
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

      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar}>
        <DetailCard
          selection={selected?.kind === 'tianguis' ? null : selected}
          nearbyStations={nearbyStations}
          onClose={handleCloseSelection}
        />

        <CommerceSearch onSearch={handleSearch} />

        {commerce && (
          <CommerceControls
            counts={{
              tianguis: tianguisCount,
              msr: commerce.msr.length,
              mercomuna: mercomunaCount
            }}
            dayCounts={dayCounts}
            totalCount={commerce.tianguis.length}
            selectedDay={selectedDay}
            onDayChange={handleDayChange}
            mercomunaHint={mercomunaHint}
          />
        )}

        <MobilitySection />
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
        <MobilityLayers data={data.mobility} onSelect={handleSelect} />
        <CommerceLayers
          data={commerce}
          onSelect={handleSelect}
          onReady={handleCommerceReady}
        />
        <MercomunaLayers data={mercomuna} onSelect={handleSelect} />

        <TianguisPreview
          selection={selected}
          nearbyStations={nearbyStations}
          onClose={handleCloseSelection}
        />
      </main>
    </>
  );
}
