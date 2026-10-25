/**
 * Planificador A → B de la sidebar.
 * @param {{
 *   from: string,
 *   to: string,
 *   onFromChange: (value: string) => void,
 *   onToChange: (value: string) => void,
 *   onSubmit: () => void,
 *   plan: import('@mapatianguis/contracts/routing').RoutePlan | null,
 *   loading: boolean,
 *   error: string | null
 * }} props
 */
export function RoutePlanner({
  from,
  to,
  onFromChange,
  onToChange,
  onSubmit,
  plan,
  loading,
  error
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="route-planner-card" onSubmit={handleSubmit}>
      <div className="route-planner-title">
        <span>🧭 Planificar Ruta (Punto A ➔ B)</span>
        <span
          style={{
            fontSize: '0.65rem',
            background: '#bbf7d0',
            color: '#166534',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
        >
          MULTIMODAL
        </span>
      </div>

      <div className="route-input-group">
        <div className="route-input-row">
          <span className="route-dot-indicator" style={{ background: '#2563eb' }} />
          <input
            type="text"
            id="route-from"
            placeholder="Origen: 'Mi ubicación' o lugar (ej. Zócalo, Bellas Artes)"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
          />
        </div>
        <div className="route-input-row">
          <span className="route-dot-indicator" style={{ background: '#ef4444' }} />
          <input
            type="text"
            id="route-to"
            placeholder="Destino: Mercado, Tianguis o Lugar (ej. Jamaica)"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn-calc-route"
        disabled={loading}
        style={loading ? { opacity: 0.7, cursor: 'wait' } : undefined}
      >
        <span>⚡</span>
        <span>Calcular Ruta Óptima</span>
      </button>

      <div id="route-result-box" className={plan || error ? 'is-visible' : ''}>
        <div
          style={{ fontWeight: 800, color: '#15803d', marginBottom: '4px' }}
          id="route-summary-title"
        >
          {plan?.title || 'Ruta Calculada'}
        </div>
        <div id="route-summary-content" style={{ color: '#334155', lineHeight: 1.4 }}>
          {error ? (
            <span style={{ color: '#991b1b' }}>{error}</span>
          ) : plan ? (
            plan.steps.length > 0 ? (
              <>
                ⏱️ <b>Tiempo estimado:</b> ~{plan.estimatedMinutes[0]} -{' '}
                {plan.estimatedMinutes[1]} min
                <br />
                💵 <b>Costo oficial:</b> ${plan.fareMxn.toFixed(2)} MXN (Tarifa
                Integrada MI)
                <br />
                {plan.steps.map((step, index) => (
                  <span className="route-result-step" key={`${step.icon}-${index}`}>
                    {index + 1}. {step.icon}{' '}
                    <span dangerouslySetInnerHTML={{ __html: step.html ?? step.text }} />
                  </span>
                ))}
                <span className="route-result-emissions">
                  🌱 Ahorro CO₂: ~{plan.co2SavedKg.toFixed(2)} kg vs automóvil.
                </span>
              </>
            ) : (
              'Calculando ruta directa sobre la red...'
            )
          ) : null}
        </div>
      </div>
    </form>
  );
}
