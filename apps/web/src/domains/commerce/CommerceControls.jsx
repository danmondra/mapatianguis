import { Chip } from '../../shared/ui/Chip.jsx';
import { Section } from '../../shared/ui/Section.jsx';
import { useMapContext } from '../../map/MapProvider.jsx';

/**
 * Chips de capas del comercio popular.
 * @param {{
 *   counts: { mercados: number, tianguis: number, msr: number },
 *   onFilterToday: () => void
 * }} props
 */
export function CommerceControls({ counts, onFilterToday }) {
  const { visibleLayers, toggleLayer } = useMapContext();

  return (
    <Section title="Comercio Popular">
      <div className="chips-flow">
        <Chip
          id="chip-mercados"
          active={visibleLayers.mercados}
          onClick={() => toggleLayer('mercados')}
        >
          🏪 Mercados ({counts.mercados})
        </Chip>
        <Chip
          id="chip-tianguis"
          active={visibleLayers.tianguis}
          onClick={() => toggleLayer('tianguis')}
        >
          🧺 Tianguis ({counts.tianguis.toLocaleString('es-MX')})
        </Chip>
        <Chip
          id="chip-msr"
          active={visibleLayers.msr}
          onClick={() => toggleLayer('msr')}
        >
          🚚 Rutas MSR ({counts.msr})
        </Chip>
        <Chip id="chip-dia-hoy" onClick={onFilterToday}>
          📅 Abrir Hoy
        </Chip>
      </div>
    </Section>
  );
}
