import { STATION_MIN_ZOOM } from '@mapatianguis/contracts';
import { Chip } from '../../shared/ui/Chip.jsx';
import { Section } from '../../shared/ui/Section.jsx';
import { useMapContext } from '../../map/MapProvider.jsx';

export function MobilitySection() {
  const { visibleLayers, toggleLayer, zoom } = useMapContext();
  const stationsHiddenByZoom = zoom < STATION_MIN_ZOOM;
  const stationHint = stationsHiddenByZoom
    ? `Acerca el mapa a zoom ${STATION_MIN_ZOOM}+ para verlas`
    : 'Estaciones visibles en el mapa';

  return (
    <Section title="Estaciones de Referencia">
      <div className="chips-flow">
        <Chip
          id="chip-metro_icons"
          active={visibleLayers.metro_icons}
          pending={stationsHiddenByZoom}
          title={stationHint}
          onClick={() => toggleLayer('metro_icons')}
        >
          🚇 Metro (195)
        </Chip>
        <Chip
          id="chip-metrobus_icons"
          active={visibleLayers.metrobus_icons}
          pending={stationsHiddenByZoom}
          title={stationHint}
          onClick={() => toggleLayer('metrobus_icons')}
        >
          🚍 Metrobús (324)
        </Chip>
        <Chip
          id="chip-alcaldias"
          active={visibleLayers.alcaldias}
          onClick={() => toggleLayer('alcaldias')}
        >
          🗺️ Alcaldías CDMX
        </Chip>
        <Chip
          id="chip-zmvm"
          active={visibleLayers.zmvm}
          onClick={() => toggleLayer('zmvm')}
        >
          🌐 Área Metropolitana
        </Chip>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: '#64748b' }}>
        {stationsHiddenByZoom
          ? `Las estaciones aparecen tenues al acercar el mapa (zoom ${STATION_MIN_ZOOM}+). `
          : 'Las estaciones se dibujan tenues para no competir con los tianguis. '}
        Te ayudan a ubicar qué tianguis tienen una estación cerca.
      </p>
    </Section>
  );
}
