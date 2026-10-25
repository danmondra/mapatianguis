import { Section } from '../shared/ui/Section.jsx';

function GotoButton({ label, onClick, children }) {
  return (
    <div className="goto-btn" onClick={onClick} role="button" tabIndex={0}>
      <div className="goto-btn-circle">{children}</div>
      <div className="goto-btn-lbl">{label}</div>
    </div>
  );
}

export function QuickAccess() {
  const showStreetClosures = () => {
    alert(
      'Aviso de Cierres Viales: 1,367 tianguis generan cortes y reducciones viales en días programados. Toca cualquier tianguis para ver la calle exacta ocupada.'
    );
  };

  return (
    <Section title="Accesos Rápidos">
      <div className="goto-row">
        <GotoButton label="Cierres Vías" onClick={showStreetClosures}>
          <svg viewBox="0 0 24 24">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        </GotoButton>
      </div>
    </Section>
  );
}
