import { RTPONKY_URL } from '@mapatianguis/contracts';
import { Section } from '../shared/ui/Section.jsx';

function GotoButton({ label, onClick, href, circleStyle, children }) {
  const content = (
    <>
      <div className="goto-btn-circle" style={circleStyle}>
        {children}
      </div>
      <div className="goto-btn-lbl">{label}</div>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="goto-btn">
        {content}
      </a>
    );
  }

  return (
    <div className="goto-btn" onClick={onClick} role="button" tabIndex={0}>
      {content}
    </div>
  );
}

export function QuickAccess() {
  const showStreetClosures = () => {
    alert(
      'Aviso de Cierres Viales: 1,367 tianguis generan cortes y reducciones viales en días programados. Toca cualquier tianguis para ver la calle exacta ocupada.'
    );
  };

  const showHoursModal = () => {
    alert(
      'Horarios Oficiales: Metro 05:00 a 24:00 (L-V), 06:00 a 24:00 (Sáb), 07:00 a 24:00 (Dom). Mercados públicos: 08:00 a 18:00 hrs.'
    );
  };

  const showRoutesModal = () => {
    alert(
      'Rutas Secundarias Concesionadas: 331 ramales de microbuses y corredores que penetran en colonias conectando con tianguis y mercados.'
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

        <GotoButton label="Horarios" onClick={showHoursModal}>
          <svg viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        </GotoButton>

        <GotoButton label="Secundarias" onClick={showRoutesModal}>
          <svg viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        </GotoButton>

        <GotoButton
          label="RTPonky"
          href={RTPONKY_URL}
          circleStyle={{ background: '#15803d' }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
          </svg>
        </GotoButton>
      </div>
    </Section>
  );
}
