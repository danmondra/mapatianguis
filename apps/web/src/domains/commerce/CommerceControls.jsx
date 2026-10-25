import { getTodayName, WEEK_DAYS } from '@mapatianguis/contracts';
import { TODAS_LAS_CATEGORIAS } from '@mapatianguis/contracts/giros';
import { Section } from '../../shared/ui/Section.jsx';

/**
 * Calendario semanal y filtro por giro.
 * El día y el giro se combinan: un puesto se dibuja si pasa los dos filtros.
 * @param {{
 *   dayCounts: Record<string, number>,
 *   giroCounts: Map<string, number>,
 *   totalCount: number,
 *   selectedDay: string | null,
 *   onDayChange: (day: string | null) => void,
 *   selectedGiros: string[],
 *   onToggleGiro: (giroId: string) => void,
 *   onClearGiros: () => void
 * }} props
 */
export function CommerceControls({
  dayCounts,
  giroCounts,
  totalCount,
  selectedDay,
  onDayChange,
  selectedGiros,
  onToggleGiro,
  onClearGiros
}) {
  const today = getTodayName();

  // Sólo se ofrecen los giros con puestos en el mapa con los filtros
  // actuales (día, búsqueda y vialidad incluidos).
  const visibleGiros = TODAS_LAS_CATEGORIAS.filter((categoria) =>
    giroCounts.has(categoria.id)
  );
  const visibleGiroCount = visibleGiros.reduce(
    (total, categoria) => total + (giroCounts.get(categoria.id) ?? 0),
    0
  );
  // Varios giros elegidos a la vez: no hay categoría que se pueda llamar
  // "todos", así que el botón queda sin marcar.
  const isEveryGiroSelected =
    selectedGiros.length > 0 && selectedGiros.length === visibleGiros.length;

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

      <fieldset className="giro-filter">
        <legend className="giro-filter-legend">Color del puesto = giro</legend>

        <p className="giro-filter-hint">Toca un giro para verlo solo en el mapa.</p>

        <div className="giro-filter-flow">
          <button
            type="button"
            className={`giro-filter-all${isEveryGiroSelected ? ' active' : ''}`}
            aria-pressed={isEveryGiroSelected}
            title={`${visibleGiroCount} tianguis`}
            onClick={onClearGiros}
          >
            <span className="giro-filter-swatch giro-filter-swatch--all" aria-hidden="true" />
            <span className="giro-filter-name">Todos los giros</span>
            <span className="giro-filter-count">
              {visibleGiroCount.toLocaleString('es-MX')}
            </span>
          </button>

          {visibleGiros.map((categoria) => {
            const active = selectedGiros.includes(categoria.id);
            const total = giroCounts.get(categoria.id) ?? 0;
            return (
              <button
                key={categoria.id}
                type="button"
                className={`giro-filter-btn${active ? ' active' : ''}`}
                aria-pressed={active}
                title={`${categoria.nombre}: ${total} tianguis`}
                style={{ '--giro-tono': categoria.tono }}
                onClick={() => onToggleGiro(categoria.id)}
              >
                <span
                  className="giro-filter-swatch"
                  style={{ background: categoria.tono }}
                  aria-hidden="true"
                />
                <span className="giro-filter-name">{categoria.nombre}</span>
                <span className="giro-filter-count">
                  {total.toLocaleString('es-MX')}
                </span>
              </button>
            );
          })}
        </div>

        {giroCounts.has('SIN_GIRO') && (
          <p className="chip-hint">
            El 77% de los tianguis del directorio oficial no declara giro; van
            en rojo.
          </p>
        )}
      </fieldset>
    </Section>
  );
}
