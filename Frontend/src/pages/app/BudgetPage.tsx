import { useState } from 'react';

import { DoughnutChart } from '../../components/charts/DoughnutChart';
import { LineChart } from '../../components/charts/LineChart';
import { categoricalPalette, chartColors } from '../../components/charts/chartTheme';
import { FilterPanel } from '../../components/common/FilterPanel';
import { PageHeader, SectionCard } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { ProgressBar } from '../../components/common/ProgressBar';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ChartCard, LegendChip } from '../../components/dashboard/ChartCard';
import { StatCard } from '../../components/dashboard/StatCard';
import { DataTable } from '../../components/tables/DataTable';
import { useTableControls } from '../../hooks/useTableControls';
import {
  budgetLines,
  costByCategory,
  expenses,
  monthlySpend,
  totalBudgetAllocated,
  totalBudgetRemaining,
  totalBudgetSpent,
} from '../../data/budget';
import {
  COST_CATEGORIES,
  type BudgetLine,
  type DataTableColumn,
  type Expense,
  type FilterDefinition,
  type KpiMetric,
} from '../../types';
import { formatCurrency, formatCurrencyCompact, formatDate } from '../../utils/format';

const TABS = ['Budget lines', 'Expenses'] as const;
type Tab = (typeof TABS)[number];

const utilisation = Math.round((totalBudgetSpent / totalBudgetAllocated) * 100);
const overBudgetCount = budgetLines.filter((line) => line.status === 'Over Budget').length;

const KPIS: KpiMetric[] = [
  {
    id: 'bg-allocated',
    label: 'Budget Allocated',
    value: formatCurrencyCompact(totalBudgetAllocated),
    caption: 'Total approved budget across the portfolio',
    delta: 'Planned',
    trend: 'flat',
    progress: 100,
    accent: 'blue',
    icon: 'bi-wallet2',
  },
  {
    id: 'bg-spent',
    label: 'Budget Spent',
    value: formatCurrencyCompact(totalBudgetSpent),
    caption: `${utilisation}% of allocated budget consumed`,
    delta: 'To date',
    trend: 'up',
    progress: utilisation,
    accent: 'accent',
    icon: 'bi-cash-coin',
  },
  {
    id: 'bg-remaining',
    label: 'Budget Remaining',
    value: formatCurrencyCompact(totalBudgetRemaining),
    caption: 'Available for the remainder of delivery',
    delta: `${100 - utilisation}% left`,
    trend: 'flat',
    progress: 100 - utilisation,
    accent: 'green',
    icon: 'bi-piggy-bank',
  },
  {
    id: 'bg-variance',
    label: 'Over Budget Lines',
    value: String(overBudgetCount),
    unit: 'lines',
    caption: 'Cost categories exceeding their estimate',
    delta: 'Review required',
    trend: 'down',
    progress: 25,
    accent: 'red',
    icon: 'bi-graph-down-arrow',
  },
];

const BUDGET_FILTERS: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Cost category',
    options: COST_CATEGORIES.map((value) => ({ label: value, value })),
  },
  {
    id: 'status',
    label: 'Budget status',
    options: ['Within Budget', 'Near Limit', 'Over Budget'].map((value) => ({
      label: value,
      value,
    })),
  },
];

const EXPENSE_FILTERS: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Cost category',
    options: COST_CATEGORIES.map((value) => ({ label: value, value })),
  },
  {
    id: 'status',
    label: 'Approval status',
    options: ['Pending', 'Approved', 'Rejected'].map((value) => ({ label: value, value })),
  },
];

/**
 * Budget & Cost Management — document module 11.
 *
 * This module appears in the document's module list and in the Project
 * Manager dashboard requirements, but has no Figma screen at all and was
 * omitted from every Figma sidebar. Built here in the established visual
 * language across the document's six cost categories.
 */
