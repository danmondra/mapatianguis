/**
 * Panel de filtros. En escritorio es la columna izquierda del visor legado;
 * en móvil es una hoja que sube desde abajo y se queda medio asomada.
 *
 * @param {{
 *   collapsed: boolean,
 *   onToggle: () => void,
 *   onGoHome?: () => void,
 *   children: React.ReactNode
 * }} props
 */
export function Sidebar({ collapsed, onToggle, onGoHome, children }) {
  return (
    <aside id="sidebar" className={collapsed ? 'collapsed' : ''}>
      <div className="sidebar-header">
        <button
          type="button"
          className="sidebar-grip"
          onClick={onToggle}
          aria-label="Mostrar u ocultar el panel de filtros"
        >
          <span className="sidebar-grip__bar" aria-hidden="true" />
        </button>
        <div>
          <div className="sidebar-brand-title">El Mandado</div>
          <div className="sidebar-brand-sub">Chilangotón 2026 · Reto 1</div>
        </div>
        {onGoHome && (
          <button
            type="button"
            className="btn-toggle-sidebar"
            onClick={onGoHome}
            title="Volver al inicio"
          >
            ⌂
          </button>
        )}
        <button
          type="button"
          className="btn-toggle-sidebar btn-toggle-sidebar--collapse"
          onClick={onToggle}
          title="Colapsar panel lateral"
        >
          <span className="sidebar-toggle__glyph" aria-hidden="true">
            ◀
          </span>
        </button>
      </div>
      <div className="sidebar-scroll">{children}</div>
    </aside>
  );
}
