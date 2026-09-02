import type { DataTableColumn, SortDirection } from '../../types';

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sortKey?: keyof T | null;
  sortDirection?: SortDirection;
  onSort?: (key: keyof T) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  caption?: string;
}

/**
 * Generic, sortable data table.
 *
 * Wrapped in `.bt-table-wrap` (overflow-x: auto) so wide tables stay usable
 * on tablet and mobile without breaking the page layout.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  sortKey,
  sortDirection = 'asc',
  onSort,
  onRowClick,
  emptyMessage = 'No records match the current search and filters.',
  caption,
}: DataTableProps<T>) {
  function renderSortIcon(column: DataTableColumn<T>) {
    if (!column.sortable || !onSort) return null;

    if (sortKey !== column.key) {
      return <i className="bi bi-chevron-expand bt-sort-icon opacity-50" aria-hidden="true" />;
    }

    return (
      <i
        className={`bi ${
          sortDirection === 'asc' ? 'bi-arrow-up-short' : 'bi-arrow-down-short'
        } bt-sort-icon bt-accent`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="bt-table-wrap">
      <table className="bt-table">
        {caption && <caption className="visually-hidden">{caption}</caption>}

        <thead>
          <tr>
            {columns.map((column) => {
              const isSorted = sortKey === column.key;
              const sortable = column.sortable && onSort;

              return (
                <th
                  key={String(column.key)}
                  scope="col"
                  style={{ width: column.width, textAlign: column.align ?? 'start' }}
                  className={sortable ? 'bt-th-sortable' : undefined}
                  aria-sort={
                    isSorted
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : sortable
                        ? 'none'
                        : undefined
                  }
                  onClick={sortable ? () => onSort(column.key) : undefined}
                  onKeyDown={
                    sortable
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onSort(column.key);
                          }
                        }
                      : undefined
                  }
                  tabIndex={sortable ? 0 : undefined}
                >
                  {column.header}
                  {renderSortIcon(column)}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-5 bt-text-muted">
                <i className="bi bi-inbox d-block mb-2" style={{ fontSize: '1.5rem' }} aria-hidden="true" />
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    style={{ textAlign: column.align ?? 'start' }}
                  >
                    {column.render ? column.render(row) : String(row[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
