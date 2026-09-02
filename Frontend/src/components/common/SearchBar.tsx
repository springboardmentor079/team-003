import { useId } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/** Search input with a leading icon and a clear button. */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  className = '',
  size = 'md',
}: SearchBarProps) {
  const inputId = useId();

  return (
    <div className={`position-relative ${className}`.trim()}>
      <label className="visually-hidden" htmlFor={inputId}>
        {label}
      </label>

      <i
        className="bi bi-search position-absolute top-50 translate-middle-y bt-text-muted"
        style={{ left: '0.85rem', fontSize: '0.85rem' }}
        aria-hidden="true"
      />

      <input
        id={inputId}
        type="search"
        className="form-control"
        style={{
          paddingLeft: '2.4rem',
          paddingRight: value ? '2.4rem' : undefined,
          paddingTop: size === 'sm' ? '0.45rem' : undefined,
          paddingBottom: size === 'sm' ? '0.45rem' : undefined,
        }}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      {value && (
        <button
          type="button"
          className="btn btn-ghost position-absolute top-50 translate-middle-y p-0 d-flex align-items-center justify-content-center"
          style={{ right: '0.55rem', width: '1.5rem', height: '1.5rem' }}
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <i className="bi bi-x-lg" style={{ fontSize: '0.7rem' }} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
