/**
 * Botón chip homogéneo para todas las capas.
 * `pending` marca una capa activa que todavía no se dibuja por el zoom actual.
 * @param {{
 *   active?: boolean,
 *   pending?: boolean,
 *   onClick?: () => void,
 *   id?: string,
 *   title?: string,
 *   children: React.ReactNode
 * }} props
 */
export function Chip({ active = false, pending = false, onClick, id, title, children }) {
  return (
    <button
      type="button"
      id={id}
      className={`chip-btn${active ? ' active' : ''}${active && pending ? ' is-pending' : ''}`}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
