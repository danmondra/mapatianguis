import {
  fareLabel,
  paymentLabel
} from '@mapatianguis/contracts/mobility';
import { formatSurface } from '@mapatianguis/contracts/commerce';
import { RTPONKY_URL } from '@mapatianguis/contracts';

/**
 * Ficha de detalle única para comercio y transporte.
 * Recibe una selección normalizada: { kind, data, anchor? }.
 * @param {{
 *   selection: { kind: string, data: any, anchor?: { lat: number, lon: number } } | null,
 *   onClose: () => void,
 *   onGoTo: (target: { label: string, lat: number, lon: number }) => void
 * }} props
 */
export function DetailCard({ selection, onClose, onGoTo }) {
  if (!selection) return null;

  const view = describeSelection(selection);
  if (!view) return null;

  return (
    <div id="detail-card" className="is-visible">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          className="detail-tag"
          id="panel-tag"
          style={{ background: view.tagColor }}
        >
          {view.tag}
        </span>
        <button
          type="button"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '1.1rem',
            color: '#64748b'
          }}
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="detail-name" id="panel-name">
        {view.name}
      </div>
      <div className="detail-loc" id="panel-sub">
        {view.sub}
      </div>

      <div className="stats-2col">
        <div className="stat-pill">
          <div className="stat-pill-val" id="panel-stat1">
            {view.stat1}
          </div>
          <div className="stat-pill-lbl" id="panel-lbl1">
            {view.label1}
          </div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-val" id="panel-stat2">
            {view.stat2}
          </div>
          <div className="stat-pill-lbl" id="panel-lbl2">
            {view.label2}
          </div>
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid #dbeae8',
          marginBottom: '8px',
          fontSize: '0.75rem'
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--cdmx-green-dark)', marginBottom: '2px' }}>
          {view.connectionTitle}
        </div>
        <div id="panel-conn" style={{ color: '#334155' }}>
          {view.connection}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          type="button"
          onClick={() => onGoTo(view.target)}
          style={{
            flex: 1,
            background: '#0f5953',
            color: '#fff',
            border: 'none',
            padding: '7px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🎯 Ir hacia aquí
        </button>
        <a
          href={RTPONKY_URL}
          target="_blank"
          rel="noreferrer"
          className="rtponky-link-btn"
          style={{ flex: 1 }}
          id="panel-rtponky-btn"
        >
          <span>RTPonky ↗</span>
        </a>
      </div>
    </div>
  );
}

function describeSelection(selection) {
  const { data } = selection;

  if (selection.kind === 'mercado') {
    return {
      tag: 'MERCADO PÚBLICO',
      tagColor: '#d97706',
      name: `Mercado ${data.nombre}`,
      sub: `${data.alcaldia} · ${data.colonia}`,
      stat1: data.locales,
      label1: 'Locales',
      stat2: formatSurface(data.superficie_m2),
      label2: 'Superficie',
      connectionTitle: '🚌 Conexión de Movilidad:',
      connection: (
        <>
          🚇 Metro / Metrobús conectado a pie.
          <br />
          <span style={{ color: '#0f5953', fontWeight: 700 }}>
            Tarifa oficial MI: $5.00 - $6.00 MXN.
          </span>
        </>
      ),
      target: {
        label: `Mercado ${data.nombre}`,
        lat: data.lat,
        lon: data.lon
      }
    };
  }

  if (selection.kind === 'tianguis') {
    return {
      tag: 'TIANGUIS MÓVIL',
      tagColor: '#0f5953',
      name: `Tianguis ${data.colonia}`,
      sub: `${data.alcaldia} · ${data.colonia}`,
      stat1: data.dia,
      label1: 'Día',
      stat2: data.horario,
      label2: 'Horario',
      connectionTitle: '🚌 Conexión de Movilidad:',
      connection: (
        <>
          <b>Vía cerrada:</b> <i>{data.ubicacion}</i>
        </>
      ),
      target: {
        label: `Tianguis ${data.colonia}`,
        lat: data.lat,
        lon: data.lon
      }
    };
  }

  if (selection.kind === 'msr') {
    return {
      tag: 'MERCADO SOBRE RUEDAS',
      tagColor: '#10b981',
      name: `${data.ruta} (${data.colonia})`,
      sub: `${data.alcaldia} · ${data.direccion}`,
      stat1: data.dia,
      label1: 'Día en esta sede',
      stat2: data.oferentes,
      label2: 'Oferentes',
      connectionTitle: '🚌 Conexión de Movilidad:',
      connection: (
        <>
          <b>Ruta itinerante:</b> Se traslada de colonia a lo largo de la semana.
        </>
      ),
      target: {
        label: `MSR ${data.ruta}`,
        lat: data.lat,
        lon: data.lon
      }
    };
  }

  if (selection.kind === 'metro') {
    return {
      tag: 'ESTACIÓN METRO CDMX',
      tagColor: data.color,
      name: `Estación ${data.nombre}`,
      sub: `Línea ${data.linea} · Alcaldía ${data.alcaldia}`,
      stat1: '$5.00 MXN',
      label1: 'Tarifa Oficial',
      stat2: data.tipo,
      label2: 'Tipo',
      connectionTitle: '🚌 Conexión de Movilidad:',
      connection: (
        <>
          🚇 Estación de la red primaria que conecta con mercados y tianguis
          barriales.
        </>
      ),
      target: {
        label: `Estación ${data.nombre}`,
        lat: data.lat,
        lon: data.lon
      }
    };
  }

  if (selection.kind === 'transport') {
    return {
      tag: data.agency_name,
      tagColor: data.color,
      name: `${data.route_short ?? ''} ${data.route_long ?? ''}`.trim(),
      sub: `Destino: ${data.headsign || 'Servicio Concesionado/Red'}`,
      stat1: fareLabel(data.agency),
      label1: 'Tarifa',
      stat2: paymentLabel(data.agency),
      label2: 'Pago',
      connectionTitle: '🚌 Conexión de Movilidad:',
      connection: (
        <>
          <b>Corredor / Ruta:</b> Conexión de transporte que abastece y alimenta
          a la zona comercial.
        </>
      ),
      target: selection.anchor
        ? {
            label:
              `${data.route_short ?? ''} ${data.route_long ?? ''}`.trim() ||
              data.agency_name,
            lat: selection.anchor.lat,
            lon: selection.anchor.lon
          }
        : null
    };
  }

  return null;
}
