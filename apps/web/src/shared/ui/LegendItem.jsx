/**
 * Renglón de leyenda: muestra de color o forma + nombre + explicación.
 * Es solo lectura: no tiene onClick ni foco, para que nunca se confunda con un
 * filtro accionable.
 * @param {{
 *   label: string,
 *   note?: string,
 *   swatch: React.ReactNode
 * }} props
 */
export function LegendItem({ label, note, swatch }) {
  return (
    <li className="legend-item">
      <span className="legend-swatch-slot">{swatch}</span>
      <span className="legend-text">
        <span className="legend-label">{label}</span>
        {note && <span className="legend-note">{note}</span>}
      </span>
    </li>
  );
}
