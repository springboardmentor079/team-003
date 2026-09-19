import { useState } from 'react';

import { BarChart } from '../../components/charts/BarChart';
import { chartColors } from '../../components/charts/chartTheme';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Modal } from '../../components/common/Modal';
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
import { Toast } from '../../components/common/Toast';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { StatCard } from '../../components/dashboard/StatCard';
import { FormField } from '../../components/forms/FormField';
import { DataTable } from '../../components/tables/DataTable';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useTableControls } from '../../hooks/useTableControls';
import { resourceService } from '../../services';
import { maintenanceSchedule, resourceUtilisation } from '../../data/resources';
import { totalWorkforce } from '../../data/workforce';
import {
  RESOURCE_CATEGORIES,
  RESOURCE_STATUSES,
  type DataTableColumn,
  type FilterDefinition,
  type KpiMetric,
  type Resource,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/format';
import { isValid, requiredField, type FieldErrors } from '../../utils/validation';

/**
 * KPI strip from the Figma Resource screen. "Material Stock" is dropped here
 * because materials are a separate module (5) with their own screen; the
 * third card reports maintenance instead, which the Figma omitted despite
 * being a listed feature (module 4, feature v).
 */
/** KPI cards computed from the live resource list (module 4, features i–iv). */
function buildKpis(rows: Resource[]): KpiMetric[] {
  const total = rows.length;
  const allocated = rows.filter((r) => r.status === 'Allocated').length;
  const available = rows.filter((r) => r.status === 'Available').length;
  const utilisation = total > 0 ? Math.round((allocated / total) * 100) : 0;

  return [
    {
      id: 'res-utilisation',
      label: 'Equipment Utilization',
      value: String(utilisation),
      unit: '%',
      caption: `${allocated} of ${total} assets allocated`,
      delta: 'Live',
      trend: 'up',
      progress: utilisation,
      accent: 'green',
      icon: 'bi-truck-front',
    },
    {
      id: 'res-availability',
      label: 'Available Assets',
      value: String(available),
      unit: 'units',
      caption: 'Ready for allocation across all sites',
      delta: `${total} total`,
      trend: 'flat',
      progress: total > 0 ? Math.round((available / total) * 100) : 0,
      accent: 'accent',
      icon: 'bi-box-arrow-in-down',
    },
    {
      id: 'res-workforce',
      label: 'Active Workforce',
      value: formatNumber(totalWorkforce),
      unit: 'personnel',
      caption: 'Deployed across all active projects',
      delta: '+12',
      trend: 'up',
      progress: 92,
      accent: 'accent',
      icon: 'bi-people',
    },
  ];
}

const FILTERS: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Resource category',
    options: RESOURCE_CATEGORIES.map((value) => ({ label: value, value })),
  },
  {
    id: 'status',
    label: 'Status',
    options: RESOURCE_STATUSES.map((value) => ({ label: value, value })),
  },
];

const FILTER_KEYS: Partial<Record<string, keyof Resource>> = {
  category: 'category',
  status: 'status',
};

interface ResourceFormValues {
  name: string;
  category: string;
  status: string;
  allocatedProject: string;
  operator: string;
}

const EMPTY_RESOURCE: ResourceFormValues = {
  name: '',
  category: '',
  status: 'Available',
  allocatedProject: '',
  operator: '',
};

/**
 * Resource Inventory, rebuilt from the Figma "resource" frame.
 *
 * Corrections against the document:
 *  - The Asset Registry mixed a "Human" row (Welding Team Alpha) into an
 *    equipment table; workforce is module 6 and has its own screen.
 *  - Status values "Active / Depleted / Deployed / Maintenance" are replaced
 *    by the resource states the document implies: Available, Allocated,
 *    Under Maintenance, Out of Service.
 *  - Categories are the document's six resource categories.
 *  - Maintenance scheduling (feature v) was missing entirely and is added.
 */
