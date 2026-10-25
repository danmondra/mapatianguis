import L from 'leaflet';
import { useEffect } from 'react';
import { featureLabel } from '@mapatianguis/contracts/geo';
import { MAP_PANES, useMapContext } from '../../map/MapProvider.jsx';

const ALCALDIA_STYLE = Object.freeze({
  color: '#0f5953',
  weight: 2,
  dashArray: '4, 4',
  fillColor: '#0f5953',
  fillOpacity: 0.03
});

const ALCALDIA_HOVER_STYLE = Object.freeze({
  color: '#2f7a72',
  weight: 2.5,
  dashArray: null,
  fillColor: '#2f7a72',
  fillOpacity: 0.16
});

/**
 * Capas base: límites de alcaldías y municipios conurbados de la ZMVM.
 * @param {{ data: import('@mapatianguis/contracts/geo').GeoLayers }} props
 */
export function GeoLayers({ data }) {
  const { map, registerLayer, unregisterLayer } = useMapContext();

  useEffect(() => {
    if (!data) return undefined;

    const renderer = L.svg({ pane: MAP_PANES.geo });

    const zmvm = L.geoJSON(data.zmvm, {
      renderer,
      style: {
        color: '#94a3b8',
        weight: 1,
        dashArray: '3, 4',
        fillColor: '#f1f5f9',
        fillOpacity: 0.15
      },
      onEachFeature: (feature, layer) => {
        const properties = feature.properties ?? {};
        layer.bindTooltip(`${properties.NOMGEO || 'Municipio Metropolitano'} (Edomex / ZMVM)`, {
          sticky: true
        });
      }
    });

    const alcaldias = L.geoJSON(data.alcaldias, {
      renderer,
      style: ALCALDIA_STYLE,
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(`Alcaldía ${featureLabel(feature)}`, { sticky: true });
        layer.on({
          mouseover: () => {
            // Solo se resalta el contorno: no se trae al frente porque taparía
            // los marcadores de tianguis y bloquearía sus clicks.
            layer.setStyle(ALCALDIA_HOVER_STYLE);
          },
          mouseout: () => {
            layer.setStyle(ALCALDIA_STYLE);
          },
          click: () => {
            // flyToBounds calcula el zoom según el tamaño del polígono.
            map?.flyToBounds(layer.getBounds(), {
              padding: [24, 24],
              duration: 0.6
            });
          }
        });
      }
    });

    registerLayer('zmvm', zmvm);
    registerLayer('alcaldias', alcaldias);

    return () => {
      unregisterLayer('zmvm', zmvm);
      unregisterLayer('alcaldias', alcaldias);
      if (map?.hasLayer(renderer)) map.removeLayer(renderer);
    };
  }, [data, map, registerLayer, unregisterLayer]);

  return null;
}
