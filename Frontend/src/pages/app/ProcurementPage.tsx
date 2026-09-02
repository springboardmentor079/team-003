import { useState } from 'react';

import { BarChart } from '../../components/charts/BarChart';
import { DoughnutChart } from '../../components/charts/DoughnutChart';
import { categoricalPalette, chartColors } from '../../components/charts/chartTheme';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Modal } from '../../components/common/Modal';
import { PageHeader, SectionCard } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast } from '../../components/common/Toast';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { StatCard } from '../../components/dashboard/StatCard';
import { FormField } from '../../components/forms/FormField';
import { DataTable } from '../../components/tables/DataTable';
import { useTableControls } from '../../hooks/useTableControls';
import { projects } from '../../data/projects';
import {
  invoices,
  procurementByCategory,
  purchaseOrders,
  vendors,
} from '../../data/procurement';
import {
  PROCUREMENT_CATEGORIES,
  type DataTableColumn,
  type FilterDefinition,
  type Invoice,
  type KpiMetric,
  type PurchaseOrder,
  type Vendor,
} from '../../types';
import { formatCurrency, formatCurrencyCompact, formatDate } from '../../utils/format';
import {
  isValid,
  requiredField,
  validatePositiveNumber,
  type FieldErrors,
} from '../../utils/validation';

const TABS = ['Purchase orders', 'Vendors', 'Invoices'] as const;
type Tab = (typeof TABS)[number];

const totalOrderValue = purchaseOrders.reduce(
  (sum, order) => sum + (order.status === 'Cancelled' ? 0 : order.totalAmount),
  0,
);

const KPIS: KpiMetric[] = [
  {
    id: 'pr-orders',
    label: 'Purchase Orders',
    value: String(purchaseOrders.length),
    unit: 'orders',
    caption: 'Raised in the current period',
    delta: `${purchaseOrders.filter((o) => o.status === 'Pending Approval').length} pending approval`,
    trend: 'flat',
    progress: 68,
    accent: 'accent',
    icon: 'bi-cart3',
  },
  {
    id: 'pr-value',
    label: 'Order Value',
    value: formatCurrencyCompact(totalOrderValue),
    caption: 'Committed procurement spend',
    delta: 'Excludes cancelled orders',
    trend: 'up',
    progress: 74,
    accent: 'green',
    icon: 'bi-receipt',
  },
  {
    id: 'pr-vendors',
    label: 'Active Vendors',
    value: String(vendors.filter((v) => v.status === 'Active').length),
    unit: `of ${vendors.length}`,
    caption: 'Approved suppliers across five categories',
    delta: '1 blacklisted',
    trend: 'flat',
    progress: 71,
    accent: 'blue',
    icon: 'bi-shop',
  },
  {
    id: 'pr-invoices',
    label: 'Overdue Invoices',
    value: String(invoices.filter((i) => i.status === 'Overdue').length),
    unit: 'invoice',
    caption: `${formatCurrencyCompact(invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0))} outstanding`,
    delta: 'Action required',
    trend: 'down',
    progress: 20,
    accent: 'red',
    icon: 'bi-exclamation-circle',
  },
];

const ORDER_FILTERS: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Procurement category',
    options: PROCUREMENT_CATEGORIES.map((value) => ({ label: value, value })),
  },
  {
    id: 'status',
    label: 'Order status',
    options: ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Delivered', 'Cancelled'].map(
      (value) => ({ label: value, value }),
    ),
  },
];

const VENDOR_FILTERS: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Procurement category',
    options: PROCUREMENT_CATEGORIES.map((value) => ({ label: value, value })),
  },
  {
    id: 'status',
    label: 'Vendor status',
    options: ['Active', 'Inactive', 'Blacklisted'].map((value) => ({ label: value, value })),
  },
];

const INVOICE_FILTERS: FilterDefinition[] = [
  {
    id: 'status',
    label: 'Invoice status',
    options: ['Pending', 'Approved', 'Paid', 'Overdue'].map((value) => ({
      label: value,
      value,
    })),
  },
];

interface OrderFormValues {
  vendorName: string;
  category: string;
  projectName: string;
  itemSummary: string;
  quantity: string;
  totalAmount: string;
  expectedDelivery: string;
}

const EMPTY_ORDER: OrderFormValues = {
  vendorName: '',
  category: '',
  projectName: '',
  itemSummary: '',
  quantity: '',
  totalAmount: '',
  expectedDelivery: '',
};

/**
 * Procurement Management — document module 7: vendor and supplier
 * management, purchase orders, procurement requests and invoice tracking
 * across the document's five procurement categories.
 */