export function BudgetPage() {
  const [tab, setTab] = useState<Tab>('Budget lines');

  const budgetControls = useTableControls<BudgetLine>({
    rows: budgetLines,
    searchKeys: ['projectName', 'category'],
    filterKeys: { category: 'category', status: 'status' },
    initialSortKey: 'projectName',
    pageSize: 8,
  });

  const expenseControls = useTableControls<Expense>({
    rows: expenses,
    searchKeys: ['expenseCode', 'projectName', 'description', 'approvedBy'],
    filterKeys: { category: 'category', status: 'status' },
    initialSortKey: 'incurredOn',
    initialSortDirection: 'desc',
    pageSize: 8,
  });

  const budgetColumns: DataTableColumn<BudgetLine>[] = [
    { key: 'projectName', header: 'Project', sortable: true },
    { key: 'category', header: 'Cost category', sortable: true },
    {
      key: 'estimated',
      header: 'Estimated',
      sortable: true,
      align: 'end',
      render: (row) => <span className="bt-mono small">{formatCurrency(row.estimated)}</span>,
    },
    {
      key: 'actual',
      header: 'Actual',
      sortable: true,
      align: 'end',
      render: (row) => <span className="bt-mono small">{formatCurrency(row.actual)}</span>,
    },
    {
      key: 'variance',
      header: 'Variance',
      sortable: true,
      align: 'end',
      render: (row) => (
        <span className={`bt-mono small ${row.variance < 0 ? 'bt-red' : 'bt-green'}`}>
          {row.variance < 0 ? '−' : '+'}
          {formatCurrency(Math.abs(row.variance))}
        </span>
      ),
    },
    {
      key: 'variancePercent',
      header: 'Utilisation',
      sortable: true,
      width: '160px',
      render: (row) => {
        const used = Math.min(100, Math.round((row.actual / row.estimated) * 100));
        return (
          <div className="d-flex align-items-center gap-2">
            <ProgressBar
              value={used}
              tone={
                row.status === 'Over Budget'
                  ? 'danger'
                  : row.status === 'Near Limit'
                    ? 'warning'
                    : 'success'
              }
              className="flex-grow-1"
              label={`${row.category} utilisation`}
            />
            <span className="bt-mono small bt-text-dim">{used}%</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const expenseColumns: DataTableColumn<Expense>[] = [
    {
      key: 'expenseCode',
      header: 'Expense',
      sortable: true,
      width: '110px',
      render: (row) => <span className="bt-mono small bt-text-dim">{row.expenseCode}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <div>
          <p className="mb-1 small">{row.description}</p>
          <p className="bt-label mb-0">{row.projectName}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Cost category', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'end',
      render: (row) => <span className="bt-mono small">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'incurredOn',
      header: 'Incurred',
      sortable: true,
      render: (row) => <span className="bt-mono small">{formatDate(row.incurredOn)}</span>,
    },
    { key: 'approvedBy', header: 'Approver', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const activeControls = tab === 'Budget lines' ? budgetControls : expenseControls;

  return (
    <>
      <PageHeader
        title="Budget & Cost"
        subtitle="Budget planning, cost estimation, expense tracking and financial reporting across all cost categories."
        actions={
          <button type="button" className="btn btn-outline-bt">
            <i className="bi bi-file-earmark-spreadsheet me-2" aria-hidden="true" />
            Export budget report
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
        <div className="col-12 col-xl-8">
          <ChartCard
            title="Planned vs Actual Spend"
            subtitle="Monthly portfolio expenditure"
            actions={
              <>
                <LegendChip label="Planned" color={chartColors.green} />
                <LegendChip label="Actual" color={chartColors.accent} />
              </>
            }
          >
            <LineChart
              labels={monthlySpend.labels}
              series={[
                {
                  label: 'Planned',
                  values: monthlySpend.planned,
                  color: chartColors.green,
                  dashed: true,
                },
                {
                  label: 'Actual',
                  values: monthlySpend.actual,
                  color: chartColors.accent,
                  filled: true,
                },
              ]}
              showLegend={false}
              height={300}
              valueFormatter={formatCurrencyCompact}
              ariaLabel="Monthly planned versus actual spend"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-4">
          <ChartCard
            title="Cost Distribution"
            subtitle="Spend by cost category"
          >
            <DoughnutChart
              labels={costByCategory.map((entry) => entry.label)}
              values={costByCategory.map((entry) => entry.value)}
              colors={categoricalPalette}
              centerValue={formatCurrencyCompact(totalBudgetSpent)}
              centerCaption="Total spend"
              showLegend
              height={300}
              valueFormatter={formatCurrencyCompact}
              ariaLabel="Portfolio spend by cost category"
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
              placeholder="Search budget records"
              label="Search budget records"
              size="sm"
            />

            <FilterPanel
              filters={tab === 'Budget lines' ? BUDGET_FILTERS : EXPENSE_FILTERS}
              values={activeControls.filters}
              onChange={activeControls.setFilter}
              onClear={activeControls.clearFilters}
              activeCount={activeControls.activeFilterCount}
            />
          </>
        }
      >
        {tab === 'Budget lines' ? (
          <DataTable
            columns={budgetColumns}
            rows={budgetControls.pageRows}
            rowKey={(row) => row.id}
            sortKey={budgetControls.sortKey}
            sortDirection={budgetControls.sortDirection}
            onSort={budgetControls.toggleSort}
            caption="Budget lines by project and cost category"
          />
        ) : (
          <DataTable
            columns={expenseColumns}
            rows={expenseControls.pageRows}
            rowKey={(row) => row.id}
            sortKey={expenseControls.sortKey}
            sortDirection={expenseControls.sortDirection}
            onSort={expenseControls.toggleSort}
            caption="Recorded project expenses"
          />
        )}

        <hr className="bt-divider m-0" />

        <Pagination
          page={activeControls.page}
          pageCount={activeControls.pageCount}
          rangeStart={activeControls.rangeStart}
          rangeEnd={activeControls.rangeEnd}
          total={activeControls.total}
          itemLabel={tab === 'Budget lines' ? 'Lines' : 'Expenses'}
          onPageChange={activeControls.setPage}
        />
      </SectionCard>
    </>
  );
}
