interface PaginationProps {
  page: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  /** Noun shown in the summary, e.g. "Assets", "Projects". */
  itemLabel: string;
  onPageChange: (page: number) => void;
}

/**
 * Table footer: "Showing 1-8 of 248 Assets" plus previous/next controls,
 * matching the Figma Asset Registry footer.
 */
export function Pagination({
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  total,
  itemLabel,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center px-3 py-3">
      <p className="bt-label mb-0">
        Showing {rangeStart}–{rangeEnd} of {total} {itemLabel}
      </p>

      <nav className="d-flex align-items-center gap-2" aria-label="Table pagination">
        <button
          type="button"
          className="btn btn-outline-bt btn-icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <i className="bi bi-chevron-left" aria-hidden="true" />
        </button>

        <span className="bt-label mb-0" aria-live="polite">
          {page} / {pageCount}
        </span>

        <button
          type="button"
          className="btn btn-outline-bt btn-icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
