import { useEffect, useRef, useState } from 'react';

import type { FilterDefinition, FilterValues } from '../../types';

interface FilterPanelProps {
  filters: FilterDefinition[];
  values: FilterValues;
  onChange: (id: string, value: string) => void;
  onClear: () => void;
  activeCount: number;
}

/**
 * Dropdown filter panel behind the "Filter" button in the Figma table
 * header. Each filter is a select whose options come from the document's
 * category lists.
 */
export function FilterPanel({
  filters,
  values,
  onChange,
  onClear,
  activeCount,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="position-relative" ref={containerRef}>
      <button
        type="button"
        className="btn btn-outline-bt d-inline-flex align-items-center gap-2"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <i className="bi bi-funnel" aria-hidden="true" />
        <span className="bt-label" style={{ color: 'inherit' }}>
          Filter
        </span>
        {activeCount > 0 && (
          <span className="bt-badge bt-badge-accent py-0 px-2">{activeCount}</span>
        )}
      </button>

      {open && (
        <div
          className="dropdown-menu show p-3"
          style={{
            display: 'block',
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 0.5rem)',
            minWidth: '272px',
            zIndex: 20,
          }}
        >
          {filters.map((filter) => (
            <div className="mb-3" key={filter.id}>
              <label className="form-label" htmlFor={`filter-${filter.id}`}>
                {filter.label}
              </label>
              <select
                id={`filter-${filter.id}`}
                className="form-select"
                value={values[filter.id] ?? 'all'}
                onChange={(event) => onChange(filter.id, event.target.value)}
              >
                <option value="all">All</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="d-flex justify-content-between align-items-center pt-1">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClear}
              disabled={activeCount === 0}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={() => setOpen(false)}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
