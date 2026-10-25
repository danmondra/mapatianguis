import { STATION_MIN_ZOOM } from '@mapatianguis/contracts';
import { LegendItem } from '../../shared/ui/LegendItem.jsx';
import { Section } from '../../shared/ui/Section.jsx';
import { useMapContext } from '../../map/MapProvider.jsx';

/**
 * Leyenda de la red de vialidad y movilidad. No es un filtro: solo explica qué
 * representa cada trazo y cada símbolo del mapa.
 *
 * Las capas de estaciones son visibles salvo que el usuario las apague desde
 * el mapa; la leyenda refleja ese estado sin ofrecer control.
 */
export function MobilityLegend() {
  const { visibleLayers, zoom } = useMapContext();
  const stationsHiddenByZoom = zoom < STATION_MIN_ZOOM;

  const stationsState = !visibleLayers.metro_icons && !visibleLayers.metrobus_icons
    ? 'Estaciones ocultas en el mapa'
    : stationsHiddenByZoom
      ? `Las estaciones aparecen al acercar el mapa (zoom ${STATION_MIN_ZOOM}+)`
      : 'Las estaciones se dibujan tenues para no competir con los tianguis';

  return (
    <Section title="Red de Vialidad y Movilidad">
      <ul className="legend-list">
        <LegendItem
          label="Metro"
          note={`${stationsState}. Te ayudan a ubicar qué tianguis tienen una estación cerca.`}
          swatch={<span className="legend-swatch legend-swatch-metro" aria-hidden="true">M</span>}
        />
        <LegendItem
          label="Metrobús"
          note="Estación de Metrobús con su línea."
          swatch={<span className="legend-swatch legend-swatch-metrobus" aria-hidden="true">MB</span>}
        />
        <LegendItem
          label="Límite de alcaldía"
          note="Contorno punteado de las 16 alcaldías de la CDMX."
          swatch={<span className="legend-line legend-line-alcaldia" aria-hidden="true" />}
        />
        <LegendItem
          label="Área Metropolitana"
          note="Municipios conurbados de la ZMVM, en gris."
          swatch={<span className="legend-fill legend-fill-zmvm" aria-hidden="true" />}
        />
      </ul>
    </Section>
  );
}
