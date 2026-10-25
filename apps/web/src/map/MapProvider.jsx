import L from 'leaflet';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import {
  DEFAULT_LAYER_VISIBILITY,
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM
} from '@mapatianguis/contracts';

const MapContext = createContext(null);

const BASE_LAYERS = {
  esri: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    maxZoom: 18
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
};

export function MapProvider({ children }) {
  const [map, setMap] = useState(null);
  const [baseLayer, setBaseLayer] = useState('esri');
  const [visibleLayers, setVisibleLayers] = useState(() => ({
    ...DEFAULT_LAYER_VISIBILITY
  }));
  const mapRef = useRef(null);
  const layersRef = useRef(new Map());
  const baseLayersRef = useRef({});
  const visibleRef = useRef(visibleLayers);

  useEffect(() => {
    const container = document.getElementById('map');
    if (!container || mapRef.current) return undefined;

    const instance = L.map(container, {
      center: [MAP_CENTER.lat, MAP_CENTER.lng],
      zoom: MAP_DEFAULT_ZOOM,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(instance);

    baseLayersRef.current = {
      esri: L.tileLayer(BASE_LAYERS.esri.url, {
        attribution: BASE_LAYERS.esri.attribution,
        maxZoom: BASE_LAYERS.esri.maxZoom
      }).addTo(instance),
      osm: L.tileLayer(BASE_LAYERS.osm.url, {
        attribution: BASE_LAYERS.osm.attribution,
        maxZoom: BASE_LAYERS.osm.maxZoom
      })
    };

    mapRef.current = instance;
    setMap(instance);

    return () => {
      instance.remove();
      mapRef.current = null;
      baseLayersRef.current = {};
      layersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    for (const [key, layer] of layersRef.current.entries()) {
      if (visibleLayers[key]) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
      } else if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    }
  }, [map, visibleLayers]);

  useEffect(() => {
    if (!map) return;
    for (const [key, layer] of Object.entries(baseLayersRef.current)) {
      if (key === baseLayer) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
      } else if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    }
  }, [map, baseLayer]);

  const registerLayer = useCallback((key, layer) => {
    const instance = mapRef.current;
    const previous = layersRef.current.get(key);
    if (previous && previous !== layer && instance) instance.removeLayer(previous);
    layersRef.current.set(key, layer);
    if (instance && visibleRef.current[key]) layer.addTo(instance);
  }, []);

  const unregisterLayer = useCallback((key, layer) => {
    const instance = mapRef.current;
    const current = layersRef.current.get(key);
    if (current !== layer) return;
    if (instance && instance.hasLayer(layer)) instance.removeLayer(layer);
    layersRef.current.delete(key);
  }, []);

  const toggleLayer = useCallback((key) => {
    setVisibleLayers((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      visibleRef.current = next;
      return next;
    });
  }, []);

  const setLayerVisible = useCallback((key, visible) => {
    setVisibleLayers((previous) => {
      if (previous[key] === visible) return previous;
      const next = { ...previous, [key]: visible };
      visibleRef.current = next;
      return next;
    });
  }, []);

  const toggleBaseMap = useCallback(() => {
    setBaseLayer((previous) => (previous === 'esri' ? 'osm' : 'esri'));
  }, []);

  const resetView = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([MAP_CENTER.lat, MAP_CENTER.lng], MAP_DEFAULT_ZOOM);
  }, []);

  const refreshSize = useCallback(() => {
    mapRef.current?.invalidateSize();
  }, []);

  const value = {
    map,
    baseLayer,
    visibleLayers,
    registerLayer,
    unregisterLayer,
    toggleLayer,
    setLayerVisible,
    toggleBaseMap,
    resetView,
    refreshSize
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) throw new Error('useMapContext debe usarse dentro de <MapProvider>');
  return context;
}
