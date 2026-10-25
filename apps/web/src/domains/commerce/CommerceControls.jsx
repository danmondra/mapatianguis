import { getTodayName, WEEK_DAYS } from '@mapatianguis/contracts';
import { Chip } from '../../shared/ui/Chip.jsx';
import { Section } from '../../shared/ui/Section.jsx';
import { useMapContext } from '../../map/MapProvider.jsx';

/**
 * Chips de capas y calendario semanal para filtrar tianguis por día.
 * @param {{
 *   counts: { tianguis: number, msr: number, mercomuna?: number | null },
 *   dayCounts: Record<string, number>,
 *   totalCount: number,
 *   selectedDay: string | null,
 *   onDayChange: (day: string | null) => void,
 *   mercomunaHint?: string
 * }} props
 */
export function CommerceControls({
  counts,
  dayCounts,
  totalCount,
  selectedDay,
  onDayChange,
  mercomunaHint
}) {
  const { visibleLayers, toggleLayer } = useMapContext();
  const today = getTodayName();

  return (
    <Section title="Comercio Popular">
      <fieldset className="day-calendar-fieldset">
        <legend className="day-calendar-legend">Abren:</legend>

        <button
          type="button"
          className={`day-calendar-all${selectedDay === null ? ' active' : ''}`}
          aria-pressed={selectedDay === null}
          onClick={() => onDayChange(null)}
        >
          <span>Todos</span>
          <span className="day-calendar-all-count">
            {totalCount.toLocaleString('es-MX')}
          </span>
        </button>

        <div className="day-calendar">
          {WEEK_DAYS.map((day) => {
            const active = selectedDay === day.value;
            return (
              <button
                key={day.value}
                type="button"
                className={`day-calendar-btn${active ? ' active' : ''}${
                  today === day.value ? ' is-today' : ''
                }`}
                aria-pressed={active}
                title={`${day.label}: ${dayCounts[day.value] ?? 0} tianguis`}
                onClick={() => onDayChange(day.value)}
              >
                <span className="day-calendar-name">{day.short}</span>
                <span className="day-calendar-count">
                  {dayCounts[day.value] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="chips-flow">
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
        <Chip
          id="chip-mercomuna"
          active={visibleLayers.mercomuna}
          onClick={() => toggleLayer('mercomuna')}
        >
          💳 Vales Mercomuna
          {counts.mercomuna != null ? ` (${counts.mercomuna.toLocaleString('es-MX')})` : ''}
        </Chip>
      </div>

      {visibleLayers.mercomuna && mercomunaHint && (
        <p className="chip-hint">{mercomunaHint}</p>
      )}

      <p className="chip-hint">
        Los vales Mercomuna se pueden usar en estos comercios hasta el 31 de
diciembre de 2026.
      </p>
    </Section>
  );
}
