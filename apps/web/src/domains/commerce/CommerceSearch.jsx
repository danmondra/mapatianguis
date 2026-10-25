import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeText, WEEK_DAYS } from '@mapatianguis/contracts';
import { categoriaPorId } from '@mapatianguis/contracts/giros';
import { vialidadPorId } from '@mapatianguis/contracts/commerce';
import { Section } from '../../shared/ui/Section.jsx';

/** Cuántas opciones se muestran por grupo cuando hay texto escrito. */
const LIMITE_CON_BUSQUEDA = 8;
/** Colonias y alcaldías de entrada: una muestra útil, no el catálogo entero. */
const LIMITE_SIN_BUSQUEDA = 6;

const GRUPOS = [
  { key: 'direccion', titulo: 'Dirección o tramo', icono: '📍' },
  { key: 'day', titulo: 'Día', icono: '📅' },
  { key: 'giro', titulo: 'Giro', icono: '🛒' },
  { key: 'vialidad', titulo: 'Tipo de vialidad', icono: '🛣️' },
  { key: 'colonia', titulo: 'Colonia', icono: '🏘️' },
  { key: 'alcaldia', titulo: 'Alcaldía', icono: '🏛️' }
];

/**
 * Buscador de tianguis con opciones en lista.
 *
 * El texto libre filtra el mapa en vivo; la lista ofrece opciones tipadas
 * (dirección, día, giro, vialidad, colonia y alcaldía) para convertir la
 * búsqueda en un filtro estructurado y combinable.
 *
 * @param {{
 *   options: import('@mapatianguis/contracts/commerce').CommerceSearchOptions,
 *   filters: {
 *     q: string,
 *     day: string | null,
 *     giros: string[],
 *     vialidad: string | null,
 *     direccion: string | null,
 *     colonia: string | null,
 *     alcaldia: string | null
 *   },
 *   onQueryChange: (query: string) => void,
 *   onSelect: (option: { family: string, value: string }) => void,
 *   onRemove: (option: { family: string, value: string }) => void,
 *   onClear: () => void
 * }} props
 */
