/**
 * Panel lateral idéntico al visor legado.
 * @param {{ collapsed: boolean, onToggle: () => void, children: React.ReactNode }} props
 */
export function Sidebar({ collapsed, onToggle, children }) {
  return (
    <aside id="sidebar" className={collapsed ? 'collapsed' : ''}>
      <div className="sidebar-header">
        <div>
          <div className="sidebar-brand-title">Movilidad y Comercio CDMX</div>
          <div className="sidebar-brand-sub">Chilangotón 2026 · Reto 1</div>
        </div>
        <button
          type="button"
          className="btn-toggle-sidebar"
          onClick={onToggle}
          title="Colapsar panel lateral"
        >
          ◀
        </button>
      </div>
      <div className="sidebar-scroll">{children}</div>
    </aside>
  );
}