export function ResourcesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [values, setValues] = useState<ResourceFormValues>(EMPTY_RESOURCE);
  const [errors, setErrors] = useState<FieldErrors<ResourceFormValues>>({});

  const { data: resources, loading, error } = useAsyncData(
    () => resourceService.list(),
    [],
  );
  const kpis = buildKpis(resources ?? []);

  const controls = useTableControls<Resource>({
    rows: resources ?? [],
    searchKeys: ['assetId', 'name', 'category', 'allocatedProject', 'operator'],
    filterKeys: FILTER_KEYS,
    initialSortKey: 'assetId',
    pageSize: 8,
  });

  function setField(field: keyof ResourceFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors<ResourceFormValues> = {
      name: requiredField(values.name, 'Asset name'),
      category: requiredField(values.category, 'Resource category'),
    };

    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setToast(`Resource "${values.name}" registered.`);
    setValues(EMPTY_RESOURCE);
    setModalOpen(false);
  }

  const columns: DataTableColumn<Resource>[] = [
    {
      key: 'assetId',
      header: 'Asset ID',
      sortable: true,
      width: '110px',
      render: (row) => <span className="bt-mono small bt-text-dim">{row.assetId}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="mb-1 fw-semibold">{row.name}</p>
          <p className="bt-label mb-0">{row.allocatedProject}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (row) => (
        <span className="d-inline-flex align-items-center gap-2">
          <i className="bi bi-gear-wide-connected bt-text-muted" aria-hidden="true" />
          {row.category}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'conditionPercent',
      header: 'Condition',
      sortable: true,
      width: '170px',
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          <ProgressBar
            value={row.conditionPercent}
            tone={
              row.conditionPercent >= 70
                ? 'success'
                : row.conditionPercent >= 40
                  ? 'warning'
                  : 'danger'
            }
            className="flex-grow-1"
            label={`${row.name} condition`}
          />
          <span className="bt-mono small bt-text-dim">{row.conditionPercent}%</span>
        </div>
      ),
    },
    {
      key: 'nextMaintenance',
      header: 'Next service',
      sortable: true,
      render: (row) => <span className="bt-mono small">{formatDate(row.nextMaintenance)}</span>,
    },
    {
      key: 'operator',
      header: 'Actions',
      align: 'end',
      width: '80px',
      render: () => (
        <button type="button" className="btn btn-ghost btn-icon" aria-label="Asset actions">
          <i className="bi bi-three-dots-vertical" aria-hidden="true" />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Resource Inventory"
        subtitle="Real-time tracking, allocation and maintenance of equipment and machinery across all sites."
        actions={
          <button
            type="button"
            className="btn btn-accent-strong"
            onClick={() => setModalOpen(true)}
          >
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            New resource
          </button>
        }
      />

      <div className="row g-3 g-lg-4 mb-4">
        {kpis.map((metric) => (
          <div className="col-12 col-md-4" key={metric.id}>
            <StatCard metric={metric} />
          </div>
        ))}
      </div>

      <SectionCard
        title="Asset Registry"
        subtitle={`${controls.total} asset${controls.total === 1 ? '' : 's'} in the current view`}
        flush
        className="mb-4"
        actions={
          <>
            <SearchBar
              value={controls.search}
              onChange={controls.setSearch}
              placeholder="Search ID or name"
              label="Search assets"
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
          <LoadingState label="Loading assets…" />
        ) : error ? (
          <StateMessage
            icon="bi-exclamation-triangle"
            title="Couldn't load resources"
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
              caption="Equipment and machinery register with status and condition"
            />

            <hr className="bt-divider m-0" />

            <Pagination
              page={controls.page}
              pageCount={controls.pageCount}
              rangeStart={controls.rangeStart}
              rangeEnd={controls.rangeEnd}
              total={controls.total}
              itemLabel="Assets"
              onPageChange={controls.setPage}
            />
          </>
        )}
      </SectionCard>

      <div className="row g-3 g-lg-4">
        <div className="col-12 col-xl-7">
          <ChartCard
            title="Resource Utilization"
            subtitle="Average utilisation by resource category"
          >
            <BarChart
              labels={resourceUtilisation.map((entry) => entry.label)}
              series={[
                {
                  label: 'Utilisation',
                  values: resourceUtilisation.map((entry) => entry.value),
                },
              ]}
              pointColors={resourceUtilisation.map((entry) =>
                entry.value >= 60 ? chartColors.green : chartColors.accent,
              )}
              valueSuffix="%"
              yMax={100}
              height={280}
              ariaLabel="Resource utilisation by category"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-5">
          <ChartCard
            title="Maintenance Schedule"
            subtitle="Upcoming servicing and inspections"
          >
            <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
              {maintenanceSchedule.map((entry) => (
                <li
                  key={entry.id}
                  className="d-flex justify-content-between align-items-start gap-3"
                >
                  <div className="min-w-0">
                    <p className="mb-1 fw-semibold" style={{ fontSize: '0.9rem' }}>
                      {entry.assetName}
                    </p>
                    <p className="bt-label mb-0">
                      {entry.assetId} · {entry.type} · {entry.assignedTo}
                    </p>
                  </div>

                  <div className="text-end flex-shrink-0">
                    <p className="bt-mono small mb-1">{formatDate(entry.scheduledOn)}</p>
                    <p className="bt-label mb-0">
                      {entry.estimatedDays} day{entry.estimatedDays === 1 ? '' : 's'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </ChartCard>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title="Register resource"
        description="Add equipment or machinery to the asset registry."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-bt"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="new-resource-form" className="btn btn-accent">
              Register resource
            </button>
          </>
        }
      >
        <form id="new-resource-form" onSubmit={handleCreate} noValidate>
          <div className="row g-3">
            <div className="col-12">
              <FormField
                label="Asset name"
                value={values.name}
                onChange={(value) => setField('name', value)}
                error={errors.name}
                placeholder="e.g. Heavy Excavator ZX-350"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                as="select"
                label="Resource category"
                value={values.category}
                onChange={(value) => setField('category', value)}
                options={RESOURCE_CATEGORIES}
                error={errors.category}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                as="select"
                label="Status"
                value={values.status}
                onChange={(value) => setField('status', value)}
                options={RESOURCE_STATUSES}
                placeholderOption="Select status"
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                label="Allocated project"
                value={values.allocatedProject}
                onChange={(value) => setField('allocatedProject', value)}
                placeholder="Leave blank if unallocated"
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                label="Operator"
                value={values.operator}
                onChange={(value) => setField('operator', value)}
                placeholder="Assign an operator"
              />
            </div>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}
