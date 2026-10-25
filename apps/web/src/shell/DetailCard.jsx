/**
 * Ficha informativa de tianguis, MSR y estaciones de referencia.
 * Recibe una selección normalizada: { kind, data }.
 * @param {{
 *   selection: { kind: string, data: any } | null,
 *   nearbyStations?: { station: { nombre: string, linea: string, mode: string }, distanceMeters: number }[],
 *   onClose: () => void
 * }} props
 */
export function DetailCard({ selection, nearbyStations = [], onClose }) {
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

      {view.connection && (
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
      )}

      {nearbyStations.length > 0 && (
        <div
          style={{
            background: '#f8fafc',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '0.75rem'
          }}
        >
          <div style={{ fontWeight: 700, color: '#0f5953', marginBottom: '4px' }}>
            🚇 Estaciones cercanas
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', color: '#334155' }}>
            {nearbyStations.map(({ station, distanceMeters }, index) => (
              <li key={`${station.mode}-${station.nombre}-${index}`}>
                <b>
                  {station.mode} {station.nombre}
                </b>
                {station.linea
                  ? ` · ${station.mode === 'Metro' ? `Línea ${station.linea}` : station.linea}`
                  : ''}{' '}
                · {Math.round(distanceMeters)} m
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function describeSelection(selection) {
  const { data } = selection;

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
      connectionTitle: '📍 Dónde se instala:',
      connection: <i>{data.ubicacion}</i>
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
      connectionTitle: '🔁 Ruta itinerante:',
      connection: 'Se traslada de colonia a lo largo de la semana.'
    };
  }

  if (selection.kind === 'mercomuna') {
    return {
      tag: 'ACEPTA VALES MERCOMUNA',
      tagColor: '#b45309',
      name: data.nombre,
      sub: `${data.alcaldia}${data.cp ? ` · CP ${data.cp}` : ''} · ${data.calle}`,
      stat1: data.categoria ?? data.giro,
      label1: data.categoria ? 'Categoría' : 'Giro',
      stat2: data.alimentos ? 'Sí' : 'No',
      label2: 'Alimentos',
      connectionTitle: '💳 Vales Mercomuna:',
      connection: `Aquí se pueden usar los vales hasta el ${formatDate(data.vigenteHasta)}.`
    };
  }

  if (selection.kind === 'mercomuna_cp') {
    return {
      tag: 'VALES MERCOMUNA POR CP',
      tagColor: '#b45309',
      name: `CP ${data.cp}`,
      sub: data.alcaldia,
      stat1: data.comercios,
      label1: 'Comercios con vales',
      stat2: data.comerciosAlimentos,
      label2: 'De alimentos',
      connectionTitle: 'ℹ️ Ubicación aproximada:',
      connection:
        'Estos comercios solo tienen publicado su código postal, así que se agrupan ' +
        'en el centroide del CP. No indica la dirección exacta de cada uno.'
    };
  }

  if (selection.kind === 'metro') {
    return {
      tag: 'ESTACIÓN DE METRO',
      tagColor: data.color,
      name: stationName(data.nombre),
      sub: `Alcaldía ${data.alcaldia}`,
      stat1: `Línea ${data.linea}`,
      label1: 'Línea',
      stat2: data.tipo,
      label2: 'Tipo',
      connectionTitle: '🧭 Punto de referencia:',
      connection: 'Estación cercana a los tianguis de la zona.'
    };
  }

  if (selection.kind === 'metrobus') {
    return {
      tag: 'ESTACIÓN DE METROBÚS',
      tagColor: '#d81b60',
      name: stationName(data.nombre),
      sub: `Alcaldía ${data.alcaldia}`,
      stat1: data.linea,
      label1: 'Línea',
      stat2: 'Metrobús',
      label2: 'Sistema',
      connectionTitle: '🧭 Punto de referencia:',
      connection: 'Estación cercana a los tianguis de la zona.'
    };
  }

  return null;
}

function stationName(name) {
  return name.startsWith('Estación ') ? name : `Estación ${name}`;
}

/** "2026-12-31" -> "31 de diciembre de 2026" */
function formatDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = String(isoDate).split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${day} de ${meses[month - 1]} de ${year}`;
}
