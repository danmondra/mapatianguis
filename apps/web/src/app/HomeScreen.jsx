import './styles/home.css';

/**
 * Pantalla de inicio (maqueta estática inspirada en la app CDMX).
 *
 * Sin datos ni interactividad: describe la estructura y los estilos del home
 * futuro. Todos los accesos abren el mapa; el acceso propio de este proyecto
 * es "Abasto y Comercio", que ocupa el lugar de "Movilidad" y se remarca para
 * ganar relevancia.
 *
 * @param {{ onOpenMap: () => void }} props
 */
export function HomeScreen({ onOpenMap }) {
  return (
    <div className="home-screen">
      <div className="home-screen__inner">
        <header className="home-header">
          <div className="home-header__bar">
            <span className="home-header__emblem" aria-hidden="true">
              ✿
            </span>
            <div className="home-header__brand">
              <span className="home-header__shield" aria-hidden="true">
                CDMX
              </span>
              <span className="home-header__brand-text">
                <span className="home-header__brand-title">
                  Gobierno de la Ciudad de México
                </span>
                <span className="home-header__brand-sub">
                  Capital de la transformación
                </span>
              </span>
            </div>
            <span className="home-header__profile" aria-hidden="true" />
          </div>

          <p className="home-header__greeting">
            <span className="home-header__avatar" aria-hidden="true">
              ✷
            </span>
            <span>Hola, Williams Enrique</span>
          </p>
        </header>

        <section className="home-card" aria-label="Aire y salud">
          <h2 className="home-card__title">Aire y salud</h2>
          <div className="home-card__stats">
            <div className="home-stat">
              <span className="home-stat__icon" aria-hidden="true">
                ☁
              </span>
            </div>
            <div className="home-stat">
              <span className="home-stat__icon" aria-hidden="true">
                ∷
              </span>
            </div>
            <div className="home-stat">
              <span className="home-stat__icon" aria-hidden="true">
                UV
              </span>
            </div>
            <div className="home-stat">
              <span className="home-stat__icon" aria-hidden="true">
                ◕
              </span>
            </div>
          </div>
          <p className="home-card__status">
            No fue posible cargar la información.
          </p>
        </section>

        <section className="home-section" aria-labelledby="home-servicios">
          <div className="home-section__heading">
            <h2 className="home-section__title" id="home-servicios">
              Servicios
            </h2>
          </div>
          <div className="home-shortcuts">
            <button type="button" className="home-shortcut" onClick={onOpenMap}>
              <span className="home-shortcut__icon" aria-hidden="true">
                ⛟
              </span>
              <span>Vehículos</span>
            </button>
            <button type="button" className="home-shortcut home-shortcut--featured" onClick={onOpenMap}>
              <span className="home-shortcut__icon" aria-hidden="true">
                ⛉
              </span>
              <span className="home-shortcut__label--featured">
                Abasto y Comercio
              </span>
            </button>
            <button type="button" className="home-shortcut" onClick={onOpenMap}>
              <span className="home-shortcut__icon" aria-hidden="true">
                ★
              </span>
              <span>Cultura y entretenimiento</span>
            </button>
            <button type="button" className="home-shortcut" onClick={onOpenMap}>
              <span className="home-shortcut__icon" aria-hidden="true">
                ♥
              </span>
              <span>Salud y bienestar</span>
            </button>
            <button type="button" className="home-shortcut" onClick={onOpenMap}>
              <span className="home-shortcut__icon" aria-hidden="true">
                ⛨
              </span>
              <span>Seguridad</span>
            </button>
            <button type="button" className="home-shortcut" onClick={onOpenMap}>
              <span className="home-shortcut__icon" aria-hidden="true">
                ✋
              </span>
              <span>Denuncia y anticorrupción</span>
            </button>
          </div>
        </section>

        <section className="home-section" aria-labelledby="home-atajos">
          <div className="home-section__heading">
            <h2 className="home-section__title" id="home-atajos">
              Mis atajos
            </h2>
            <button
              type="button"
              className="home-section__action"
              onClick={onOpenMap}
              aria-label="Editar atajos"
            >
              ✎
            </button>
          </div>
          <div className="home-shortcuts home-shortcuts--scroll">
            <button type="button" className="home-shortcut" onClick={onOpenMap}>
              <span className="home-shortcut__icon" aria-hidden="true">
                ▤
              </span>
              <span>Recargar tarjeta</span>
            </button>
            <button type="button" className="home-shortcut" onClick={onOpenMap}>
              <span className="home-shortcut__icon" aria-hidden="true">
                U
              </span>
              <span className="home-shortcut__label--strong">
                Información UTOPIAS
              </span>
            </button>
            <button type="button" className="home-shortcut" onClick={onOpenMap}>
              <span className="home-shortcut__icon" aria-hidden="true">
                ⓢ
              </span>
              <span>Quejas y reportes</span>
            </button>
            <button type="button" className="home-shortcut" onClick={onOpenMap}>
              <span className="home-shortcut__icon" aria-hidden="true">
                ☖
              </span>
              <span>Denuncia de delito</span>
            </button>
            <button type="button" className="home-shortcut" onClick={onOpenMap}>
              <span className="home-shortcut__icon" aria-hidden="true">
                ▲
              </span>
              <span>Incidencia</span>
            </button>
          </div>
        </section>

        <p className="home-notice">
          Maqueta de inicio. Por ahora solo muestra estructura y estilos: cada
          acceso lleva al mapa de tianguis.
        </p>

        <div className="home-spacer" aria-hidden="true" />
      </div>

      <nav className="home-tabbar" aria-label="Navegación principal">
        <button type="button" className="home-tab home-tab--active" onClick={onOpenMap}>
          <span className="home-tab__icon" aria-hidden="true">
            ⌂
          </span>
          <span>Inicio</span>
        </button>
        <button type="button" className="home-tab" onClick={onOpenMap}>
          <span className="home-tab__icon" aria-hidden="true">
            ◠
          </span>
          <span>WiFi</span>
        </button>
        <button type="button" className="home-tab" onClick={onOpenMap}>
          <span className="home-tab__icon" aria-hidden="true">
            Ⓟ
          </span>
          <span>Pagos</span>
        </button>
        <button type="button" className="home-tab" onClick={onOpenMap}>
          <span className="home-tab__icon" aria-hidden="true">
            ▭
          </span>
          <span>Documentos</span>
        </button>
        <button type="button" className="home-tab" onClick={onOpenMap}>
          <span className="home-tab__icon" aria-hidden="true">
            ◔
          </span>
          <span>Mi perfil</span>
        </button>
      </nav>
    </div>
  );
}
