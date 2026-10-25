/**
 * Bloque de sidebar con título y acción opcional.
 * @param {{ title: string, action?: React.ReactNode, children: React.ReactNode }} props
 */
export function Section({ title, action, children }) {
  return (
    <div className="section-block">
      <div className="section-heading">
        <span>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}