export function CommerceSearch({
  options,
  filters,
  onQueryChange,
  onSelect,
  onRemove,
  onClear
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const query = normalizeText(filters.q);
  const tokens = query.split(/\s+/).filter(Boolean);

  const groups = useMemo(
    () => buildGroups(options, filters, tokens),
    [options, filters, tokens]
  );
  const flatOptions = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups]
  );

  const chips = useMemo(() => buildChips(filters), [filters]);
  const hasFilters =
    chips.length > 0 ||
    Boolean(filters.q) ||
    Boolean(filters.vialidad) ||
    Boolean(filters.direccion) ||
    Boolean(filters.colonia) ||
    Boolean(filters.alcaldia);

  // Cambiar el texto reinicia el resaltado: Enter sólo elige una opción si el
  // usuario la recorrió con las flechas o la tocó.
  useEffect(() => setActiveIndex(-1), [filters.q]);

  // Cerrar al tocar fuera del buscador. Los botones de opción mantienen el
  // foco en el input, así que el blur no sirve como señal.
  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const select = (option) => {
    onSelect({ family: option.family, value: option.value });
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      if (flatOptions.length === 0) return;
      setActiveIndex((previous) => {
        if (event.key === 'ArrowDown') {
          return previous >= flatOptions.length - 1 ? 0 : previous + 1;
        }
        return previous <= 0 ? flatOptions.length - 1 : previous - 1;
      });
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0 && flatOptions[activeIndex]) {
      event.preventDefault();
      select(flatOptions[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const resultLabel =
    options.total === 1 ? '1 tianguis' : `${options.total.toLocaleString('es-MX')} tianguis`;

  return (
    <Section
      title="Buscador de Tianguis"
      action={
        <button
          type="button"
          className="search-toggle"
          aria-expanded={open}
          onClick={() => {
            if (open) {
              setOpen(false);
              setActiveIndex(-1);
            } else {
              inputRef.current?.focus();
              setOpen(true);
            }
          }}
        >
          {open ? 'Ocultar opciones' : 'Ver opciones'}
        </button>
      }
    >
      <div className="search-combobox" ref={rootRef}>
        <div className="search-input-box">
          <svg className="search-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            id="market-search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="search-options"
            aria-activedescendant={
              activeIndex >= 0 ? `search-option-${activeIndex}` : undefined
            }
            placeholder="Calle, colonia, día, giro o vialidad…"
            value={filters.q}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(event) => {
              onQueryChange(event.target.value);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {filters.q && (
            <button
              type="button"
              className="search-input-clear"
              title="Borrar texto"
              aria-label="Borrar texto"
              onClick={() => {
                onQueryChange('');
                inputRef.current?.focus();
              }}
            >
              ✕
            </button>
          )}
        </div>

        <p className="search-hint">
          Filtra por dirección, día, giro o tipo de vialidad. Escribe o abre la
          lista de opciones.
        </p>

        {chips.length > 0 && (
          <div className="search-chips" aria-label="Filtros activos">
            {chips.map((chip) => (
              <span key={`${chip.family}-${chip.value}`} className="search-chip">
                {chip.tono && (
                  <span
                    className="search-chip-swatch"
                    style={{ background: chip.tono }}
                    aria-hidden="true"
                  />
                )}
                <span className="search-chip-label">{chip.label}</span>
                <button
                  type="button"
                  className="search-chip-remove"
                  aria-label={`Quitar ${chip.label}`}
                  onClick={() => onRemove({ family: chip.family, value: chip.value })}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="search-result-row">
          <span className="search-result-count" aria-live="polite">
            {resultLabel}
          </span>
          {hasFilters && (
            <button type="button" className="search-clear" onClick={onClear}>
              Limpiar filtros
            </button>
          )}
        </div>

        {open && (
          <div
            id="search-options"
            className="search-options"
            role="listbox"
            aria-label="Opciones para filtrar tianguis"
          >
            {groups.map((group) =>
              group.items.length > 0 ? (
                <div
                  key={group.key}
                  className="search-group"
                  role="group"
                  aria-label={group.titulo}
                >
                  <div className="search-group-title">
                    <span>
                      <span aria-hidden="true">{group.icono}</span> {group.titulo}
                    </span>
                    <span className="search-group-count">
                      {group.items.length < group.total
                        ? `${group.items.length} de ${group.total}`
                        : group.total}
                    </span>
                  </div>

                  {group.items.map((item) => {
                    const index = flatOptions.indexOf(item);
                    const active = index === activeIndex;
                    return (
                      <button
                        key={`${item.family}-${item.value}`}
                        type="button"
                        id={`search-option-${index}`}
                        role="option"
                        aria-selected={item.active}
                        tabIndex={-1}
                        className={`search-option${active ? ' is-active' : ''}${
                          item.active ? ' is-selected' : ''
                        }`}
                        title={item.label}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => select(item)}
                      >
                        {item.tono && (
                          <span
                            className="search-option-swatch"
                            style={{ background: item.tono }}
                            aria-hidden="true"
                          />
                        )}
                        <span className="search-option-label">
                          {item.icono && (
                            <span className="search-option-icon" aria-hidden="true">
                              {item.icono}
                            </span>
                          )}
                          {item.label}
                        </span>
                        <span className="search-option-count">
                          {item.count.toLocaleString('es-MX')}
                        </span>
                        <span className="search-option-check" aria-hidden="true">
                          {item.active ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null
            )}

            {groups.every((group) => group.items.length === 0) && (
              <p className="search-empty">
                Sin opciones para “{filters.q}”. Prueba con otra calle, colonia,
                giro o día; el texto sigue filtrando el mapa.
              </p>
            )}

            {!filters.q && (
              <p className="search-options-note">
                Escribe para buscar entre{' '}
                {options.direcciones.length.toLocaleString('es-MX')} tramos de
                calle, {options.colonias.length.toLocaleString('es-MX')} colonias
                y {options.alcaldias.length} alcaldías.
              </p>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

/**
 * Convierte los conteos del contrato en grupos listos para pintar. Cuando hay
 * texto se ordena por coincidencia al inicio y luego por frecuencia; sin texto
 * se conserva el orden del catálogo y se recortan las listas largas.
 */
function buildGroups(options, filters, tokens) {
  const matches = (label) => {
    const normalized = normalizeText(label);
    return tokens.every((token) => normalized.includes(token));
  };

  const rank = (a, b) => {
    if (tokens.length > 0) {
      const aStarts = normalizeText(a.label).startsWith(tokens.join(' ')) ? 0 : 1;
      const bStarts = normalizeText(b.label).startsWith(tokens.join(' ')) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
    }
    return b.count - a.count || a.label.localeCompare(b.label, 'es-MX');
  };

  const limit = tokens.length > 0 ? LIMITE_CON_BUSQUEDA : LIMITE_SIN_BUSQUEDA;
  // Días, giros y vialidades son listas cortas: se ofrecen completas siempre.
  // Las 16 alcaldías también caben; las 649 colonias se recortan a una muestra.
  const limitFor = (key) =>
    key === 'day'
      ? 7
      : key === 'giro' || key === 'vialidad'
        ? 32
        : key === 'alcaldia' && tokens.length === 0
          ? 16
          : limit;

  const days = options.days
    .map((day) => {
      const definition = WEEK_DAYS.find((item) => item.value === day.value);
      return {
        family: 'day',
        value: day.value,
        label: definition?.label ?? day.value,
        count: day.count,
        active: filters.day === day.value
      };
    })
    .filter((item) => (item.count > 0 || item.active) && matches(item.label))
    .sort(rank);

  const giros = options.giros
    .map((giro) => {
      const categoria = categoriaPorId(giro.value);
      return {
        family: 'giro',
        value: giro.value,
        label: categoria.nombre,
        icono: categoria.icono,
        tono: categoria.tono,
        count: giro.count,
        active: filters.giros.includes(giro.value)
      };
    })
    .filter((item) => (item.count > 0 || item.active) && matches(item.label))
    .sort(rank);

  const vialidades = options.vialidades
    .map((vialidad) => ({
      family: 'vialidad',
      value: vialidad.value,
      label: vialidadPorId(vialidad.value).nombre,
      count: vialidad.count,
      active: filters.vialidad === vialidad.value
    }))
    .filter((item) => (item.count > 0 || item.active) && matches(item.label))
    .sort(rank);

  // Sin texto no se despliegan los 1,135 tramos: la lista sería inmanejable y
  // el usuario todavía no sabe qué calle busca. Al escribir aparecen.
  const direcciones =
    tokens.length === 0
      ? []
      : options.direcciones
          .map((direccion) => ({
            family: 'direccion',
            value: direccion.value,
            label: direccion.value,
            count: direccion.count,
            active: filters.direccion === direccion.value
          }))
          .filter((item) => matches(item.label))
          .sort(rank);

  const colonias = options.colonias
    .map((colonia) => ({
      family: 'colonia',
      value: colonia.value,
      label: colonia.value,
      count: colonia.count,
      active: filters.colonia === colonia.value
    }))
    .filter((item) => (item.count > 0 || item.active) && matches(item.label))
    .sort(rank);

  const alcaldias = options.alcaldias
    .map((alcaldia) => ({
      family: 'alcaldia',
      value: alcaldia.value,
      label: alcaldia.value,
      count: alcaldia.count,
      active: filters.alcaldia === alcaldia.value
    }))
    .filter((item) => (item.count > 0 || item.active) && matches(item.label))
    .sort(rank);

  return GRUPOS.map((group) => {
    const items =
      group.key === 'day'
        ? days
        : group.key === 'giro'
          ? giros
          : group.key === 'vialidad'
            ? vialidades
            : group.key === 'direccion'
              ? direcciones
              : group.key === 'colonia'
                ? colonias
                : alcaldias;
    return {
      ...group,
      total: items.length,
      items: items.slice(0, limitFor(group.key))
    };
  });
}

/** Chips de los filtros activos, incluidos los que llegan del calendario. */
function buildChips(filters) {
  const chips = [];

  if (filters.direccion) {
    chips.push({
      family: 'direccion',
      value: filters.direccion,
      label: `Dirección: ${filters.direccion}`
    });
  }
  if (filters.day) {
    const definition = WEEK_DAYS.find((day) => day.value === filters.day);
    chips.push({
      family: 'day',
      value: filters.day,
      label: `Día: ${definition?.label ?? filters.day}`
    });
  }
  for (const giro of filters.giros) {
    const categoria = categoriaPorId(giro);
    chips.push({
      family: 'giro',
      value: giro,
      label: categoria.nombre,
      tono: categoria.tono
    });
  }
  if (filters.vialidad) {
    chips.push({
      family: 'vialidad',
      value: filters.vialidad,
      label: `Vialidad: ${vialidadPorId(filters.vialidad).nombre}`
    });
  }
  if (filters.colonia) {
    chips.push({
      family: 'colonia',
      value: filters.colonia,
      label: `Colonia: ${filters.colonia}`
    });
  }
  if (filters.alcaldia) {
    chips.push({
      family: 'alcaldia',
      value: filters.alcaldia,
      label: `Alcaldía: ${filters.alcaldia}`
    });
  }

  return chips;
}
