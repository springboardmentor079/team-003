import { useMemo, useState } from 'react';

import type { FilterValues, SortDirection } from '../types';

interface TableControlsOptions<T> {
  rows: T[];
  /** Fields scanned by the search box. */
  searchKeys: (keyof T)[];
  /** Map of filter id -> row field the filter applies to. */
  filterKeys?: Partial<Record<string, keyof T>>;
  initialSortKey?: keyof T;
  initialSortDirection?: SortDirection;
  pageSize?: number;
}

interface TableControls<T> {
  /** Rows for the current page, after search, filter and sort. */
  pageRows: T[];
  /** All rows matching search and filters, before pagination. */
  matchedRows: T[];
  search: string;
  setSearch: (value: string) => void;
  filters: FilterValues;
  setFilter: (id: string, value: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  sortKey: keyof T | null;
  sortDirection: SortDirection;
  toggleSort: (key: keyof T) => void;
  page: number;
  setPage: (page: number) => void;
  pageCount: number;
  pageSize: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
}

const ALL = 'all';

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true });
}

/**
 * Search + filter + sort + paginate for the data tables.
 *
 * Kept generic so every module screen shares one implementation instead of
 * repeating the same `useMemo` chain.
 */
export function useTableControls<T>({
  rows,
  searchKeys,
  filterKeys = {},
  initialSortKey,
  initialSortDirection = 'asc',
  pageSize = 8,
}: TableControlsOptions<T>): TableControls<T> {
  const [search, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortKey, setSortKey] = useState<keyof T | null>(initialSortKey ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [page, setPage] = useState(1);

  const matchedRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      const matchesSearch =
        !term ||
        searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(term));

      if (!matchesSearch) return false;

      return Object.entries(filters).every(([filterId, value]) => {
        if (!value || value === ALL) return true;
        const field = filterKeys[filterId];
        if (!field) return true;
        return String(row[field] ?? '') === value;
      });
    });

    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      const result = compareValues(a[sortKey], b[sortKey]);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [rows, search, searchKeys, filters, filterKeys, sortKey, sortDirection]);

  const total = matchedRows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, total);

  const pageRows = useMemo(
    () => matchedRows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [matchedRows, safePage, pageSize],
  );

  return {
    pageRows,
    matchedRows,
    search,
    setSearch: (value: string) => {
      setSearchValue(value);
      setPage(1);
    },
    filters,
    setFilter: (id: string, value: string) => {
      setFilters((current) => ({ ...current, [id]: value }));
      setPage(1);
    },
    clearFilters: () => {
      setFilters({});
      setPage(1);
    },
    activeFilterCount: Object.values(filters).filter((value) => value && value !== ALL)
      .length,
    sortKey,
    sortDirection,
    toggleSort: (key: keyof T) => {
      if (sortKey === key) {
        setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
      setPage(1);
    },
    page: safePage,
    setPage,
    pageCount,
    pageSize,
    rangeStart,
    rangeEnd,
    total,
  };
}
