import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { categoriaPorId } from '@mapatianguis/contracts/giros';

const GIROS = [
  'Frutas y verduras',
  'Comida preparada',
  'Ropa y calzado',
  'Abarrotes',
  'Plantas y flores',
  'Artesanías',
  'Electrónica',
  'Artículos para el hogar',
  'Panadería',
  'Juguetes'
];

const CURIOSIDADES = [
  'Se estima que cada semana pasan cerca de {puestos} puestos por este tianguis.',
  'Lleva alrededor de {antiguedad} años instalándose en la misma colonia.',
  'Ocupa unas {superficie} m² de vía pública durante su jornada.',
  'El giro con más presencia es {giro}, seguido del comercio familiar.',
  'Es un punto de compra de barrio: la mayoría de sus visitantes llega caminando.',
  'Los domingos suele ser el día de mayor afluencia para este tipo de tianguis.'
];

const PHOTO_LABELS = Object.freeze({
  principal: { label: 'Foto del tianguis', short: 'Foto' },
  calle: { label: 'Vista de calle', short: 'Calle' }
});

/**
 * Panel derecho de previsualización de un tianguis.
 *
 * La información marcada como estimada es de ejemplo: sirve para probar el
 * layout de la vista previa mientras el ETL no entrega esos campos.
 *
 * @param {{
 *   selection: { kind: string, data: any } | null,
 *   nearbyStations?: { station: any, distanceMeters: number }[],
 *   onClose: () => void
 * }} props
 */
