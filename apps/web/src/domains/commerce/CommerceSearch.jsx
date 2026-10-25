import { Section } from '../../shared/ui/Section.jsx';

/**
 * Buscador rápido de tianguis por colonia, alcaldía o tramo de calle.
 * @param {{ onSearch: (query: string) => void }} props
 */
export function CommerceSearch({ onSearch }) {
  return (
    <Section title="Buscador de Tianguis">
      <div className="search-input-box">
        <svg className="search-icon-svg" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="text"
          id="market-search"
          placeholder="Buscar tianguis por colonia o alcaldía..."
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>
    </Section>
  );
}
