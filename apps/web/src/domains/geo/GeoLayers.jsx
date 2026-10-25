import L from 'leaflet';
import { useEffect } from 'react';
import { featureLabel } from '@mapatianguis/contracts/geo';
import { useMapContext } from '../../map/MapProvider.jsx';

/**
 * Capas base: límites de alcaldías y municipios conurbados de la ZMVM.
 * @param {{ data: import('@mapatianguis/contracts/geo').GeoLayers }} props
 */
export function GeoLayers({ data }) {
  const { registerLayer, unregisterLayer } = useMapContext();

  useEffect(() => {
    if (!data) return undefined;

    const zmvm = L.geoJSON(data.zmvm, {
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
      style: {
        color: '#0f5953',
        weight: 2,
        dashArray: '4, 4',
        fillColor: '#0f5953',
        fillOpacity: 0.03
      },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(`Alcaldía ${featureLabel(feature)}`, { sticky: true });
      }
    });

    registerLayer('zmvm', zmvm);
    registerLayer('alcaldias', alcaldias);

    return () => {
      unregisterLayer('zmvm', zmvm);
      unregisterLayer('alcaldias', alcaldias);
    };
  }, [data, registerLayer, unregisterLayer]);

  return null;
}
