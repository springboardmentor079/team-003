import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

import { FilterPanel } from '../../components/common/FilterPanel';
import {
  LoadingState,
  PageHeader,
  SectionCard,
  StateMessage,
} from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { ProgressBar } from '../../components/common/ProgressBar';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/tables/DataTable';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useTableControls } from '../../hooks/useTableControls';
import { projectService } from '../../services';
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  type DataTableColumn,
  type FilterDefinition,
  type Project,
} from '../../types';
import { formatCurrencyCompact, formatDate } from '../../utils/format';

const FILTERS: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Project category',
    options: PROJECT_CATEGORIES.map((value) => ({ label: value, value })),
  },
  {
    id: 'status',
    label: 'Status',
    options: PROJECT_STATUSES.map((value) => ({ label: value, value })),
  },
  {
    id: 'health',
    label: 'Schedule health',
    options: ['On Track', 'At Risk', 'Delayed'].map((value) => ({ label: value, value })),
  },
];

const FILTER_KEYS: Partial<Record<string, keyof Project>> = {
  category: 'category',
  status: 'status',
  health: 'health',
};

/**
 * Project listing — document module 2. The Figma had no project list screen
 * (its sidebar entry was "Project Grid"), so this is built in the same
 * visual language as the Figma Asset Registry table.
 */
export function ProjectsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: projects, loading, error } = useAsyncData(() => projectService.list(), []);

  const controls = useTableControls<Project>({
    rows: projects ?? [],
    searchKeys: ['name', 'code', 'client', 'location', 'projectManager'],
    filterKeys: FILTER_KEYS,
    initialSortKey: 'name',
    pageSize: 6,
  });

  const { setSearch } = controls;
  const queryParam = searchParams.get('q');

  // Honour the global search from the top bar.
  useEffect(() => {
    if (queryParam) setSearch(queryParam);
  }, [queryParam, setSearch]);

  const columns: DataTableColumn<Project>[] = [
    {
      key: 'code',
      header: 'Project ID',
      sortable: true,
      width: '110px',
      render: (row) => <span className="bt-mono small bt-text-dim">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Project name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="mb-1 fw-semibold">{row.name}</p>
          <p className="bt-label mb-0">
            {row.location} · {row.client}
          </p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'health',
      header: 'Health',
      sortable: true,
      render: (row) => <StatusBadge status={row.health} />,
    },
    {
      key: 'progress',
      header: 'Progress',
      sortable: true,
      width: '160px',
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          <ProgressBar
            value={row.progress}
            tone={row.health === 'Delayed' ? 'danger' : row.health === 'At Risk' ? 'warning' : 'success'}
            className="flex-grow-1"
            label={`${row.name} progress`}
          />
          <span className="bt-mono small bt-text-dim">{row.progress}%</span>
        </div>
      ),
    },
    {
      key: 'budgetAllocated',
      header: 'Budget',
      sortable: true,
      align: 'end',
      render: (row) => (
        <div className="text-end">
          <p className="mb-0 bt-mono small">{formatCurrencyCompact(row.budgetSpent)}</p>
          <p className="bt-label mb-0">of {formatCurrencyCompact(row.budgetAllocated)}</p>
        </div>
      ),
    },
    {
      key: 'targetEndDate',
      header: 'Target end',
      sortable: true,
      render: (row) => <span className="bt-mono small">{formatDate(row.targetEndDate)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Plan, schedule and track every construction project from a single register."
        actions={
          <button
            type="button"
            className="btn btn-outline-bt"
            onClick={() => navigate('/app/site-progress')}
          >
            <i className="bi bi-clipboard-data me-2" aria-hidden="true" />
            Progress reports
          </button>
        }
      />

      <SectionCard
        title="Project register"
        subtitle={`${controls.total} project${controls.total === 1 ? '' : 's'} matching your view`}
        flush
        actions={
          <>
            <SearchBar
              value={controls.search}
              onChange={controls.setSearch}
              placeholder="Search project, client or location"
              label="Search projects"
              size="sm"
            />
            <FilterPanel
              filters={FILTERS}
              values={controls.filters}
              onChange={controls.setFilter}
              onClear={controls.clearFilters}
              activeCount={controls.activeFilterCount}
            />
          </>
        }
      >
        {loading ? (
          <LoadingState label="Loading projects…" />
        ) : error ? (
          <StateMessage
            icon="bi-exclamation-triangle"
            title="Couldn't load projects"
            message={error}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={controls.pageRows}
              rowKey={(row) => row.id}
              sortKey={controls.sortKey}
              sortDirection={controls.sortDirection}
              onSort={controls.toggleSort}
              onRowClick={(row) => navigate(`/app/projects/${row.code}`)}
              caption="Construction projects with status, progress and budget"
            />

            <hr className="bt-divider m-0" />

            <Pagination
              page={controls.page}
              pageCount={controls.pageCount}
              rangeStart={controls.rangeStart}
              rangeEnd={controls.rangeEnd}
              total={controls.total}
              itemLabel="Projects"
              onPageChange={controls.setPage}
            />
          </>
        )}
      </SectionCard>
    </>
  );
}
