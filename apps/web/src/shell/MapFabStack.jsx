/**
 * Botones flotantes del mapa.
 * @param {{
 *   onLocate: () => void,
 *   onReset: () => void,
 *   onToggleBase: () => void
 * }} props
 */
export function MapFabStack({ onLocate, onReset, onToggleBase }) {
  return (
    <div className="map-floating-actions">
      <button
        type="button"
        className="map-fab"
        onClick={onLocate}
        title="Mi ubicación GPS (Punto Azul)"
      >
        <svg viewBox="0 0 24 24" fill="#0d9488">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
        </svg>
      </button>
      <button type="button" className="map-fab" onClick={onReset} title="Centrar CDMX">
        <svg viewBox="0 0 24 24" fill="#0f5953">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
        </svg>
      </button>
      <button
        type="button"
        className="map-fab"
        onClick={onToggleBase}
        title="Alternar Mapa Base"
      >
        <svg viewBox="0 0 24 24" fill="#0284c7">
          <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9.07l-9-7-9 7 1.63 1.2L12 16z" />
        </svg>
      </button>
    </div>
  );
}
