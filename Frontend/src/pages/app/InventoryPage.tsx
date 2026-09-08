import { useState } from 'react';

import { BarChart } from '../../components/charts/BarChart';
import { DoughnutChart } from '../../components/charts/DoughnutChart';
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
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast } from '../../components/common/Toast';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { StatCard } from '../../components/dashboard/StatCard';
import { FormField } from '../../components/forms/FormField';
import { DataTable } from '../../components/tables/DataTable';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useTableControls } from '../../hooks/useTableControls';
import { inventoryService } from '../../services';
import { materialRequests, stockByCategory } from '../../data/inventory';
import { projects } from '../../data/projects';
import {
  MATERIAL_CATEGORIES,
  type DataTableColumn,
  type FilterDefinition,
  type KpiMetric,
  type MaterialItem,
  type MaterialRequest,
} from '../../types';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import {
  isValid,
  requiredField,
  validatePositiveNumber,
  type FieldErrors,
} from '../../utils/validation';

const TABS = ['Stock register', 'Material requests'] as const;
type Tab = (typeof TABS)[number];

/** KPI cards computed from the live stock list (module 5, features i–v). */
function buildKpis(items: MaterialItem[], openRequests: number): KpiMetric[] {
  const lowStock = items.filter(
    (item) => item.stockStatus === 'Low Stock' || item.stockStatus === 'Out of Stock',
  ).length;
  const inStock = items.filter((item) => item.stockStatus === 'In Stock').length;
  const stockValue = items.reduce(
    (sum, item) => sum + item.quantityInStock * item.unitCost,
    0,
  );

  return [
    {
      id: 'inv-items',
      label: 'Stock Items',
      value: String(items.length),
      unit: 'SKUs',
      caption: 'Tracked across all store locations',
      delta: `${inStock} in stock`,
      trend: 'flat',
      progress: items.length > 0 ? Math.round((inStock / items.length) * 100) : 0,
      accent: 'accent',
      icon: 'bi-box-seam',
    },
    {
      id: 'inv-low',
      label: 'Reorder Alerts',
      value: String(lowStock),
      unit: 'items',
      caption: 'At or below reorder level',
      delta: lowStock > 0 ? 'Action required' : 'Healthy',
      trend: 'down',
      progress: items.length > 0 ? Math.round((lowStock / items.length) * 100) : 0,
      accent: 'red',
      icon: 'bi-exclamation-triangle',
    },
    {
      id: 'inv-requests',
      label: 'Open Requests',
      value: String(openRequests),
      unit: 'requests',
      caption: 'Awaiting issue or fulfilment',
      delta: 'This week',
      trend: 'flat',
      progress: 55,
      accent: 'amber',
      icon: 'bi-clipboard-check',
    },
    {
      id: 'inv-value',
      label: 'Stock Value',
      value: `₹${(stockValue / 100000).toFixed(1)} L`,
      caption: 'Total valuation of held inventory',
      delta: 'Current',
      trend: 'flat',
      progress: 68,
      accent: 'green',
      icon: 'bi-cash-stack',
    },
  ];
}

const MATERIAL_FILTERS: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Material category',
    options: MATERIAL_CATEGORIES.map((value) => ({ label: value, value })),
  },
  {
    id: 'stockStatus',
    label: 'Stock status',
    options: ['In Stock', 'Low Stock', 'Out of Stock', 'Reordered'].map((value) => ({
      label: value,
      value,
    })),
  },
];

const REQUEST_FILTERS: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Material category',
    options: MATERIAL_CATEGORIES.map((value) => ({ label: value, value })),
  },
  {
    id: 'status',
    label: 'Request status',
    options: ['Pending', 'Approved', 'Rejected', 'Issued', 'Fulfilled'].map((value) => ({
      label: value,
      value,
    })),
  },
];

interface RequestFormValues {
  materialName: string;
  category: string;
  quantity: string;
  unit: string;
  projectName: string;
  requiredBy: string;
}

const EMPTY_REQUEST: RequestFormValues = {
  materialName: '',
  category: '',
  quantity: '',
  unit: '',
  projectName: '',
  requiredBy: '',
};

/**
 * Material & Inventory Management — document module 5. Covers material
 * procurement requests, inventory monitoring, material allocation and stock
 * management across the document's seven material categories.
 *
 * The Figma showed only a "Material Stock 72%" tile on the Resource screen;
 * this module had no screen of its own.
 */
