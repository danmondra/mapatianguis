/**
 * Botón chip homogéneo para todas las capas.
 * @param {{ active?: boolean, onClick?: () => void, id?: string, children: React.ReactNode }} props
 */
export function Chip({ active = false, onClick, id, children }) {
  return (
    <button
      type="button"
      id={id}
      className={`chip-btn${active ? ' active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