export function TianguisPreview({ selection, nearbyStations = [], onClose }) {
  const tianguis = selection?.kind === 'tianguis' ? selection.data : null;
  const preview = useMemo(() => (tianguis ? buildPreview(tianguis) : null), [tianguis]);
  const photos = useMemo(() => buildPhotoEntries(tianguis), [tianguis]);
  const [activePhotoKind, setActivePhotoKind] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activePhoto =
    photos.find((photo) => photo.kind === activePhotoKind) ?? photos[0] ?? null;

  useEffect(() => {
    setActivePhotoKind(null);
    setLightboxOpen(false);
  }, [tianguis]);

  useEffect(() => {
    if (!tianguis) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (lightboxOpen) {
        setLightboxOpen(false);
        return;
      }
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tianguis, lightboxOpen, onClose]);

  if (!tianguis || !preview) return null;

  return (
    <aside
      className="tianguis-preview"
      role="complementary"
      aria-label={`Vista previa del tianguis de ${tianguis.colonia}`}
    >
      <div className="tianguis-preview-topbar">
        <div className="tianguis-preview-kicker">
          <span>Vista previa</span>
          <span className="tianguis-preview-demo">Datos de ejemplo</span>
        </div>
        <button
          type="button"
          className="tianguis-preview-close"
          onClick={onClose}
          title="Cerrar vista previa"
          aria-label="Cerrar vista previa"
        >
          ✕
        </button>
      </div>

      <div className="tianguis-preview-scroll">
        {activePhoto && (
          <PhotoGallery
            tianguis={tianguis}
            photos={photos}
            activePhoto={activePhoto}
            onSelect={setActivePhotoKind}
            onOpen={() => setLightboxOpen(true)}
          />
        )}

        <div className="tianguis-preview-hero">
          <div className="tianguis-preview-emoji" aria-hidden="true">
            🧺
          </div>
          <div>
            <span className="detail-tag" style={{ background: '#0f5953' }}>
              Tianguis móvil
            </span>
            <h2 className="tianguis-preview-title">Tianguis {tianguis.colonia}</h2>
            <p className="tianguis-preview-sub">
              {tianguis.alcaldia} · {tianguis.colonia}
            </p>
          </div>
        </div>

        <div className="tianguis-preview-stats">
          <PreviewStat label="Día" value={tianguis.dia} />
          <PreviewStat label="Horario" value={tianguis.horario} />
          <PreviewStat label="Puestos (est.)" value={preview.puestos.toLocaleString('es-MX')} />
          <PreviewStat
            label="Visitantes (est.)"
            value={`${preview.visitantes.toLocaleString('es-MX')}/día`}
          />
        </div>

        <section className="tianguis-preview-block">
          <h3>📍 Dónde se instala</h3>
          <p className="tianguis-preview-address">
            <i>{tianguis.ubicacion}</i>
          </p>
        </section>

        <section className="tianguis-preview-block">
          <h3>🛒 Giro declarado</h3>
          {tianguis.categorias?.length > 0 ? (
            <>
              <div className="tianguis-preview-chips">
                {tianguis.categorias.map((id) => {
                  const categoria = categoriaPorId(id);
                  return (
                    <span
                      key={id}
                      className="tianguis-preview-chip tianguis-preview-chip--giro"
                      style={{ background: categoria.tono }}
                    >
                      {categoria.icono} {categoria.nombre}
                    </span>
                  );
                })}
              </div>
              <p className="tianguis-preview-giro-raw">
                Directorio ADIP: <i>“{tianguis.giro}”</i>
              </p>
            </>
          ) : (
            <p className="tianguis-preview-empty">
              El directorio oficial no declara giro para este tianguis: en el mapa va en
              rojo, como 1,053 de los 1,367.
            </p>
          )}
          <h3>🍎 Giros de ejemplo (est.)</h3>
          <div className="tianguis-preview-chips">
            {preview.giros.map((giro) => (
              <span key={giro} className="tianguis-preview-chip">
                {giro}
              </span>
            ))}
          </div>
        </section>

        <section className="tianguis-preview-block">
          <h3>🚇 Estaciones de referencia</h3>
          {nearbyStations.length > 0 ? (
            <ul className="tianguis-preview-stations">
              {nearbyStations.map(({ station, distanceMeters }, index) => (
                <li key={`${station.mode}-${station.nombre}-${index}`}>
                  <span
                    className="tianguis-preview-station-dot"
                    style={{ background: station.color ?? '#d81b60' }}
                    aria-hidden="true"
                  />
                  <span>
                    <b>
                      {station.mode} {station.nombre}
                    </b>
                    <small>
                      {station.linea
                        ? `${station.mode === 'Metro' ? `Línea ${station.linea}` : station.linea} · `
                        : ''}
                      {Math.round(distanceMeters)} m
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tianguis-preview-empty">
              No hay estaciones de Metro o Metrobús a menos de 1 km.
            </p>
          )}
        </section>

        <section className="tianguis-preview-block tianguis-preview-fact">
          <h3>💡 Dato de ejemplo</h3>
          <p>{preview.curiosidad}</p>
        </section>

        <p className="tianguis-preview-note">
          Día, horario y ubicación vienen del directorio oficial. Los valores
          marcados como <b>est.</b> son datos inventados para probar la vista
          previa.
        </p>
      </div>

      {lightboxOpen &&
        activePhoto &&
        createPortal(
          <div
            className="tianguis-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`Fotos del tianguis de ${tianguis.colonia}`}
            onClick={() => setLightboxOpen(false)}
          >
            <figure
              className="tianguis-lightbox-figure"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={activePhoto.full}
                alt={photoAlt(tianguis, activePhoto.kind)}
                decoding="async"
              />
              <figcaption>
                <span>
                  {activePhoto.label} · {tianguis.colonia}
                </span>
                <small>{activePhoto.credit}</small>
              </figcaption>
            </figure>
            <button
              type="button"
              className="tianguis-lightbox-close"
              onClick={() => setLightboxOpen(false)}
              title="Cerrar foto"
              aria-label="Cerrar foto"
            >
              ✕
            </button>
          </div>,
          document.body
        )}
    </aside>
  );
}

/**
 * Galería de la ficha: una imagen principal y miniaturas que cambian al pasar
 * el cursor. La imagen se puede abrir en grande con click o teclado.
 */
function PhotoGallery({ tianguis, photos, activePhoto, onSelect, onOpen }) {
  return (
    <section className="tianguis-preview-photos" aria-label="Fotos del tianguis">
      <div className="tianguis-preview-photo-frame">
        <button
          type="button"
          className="tianguis-preview-photo-open"
          onClick={onOpen}
          aria-label={`Ver ${activePhoto.label.toLowerCase()} en grande`}
        >
          <img
            key={activePhoto.full}
            src={activePhoto.full}
            alt={photoAlt(tianguis, activePhoto.kind)}
            loading="eager"
            decoding="async"
          />
        </button>
        <span className="tianguis-preview-photo-kind">{activePhoto.short}</span>
        <span className="tianguis-preview-photo-credit">{activePhoto.credit}</span>
        <span className="tianguis-preview-photo-expand" aria-hidden="true">
          ⤢
        </span>
      </div>

      {photos.length > 1 && (
        <div className="tianguis-preview-photo-thumbs">
          {photos.map((photo) => (
            <button
              key={photo.kind}
              type="button"
              className={`tianguis-preview-photo-thumb${
                photo.kind === activePhoto.kind ? ' is-active' : ''
              }`}
              onClick={() => onSelect(photo.kind)}
              onMouseEnter={() => onSelect(photo.kind)}
              onFocus={() => onSelect(photo.kind)}
              aria-pressed={photo.kind === activePhoto.kind}
              aria-label={`Ver ${photo.label.toLowerCase()}`}
            >
              <img
                src={photo.thumb}
                alt=""
                loading="lazy"
                decoding="async"
                aria-hidden="true"
              />
              <span>{photo.short}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function photoAlt(tianguis, kind) {
  return kind === 'calle'
    ? `Vista de calle cerca del tianguis en ${tianguis.colonia}, ${tianguis.alcaldia}`
    : `Foto del tianguis en ${tianguis.colonia}, ${tianguis.alcaldia}`;
}

function buildPhotoEntries(tianguis) {
  if (!tianguis?.fotos) return [];
  return ['principal', 'calle']
    .map((kind) => {
      const photo = tianguis.fotos[kind];
      if (!photo?.thumb || !photo?.full) return null;
      const labels = PHOTO_LABELS[kind];
      return {
        kind,
        label: labels.label,
        short: labels.short,
        credit: photo.credit ?? 'Google Maps',
        thumb: photo.thumb,
        full: photo.full
      };
    })
    .filter(Boolean);
}

function PreviewStat({ label, value }) {
  return (
    <div className="tianguis-preview-stat">
      <span>{value}</span>
      <small>{label}</small>
    </div>
  );
}

function buildPreview(tianguis) {
  const random = mulberry32(
    hashString(
      `${tianguis.alcaldia}|${tianguis.colonia}|${tianguis.ubicacion}|${tianguis.dia}`
    )
  );

  const puestos = 20 + Math.floor(random() * 150);
  const visitantes = Math.round((puestos * (18 + random() * 30)) / 50) * 50;
  const antiguedad = 3 + Math.floor(random() * 38);
  const superficie = 150 + Math.round((random() * 1700) / 50) * 50;
  const giros = shuffle(GIROS, random).slice(0, 3);
  const template = CURIOSIDADES[Math.floor(random() * CURIOSIDADES.length)];

  const curiosidad = template
    .replaceAll('{puestos}', puestos.toLocaleString('es-MX'))
    .replaceAll('{antiguedad}', String(antiguedad))
    .replaceAll('{superficie}', superficie.toLocaleString('es-MX'))
    .replaceAll('{giro}', giros[0].toLowerCase());

  return { puestos, visitantes, giros, curiosidad };
}

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

/** Hash estable para que un tianguis siempre muestre los mismos datos de ejemplo. */
function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