export function InventoryPage() {
  const [tab, setTab] = useState<Tab>('Stock register');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [values, setValues] = useState<RequestFormValues>(EMPTY_REQUEST);
  const [errors, setErrors] = useState<FieldErrors<RequestFormValues>>({});

  const { data: materials, loading, error } = useAsyncData(
    () => inventoryService.materials(),
    [],
  );
  const openRequests = materialRequests.filter(
    (request) => request.status === 'Pending' || request.status === 'Approved',
  ).length;
  const kpis = buildKpis(materials ?? [], openRequests);

  const materialControls = useTableControls<MaterialItem>({
    rows: materials ?? [],
    searchKeys: ['name', 'materialCode', 'category', 'storeLocation', 'allocatedProject'],
    filterKeys: { category: 'category', stockStatus: 'stockStatus' },
    initialSortKey: 'name',
    pageSize: 8,
  });

  const requestControls = useTableControls<MaterialRequest>({
    rows: materialRequests,
    searchKeys: ['materialName', 'requestCode', 'projectName', 'requestedBy'],
    filterKeys: { category: 'category', status: 'status' },
    initialSortKey: 'requestedOn',
    initialSortDirection: 'desc',
    pageSize: 8,
  });

  function setField(field: keyof RequestFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleRequest(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors<RequestFormValues> = {
      materialName: requiredField(values.materialName, 'Material'),
      category: requiredField(values.category, 'Material category'),
      quantity: validatePositiveNumber(values.quantity, 'Quantity'),
      unit: requiredField(values.unit, 'Unit'),
      projectName: requiredField(values.projectName, 'Project'),
      requiredBy: requiredField(values.requiredBy, 'Required-by date'),
    };

    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setToast(`Material request raised for ${values.quantity} ${values.unit} of ${values.materialName}.`);
    setValues(EMPTY_REQUEST);
    setModalOpen(false);
  }

  const materialColumns: DataTableColumn<MaterialItem>[] = [
    {
      key: 'materialCode',
      header: 'Code',
      sortable: true,
      width: '110px',
      render: (row) => <span className="bt-mono small bt-text-dim">{row.materialCode}</span>,
    },
    {
      key: 'name',
      header: 'Material',
      sortable: true,
      render: (row) => (
        <div>
          <p className="mb-1 fw-semibold">{row.name}</p>
          <p className="bt-label mb-0">{row.storeLocation}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'quantityInStock',
      header: 'In stock',
      sortable: true,
      align: 'end',
      render: (row) => (
        <div className="text-end">
          <p className="mb-0 bt-mono small">
            {formatNumber(row.quantityInStock)} {row.unit}
          </p>
          <p className="bt-label mb-0">Reorder at {formatNumber(row.reorderLevel)}</p>
        </div>
      ),
    },
    {
      key: 'stockStatus',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.stockStatus} />,
    },
    {
      key: 'unitCost',
      header: 'Unit cost',
      sortable: true,
      align: 'end',
      render: (row) => <span className="bt-mono small">{formatCurrency(row.unitCost)}</span>,
    },
    {
      key: 'allocatedProject',
      header: 'Allocated to',
      sortable: true,
    },
    {
      key: 'lastRestocked',
      header: 'Last restocked',
      sortable: true,
      render: (row) => <span className="bt-mono small">{formatDate(row.lastRestocked)}</span>,
    },
  ];

  const requestColumns: DataTableColumn<MaterialRequest>[] = [
    {
      key: 'requestCode',
      header: 'Request',
      sortable: true,
      width: '110px',
      render: (row) => <span className="bt-mono small bt-text-dim">{row.requestCode}</span>,
    },
    {
      key: 'materialName',
      header: 'Material',
      sortable: true,
      render: (row) => (
        <div>
          <p className="mb-1 fw-semibold">{row.materialName}</p>
          <p className="bt-label mb-0">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      sortable: true,
      align: 'end',
      render: (row) => (
        <span className="bt-mono small">
          {formatNumber(row.quantity)} {row.unit}
        </span>
      ),
    },
    { key: 'projectName', header: 'Project', sortable: true },
    { key: 'requestedBy', header: 'Requested by', sortable: true },
    {
      key: 'requiredBy',
      header: 'Required by',
      sortable: true,
      render: (row) => <span className="bt-mono small">{formatDate(row.requiredBy)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const activeControls = tab === 'Stock register' ? materialControls : requestControls;

  return (
    <>
      <PageHeader
        title="Material & Inventory"
        subtitle="Stock monitoring, material requests, allocation and reorder management across all sites."
        actions={
          <button type="button" className="btn btn-accent" onClick={() => setModalOpen(true)}>
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Raise material request
          </button>
        }
      />

      <div className="row g-3 g-lg-4 mb-4">
        {kpis.map((metric) => (
          <div className="col-12 col-sm-6 col-xl-3" key={metric.id}>
            <StatCard metric={metric} />
          </div>
        ))}
      </div>

      <div className="row g-3 g-lg-4 mb-4">
        <div className="col-12 col-xl-8">
          <ChartCard
            title="Stock Level by Category"
            subtitle="Percent of reorder target held in store"
          >
            <BarChart
              labels={stockByCategory.map((entry) => entry.label)}
              series={[
                { label: 'Stock level', values: stockByCategory.map((entry) => entry.value) },
              ]}
              pointColors={stockByCategory.map((entry) =>
                entry.value === 0
                  ? chartColors.red
                  : entry.value < 50
                    ? chartColors.amber
                    : chartColors.green,
              )}
              valueSuffix="%"
              yMax={100}
              height={280}
              ariaLabel="Stock level by material category"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-4">
          <ChartCard
            title="Request Status"
            subtitle="Material requests by current state"
          >
            <DoughnutChart
              labels={['Pending', 'Approved', 'Issued', 'Fulfilled', 'Rejected']}
              values={[
                materialRequests.filter((r) => r.status === 'Pending').length,
                materialRequests.filter((r) => r.status === 'Approved').length,
                materialRequests.filter((r) => r.status === 'Issued').length,
                materialRequests.filter((r) => r.status === 'Fulfilled').length,
                materialRequests.filter((r) => r.status === 'Rejected').length,
              ]}
              colors={[
                chartColors.amber,
                chartColors.green,
                chartColors.blue,
                chartColors.accent,
                chartColors.red,
              ]}
              centerValue={String(materialRequests.length)}
              centerCaption="Requests"
              showLegend
              height={280}
              ariaLabel="Material requests by status"
            />
          </ChartCard>
        </div>
      </div>

      <SectionCard
        title={tab}
        subtitle={`${activeControls.total} record${activeControls.total === 1 ? '' : 's'} in the current view`}
        flush
        actions={
          <>
            <div className="d-flex gap-2">
              {TABS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`bt-pill-tab ${tab === option ? 'active' : ''}`.trim()}
                  style={{ padding: '0.35rem 0.85rem' }}
                  onClick={() => setTab(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <SearchBar
              value={activeControls.search}
              onChange={activeControls.setSearch}
              placeholder="Search inventory"
              label="Search inventory"
              size="sm"
            />

            <FilterPanel
              filters={tab === 'Stock register' ? MATERIAL_FILTERS : REQUEST_FILTERS}
              values={activeControls.filters}
              onChange={activeControls.setFilter}
              onClear={activeControls.clearFilters}
              activeCount={activeControls.activeFilterCount}
            />
          </>
        }
      >
        {tab === 'Stock register' && loading ? (
          <LoadingState label="Loading inventory…" />
        ) : tab === 'Stock register' && error ? (
          <StateMessage
            icon="bi-exclamation-triangle"
            title="Couldn't load inventory"
            message={error}
          />
        ) : tab === 'Stock register' ? (
          <DataTable
            columns={materialColumns}
            rows={materialControls.pageRows}
            rowKey={(row) => row.id}
            sortKey={materialControls.sortKey}
            sortDirection={materialControls.sortDirection}
            onSort={materialControls.toggleSort}
            caption="Material stock register"
          />
        ) : (
          <DataTable
            columns={requestColumns}
            rows={requestControls.pageRows}
            rowKey={(row) => row.id}
            sortKey={requestControls.sortKey}
            sortDirection={requestControls.sortDirection}
            onSort={requestControls.toggleSort}
            caption="Material requests"
          />
        )}

        <hr className="bt-divider m-0" />

        <Pagination
          page={activeControls.page}
          pageCount={activeControls.pageCount}
          rangeStart={activeControls.rangeStart}
          rangeEnd={activeControls.rangeEnd}
          total={activeControls.total}
          itemLabel={tab === 'Stock register' ? 'Materials' : 'Requests'}
          onPageChange={activeControls.setPage}
        />
      </SectionCard>

      <Modal
        open={modalOpen}
        title="Raise material request"
        description="Request materials to be issued from store or procured for a project."
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-bt"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="material-request-form" className="btn btn-accent">
              Submit request
            </button>
          </>
        }
      >
        <form id="material-request-form" onSubmit={handleRequest} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <FormField
                label="Material"
                value={values.materialName}
                onChange={(value) => setField('materialName', value)}
                error={errors.materialName}
                placeholder="e.g. OPC 53 Grade Cement"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                as="select"
                label="Material category"
                value={values.category}
                onChange={(value) => setField('category', value)}
                options={MATERIAL_CATEGORIES}
                error={errors.category}
                required
              />
            </div>

            <div className="col-12 col-md-3">
              <FormField
                type="number"
                label="Quantity"
                value={values.quantity}
                onChange={(value) => setField('quantity', value)}
                error={errors.quantity}
                placeholder="0"
                min={0}
                required
              />
            </div>

            <div className="col-12 col-md-3">
              <FormField
                as="select"
                label="Unit"
                value={values.unit}
                onChange={(value) => setField('unit', value)}
                options={['bags', 'tonnes', 'nos', 'm³', 'metres']}
                error={errors.unit}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                as="select"
                label="Project"
                value={values.projectName}
                onChange={(value) => setField('projectName', value)}
                options={projects.map((project) => project.name)}
                error={errors.projectName}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                type="date"
                label="Required by"
                value={values.requiredBy}
                onChange={(value) => setField('requiredBy', value)}
                error={errors.requiredBy}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}
