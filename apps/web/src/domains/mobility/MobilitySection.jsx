import { useEffect, useState } from 'react';
import {
  AGENCIES,
  AGENCY_BADGES,
  AGENCY_LABELS
} from '@mapatianguis/contracts';
import { Chip } from '../../shared/ui/Chip.jsx';
import { Section } from '../../shared/ui/Section.jsx';
import { useMapContext } from '../../map/MapProvider.jsx';

const AGENCY_LAYER_KEYS = {
  METRO: 'metro',
  MB: 'metrobus',
  TROLE: 'trolebus',
  CBB: 'cablebus',
  RTP: 'rtp',
  TL: 'tren',
  CC: 'concesionado'
};

export function MobilitySection() {
  const { visibleLayers, toggleLayer } = useMapContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  const toggleMenu = (event) => {
    event.stopPropagation();
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 6, left: rect.left });
    setMenuOpen(true);
  };

  const selectSubsystem = (agency) => {
    toggleLayer(AGENCY_LAYER_KEYS[agency]);
    setMenuOpen(false);
  };

  return (
    <Section
      title="Red de Transporte"
      action={
        <button type="button" className="btn-dropdown-main" onClick={toggleMenu}>
          <span>Líneas MI</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
      }
    >
      <div className="chips-flow">
        <Chip
          id="chip-metro_icons"
          active={visibleLayers.metro_icons}
          onClick={() => toggleLayer('metro_icons')}
        >
          🚇 Íconos Metro (195)
        </Chip>
        <Chip
          id="chip-metrobus_icons"
          active={visibleLayers.metrobus_icons}
          onClick={() => toggleLayer('metrobus_icons')}
        >
          🚍 Íconos Metrobús (324)
        </Chip>
        <Chip
          id="chip-concesionado"
          active={visibleLayers.concesionado}
          onClick={() => toggleLayer('concesionado')}
        >
          🚐 Rutas Secundarias (331)
        </Chip>
        <Chip
          id="chip-alcaldias"
          active={visibleLayers.alcaldias}
          onClick={() => toggleLayer('alcaldias')}
        >
          🗺️ Alcaldías CDMX
        </Chip>
        <Chip
          id="chip-zmvm"
          active={visibleLayers.zmvm}
          onClick={() => toggleLayer('zmvm')}
        >
          🌐 Área Metropolitana
        </Chip>
      </div>

      <div
        id="transport-dropdown-menu"
        style={{
          display: menuOpen ? 'block' : 'none',
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`
        }}
      >
        {AGENCIES.map((agency) => {
          const badge = AGENCY_BADGES[agency];
          return (
            <div
              className="t-opt"
              key={agency}
              onClick={(event) => {
                event.stopPropagation();
                selectSubsystem(agency);
              }}
            >
              <div className="t-badge" style={{ background: badge.color }}>
                {badge.text}
              </div>
              <span>{AGENCY_LABELS[agency]}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