export function ProcurementPage() {
  const [tab, setTab] = useState<Tab>('Purchase orders');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [values, setValues] = useState<OrderFormValues>(EMPTY_ORDER);
  const [errors, setErrors] = useState<FieldErrors<OrderFormValues>>({});

  const orderControls = useTableControls<PurchaseOrder>({
    rows: purchaseOrders,
    searchKeys: ['orderCode', 'vendorName', 'projectName', 'itemSummary'],
    filterKeys: { category: 'category', status: 'status' },
    initialSortKey: 'raisedOn',
    initialSortDirection: 'desc',
    pageSize: 8,
  });

  const vendorControls = useTableControls<Vendor>({
    rows: vendors,
    searchKeys: ['name', 'vendorCode', 'contactPerson', 'email'],
    filterKeys: { category: 'category', status: 'status' },
    initialSortKey: 'name',
    pageSize: 8,
  });

  const invoiceControls = useTableControls<Invoice>({
    rows: invoices,
    searchKeys: ['invoiceCode', 'orderCode', 'vendorName'],
    filterKeys: { status: 'status' },
    initialSortKey: 'issuedOn',
    initialSortDirection: 'desc',
    pageSize: 8,
  });

  function setField(field: keyof OrderFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleCreateOrder(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors<OrderFormValues> = {
      vendorName: requiredField(values.vendorName, 'Vendor'),
      category: requiredField(values.category, 'Procurement category'),
      projectName: requiredField(values.projectName, 'Project'),
      itemSummary: requiredField(values.itemSummary, 'Item summary'),
      quantity: validatePositiveNumber(values.quantity, 'Quantity'),
      totalAmount: validatePositiveNumber(values.totalAmount, 'Order value'),
      expectedDelivery: requiredField(values.expectedDelivery, 'Expected delivery'),
    };

    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setToast(`Purchase order raised with ${values.vendorName}.`);
    setValues(EMPTY_ORDER);
    setModalOpen(false);
  }

  const orderColumns: DataTableColumn<PurchaseOrder>[] = [
    {
      key: 'orderCode',
      header: 'PO number',
      sortable: true,
      width: '110px',
      render: (row) => <span className="bt-mono small bt-text-dim">{row.orderCode}</span>,
    },
    {
      key: 'vendorName',
      header: 'Vendor',
      sortable: true,
      render: (row) => (
        <div>
          <p className="mb-1 fw-semibold">{row.vendorName}</p>
          <p className="bt-label mb-0">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'itemSummary',
      header: 'Items',
      render: (row) => (
        <div>
          <p className="mb-1 small">{row.itemSummary}</p>
          <p className="bt-label mb-0">{row.projectName}</p>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Value',
      sortable: true,
      align: 'end',
      render: (row) => <span className="bt-mono small">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'raisedBy', header: 'Raised by', sortable: true },
    {
      key: 'expectedDelivery',
      header: 'Expected',
      sortable: true,
      render: (row) => <span className="bt-mono small">{formatDate(row.expectedDelivery)}</span>,
    },
  ];

  const vendorColumns: DataTableColumn<Vendor>[] = [
    {
      key: 'vendorCode',
      header: 'Code',
      sortable: true,
      width: '90px',
      render: (row) => <span className="bt-mono small bt-text-dim">{row.vendorCode}</span>,
    },
    {
      key: 'name',
      header: 'Vendor',
      sortable: true,
      render: (row) => (
        <div>
          <p className="mb-1 fw-semibold">{row.name}</p>
          <p className="bt-label mb-0">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Contact',
      render: (row) => (
        <div>
          <p className="mb-1 small">{row.contactPerson}</p>
          <p className="bt-label mb-0">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      render: (row) => (
        <span className="d-inline-flex align-items-center gap-1 bt-mono small">
          <i className="bi bi-star-fill bt-accent" aria-hidden="true" />
          {row.rating.toFixed(1)}
        </span>
      ),
    },
    { key: 'activeOrders', header: 'Open orders', sortable: true, align: 'end' },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'onboardedOn',
      header: 'Onboarded',
      sortable: true,
      render: (row) => <span className="bt-mono small">{formatDate(row.onboardedOn)}</span>,
    },
  ];

  const invoiceColumns: DataTableColumn<Invoice>[] = [
    {
      key: 'invoiceCode',
      header: 'Invoice',
      sortable: true,
      render: (row) => <span className="bt-mono small bt-text-dim">{row.invoiceCode}</span>,
    },
    {
      key: 'orderCode',
      header: 'Against PO',
      sortable: true,
      render: (row) => <span className="bt-mono small">{row.orderCode}</span>,
    },
    { key: 'vendorName', header: 'Vendor', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'end',
      render: (row) => <span className="bt-mono small">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'issuedOn',
      header: 'Issued',
      sortable: true,
      render: (row) => <span className="bt-mono small">{formatDate(row.issuedOn)}</span>,
    },
    {
      key: 'dueOn',
      header: 'Due',
      sortable: true,
      render: (row) => <span className="bt-mono small">{formatDate(row.dueOn)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const activeControls =
    tab === 'Purchase orders'
      ? orderControls
      : tab === 'Vendors'
        ? vendorControls
        : invoiceControls;

  const activeFilters =
    tab === 'Purchase orders'
      ? ORDER_FILTERS
      : tab === 'Vendors'
        ? VENDOR_FILTERS
        : INVOICE_FILTERS;

  return (
    <>
      <PageHeader
        title="Procurement"
        subtitle="Vendor management, purchase orders, procurement requests and invoice tracking."
        actions={
          <button type="button" className="btn btn-accent" onClick={() => setModalOpen(true)}>
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Raise purchase order
          </button>
        }
      />

      <div className="row g-3 g-lg-4 mb-4">
        {KPIS.map((metric) => (
          <div className="col-12 col-sm-6 col-xl-3" key={metric.id}>
            <StatCard metric={metric} />
          </div>
        ))}
      </div>

      <div className="row g-3 g-lg-4 mb-4">
        <div className="col-12 col-xl-7">
          <ChartCard
            title="Procurement Spend"
            subtitle="Order value by procurement category"
          >
            <BarChart
              labels={procurementByCategory.map((entry) => entry.label)}
              series={[
                {
                  label: 'Order value',
                  values: procurementByCategory.map((entry) => entry.value),
                  color: chartColors.accent,
                },
              ]}
              height={280}
              valueFormatter={formatCurrencyCompact}
              ariaLabel="Procurement spend by category"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-5">
          <ChartCard title="Order Pipeline" subtitle="Purchase orders by status">
            <DoughnutChart
              labels={['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Delivered', 'Cancelled']}
              values={[
                purchaseOrders.filter((o) => o.status === 'Draft').length,
                purchaseOrders.filter((o) => o.status === 'Pending Approval').length,
                purchaseOrders.filter((o) => o.status === 'Approved').length,
                purchaseOrders.filter((o) => o.status === 'Ordered').length,
                purchaseOrders.filter((o) => o.status === 'Delivered').length,
                purchaseOrders.filter((o) => o.status === 'Cancelled').length,
              ]}
              colors={categoricalPalette}
              centerValue={String(purchaseOrders.length)}
              centerCaption="Orders"
              showLegend
              height={280}
              ariaLabel="Purchase orders by status"
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
            <div className="d-flex flex-wrap gap-2">
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
              placeholder="Search procurement"
              label="Search procurement records"
              size="sm"
            />

            <FilterPanel
              filters={activeFilters}
              values={activeControls.filters}
              onChange={activeControls.setFilter}
              onClear={activeControls.clearFilters}
              activeCount={activeControls.activeFilterCount}
            />
          </>
        }
      >
        {tab === 'Purchase orders' && (
          <DataTable
            columns={orderColumns}
            rows={orderControls.pageRows}
            rowKey={(row) => row.id}
            sortKey={orderControls.sortKey}
            sortDirection={orderControls.sortDirection}
            onSort={orderControls.toggleSort}
            caption="Purchase orders"
          />
        )}

        {tab === 'Vendors' && (
          <DataTable
            columns={vendorColumns}
            rows={vendorControls.pageRows}
            rowKey={(row) => row.id}
            sortKey={vendorControls.sortKey}
            sortDirection={vendorControls.sortDirection}
            onSort={vendorControls.toggleSort}
            caption="Registered vendors and suppliers"
          />
        )}

        {tab === 'Invoices' && (
          <DataTable
            columns={invoiceColumns}
            rows={invoiceControls.pageRows}
            rowKey={(row) => row.id}
            sortKey={invoiceControls.sortKey}
            sortDirection={invoiceControls.sortDirection}
            onSort={invoiceControls.toggleSort}
            caption="Vendor invoices"
          />
        )}

        <hr className="bt-divider m-0" />

        <Pagination
          page={activeControls.page}
          pageCount={activeControls.pageCount}
          rangeStart={activeControls.rangeStart}
          rangeEnd={activeControls.rangeEnd}
          total={activeControls.total}
          itemLabel={tab}
          onPageChange={activeControls.setPage}
        />
      </SectionCard>

      <Modal
        open={modalOpen}
        title="Raise purchase order"
        description="Create a purchase order against an approved vendor."
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
            <button type="submit" form="purchase-order-form" className="btn btn-accent">
              Raise order
            </button>
          </>
        }
      >
        <form id="purchase-order-form" onSubmit={handleCreateOrder} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <FormField
                as="select"
                label="Vendor"
                value={values.vendorName}
                onChange={(value) => setField('vendorName', value)}
                options={vendors
                  .filter((vendor) => vendor.status === 'Active')
                  .map((vendor) => vendor.name)}
                error={errors.vendorName}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                as="select"
                label="Procurement category"
                value={values.category}
                onChange={(value) => setField('category', value)}
                options={PROCUREMENT_CATEGORIES}
                error={errors.category}
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
                label="Expected delivery"
                value={values.expectedDelivery}
                onChange={(value) => setField('expectedDelivery', value)}
                error={errors.expectedDelivery}
                required
              />
            </div>

            <div className="col-12">
              <FormField
                label="Item summary"
                value={values.itemSummary}
                onChange={(value) => setField('itemSummary', value)}
                error={errors.itemSummary}
                placeholder="e.g. TMT Reinforcement Bars Fe500D"
                required
              />
            </div>

            <div className="col-12 col-md-6">
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

            <div className="col-12 col-md-6">
              <FormField
                type="number"
                label="Order value (₹)"
                value={values.totalAmount}
                onChange={(value) => setField('totalAmount', value)}
                error={errors.totalAmount}
                placeholder="0"
                min={0}
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
