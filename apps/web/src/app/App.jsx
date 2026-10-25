import { useCallback, useEffect, useRef, useState } from 'react';
import { getTodayName, MAP_CENTER } from '@mapatianguis/contracts';
import { MapProvider, useMapContext } from '../map/MapProvider.jsx';
import { useUserLocation } from '../map/useUserLocation.js';
import { Sidebar } from '../shell/Sidebar.jsx';
import { MapFabStack } from '../shell/MapFabStack.jsx';
import { QuickAccess } from '../shell/QuickAccess.jsx';
import { DetailCard } from '../shell/DetailCard.jsx';
import { GeoLayers } from '../domains/geo/GeoLayers.jsx';
import { fetchGeoLayers } from '../domains/geo/api.js';
import { CommerceLayers } from '../domains/commerce/CommerceLayers.jsx';
import { CommerceSearch } from '../domains/commerce/CommerceSearch.jsx';
import { CommerceControls } from '../domains/commerce/CommerceControls.jsx';
import { fetchCommerceDirectory } from '../domains/commerce/api.js';
import { MobilityLayers } from '../domains/mobility/MobilityLayers.jsx';
import { MobilitySection } from '../domains/mobility/MobilitySection.jsx';
import { fetchMobilityNetwork } from '../domains/mobility/api.js';
import { RoutePlanner } from '../domains/routing/RoutePlanner.jsx';
import { RoutingLayers } from '../domains/routing/RoutingLayers.jsx';
import { fetchRoutePlan } from '../domains/routing/api.js';

export default function App() {
  return (
    <MapProvider>
      <AppShell />
    </MapProvider>
  );
}

function AppShell() {
  const { toggleBaseMap, resetView, refreshSize } = useMapContext();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [data, setData] = useState({ geo: null, mobility: null, commerce: null });
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [routeFrom, setRouteFrom] = useState('Mi ubicación');
  const [routeTo, setRouteTo] = useState('Mercado Jamaica');
  const [routePlan, setRoutePlan] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [userCoordinates, setUserCoordinates] = useState({
    lat: MAP_CENTER.lat,
    lon: MAP_CENTER.lng
  });

  const commerceMapRef = useRef(null);
  const destinationRef = useRef(null);
  const routeRequestRef = useRef(0);

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

  const handleLocation = useCallback((coordinates) => {
    setUserCoordinates(coordinates);
  }, []);
  const { locate } = useUserLocation({ onLocation: handleLocation });

  const handleSelect = useCallback(
    (selection) => {
      setSelected(selection);
      openSidebar();
    },
    [openSidebar]
  );

  const handleCommerceReady = useCallback((api) => {
    commerceMapRef.current = api;
  }, []);

  const handleSearch = (query) => {
    commerceMapRef.current?.focusMercado(query);
  };

  const handleFilterToday = () => {
    const today = getTodayName();
    commerceMapRef.current?.setDayFilter(today);
    alert(`Filtrado por los tianguis que abren hoy (${today}).`);
  };

  const runRoute = useCallback(
    async ({ from, to, destination }) => {
      const requestId = routeRequestRef.current + 1;
      routeRequestRef.current = requestId;
      setRouteLoading(true);
      setRouteError(null);

      try {
        const plan = await fetchRoutePlan({
          from,
          to,
          coordinates: userCoordinates,
          destination: destination ?? undefined
        });
        if (routeRequestRef.current !== requestId) return;
        setRoutePlan(plan);
        openSidebar();
      } catch (error) {
        if (routeRequestRef.current !== requestId) return;
        setRouteError(error.message);
      } finally {
        if (routeRequestRef.current === requestId) setRouteLoading(false);
      }
    },
    [openSidebar, userCoordinates]
  );

  const handleSubmitRoute = () => {
    runRoute({
      from: routeFrom,
      to: routeTo,
      destination: destinationRef.current
    });
  };

  const handleToChange = (value) => {
    setRouteTo(value);
    destinationRef.current = null;
  };

  const handleGoTo = (target) => {
    if (!target) return;
    destinationRef.current = { lat: target.lat, lon: target.lon, label: target.label };
    setRouteTo(target.label);
    runRoute({
      from: routeFrom,
      to: target.label,
      destination: destinationRef.current
    });
  };

  const commerce = data.commerce;

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
        <RoutePlanner
          from={routeFrom}
          to={routeTo}
          onFromChange={setRouteFrom}
          onToChange={handleToChange}
          onSubmit={handleSubmitRoute}
          plan={routePlan}
          loading={routeLoading}
          error={routeError}
        />

        <DetailCard
          selection={selected}
          onClose={() => setSelected(null)}
          onGoTo={handleGoTo}
        />

        <CommerceSearch onSearch={handleSearch} />

        {commerce && (
          <CommerceControls
            counts={{
              mercados: commerce.mercados.length,
              tianguis: commerce.tianguis.length,
              msr: commerce.msr.length
            }}
            onFilterToday={handleFilterToday}
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
        <RoutingLayers plan={routePlan} />
      </main>
    </>
  );
}
