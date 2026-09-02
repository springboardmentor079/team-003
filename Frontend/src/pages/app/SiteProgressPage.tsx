import { useMemo, useState } from 'react';

import { BarChart } from '../../components/charts/BarChart';
import { LineChart } from '../../components/charts/LineChart';
import { chartColors } from '../../components/charts/chartTheme';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Modal } from '../../components/common/Modal';
import { PageHeader, SectionCard } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { ProgressBar } from '../../components/common/ProgressBar';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast } from '../../components/common/Toast';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { ChartCard, LegendChip } from '../../components/dashboard/ChartCard';
import { FormField } from '../../components/forms/FormField';
import { DataTable } from '../../components/tables/DataTable';
import { useTableControls } from '../../hooks/useTableControls';
import { projects } from '../../data/projects';
import {
  activityLog,
  delayByProject,
  progressReports,
  weeklyProgressTrend,
  workCategoryProgress,
} from '../../data/siteProgress';
import {
  WORK_CATEGORIES,
  type DataTableColumn,
  type FilterDefinition,
  type ProgressReport,
} from '../../types';
import { formatDate } from '../../utils/format';
import { isValid, requiredField, type FieldErrors } from '../../utils/validation';

const FREQUENCY_TABS = ['All reports', 'Daily', 'Weekly'] as const;
type FrequencyTab = (typeof FREQUENCY_TABS)[number];

const FILTERS: FilterDefinition[] = [
  {
    id: 'workCategory',
    label: 'Work category',
    options: WORK_CATEGORIES.map((value) => ({ label: value, value })),
  },
  {
    id: 'status',
    label: 'Review status',
    options: ['Submitted', 'Under Review', 'Approved'].map((value) => ({
      label: value,
      value,
    })),
  },
];

const FILTER_KEYS: Partial<Record<string, keyof ProgressReport>> = {
  workCategory: 'workCategory',
  status: 'status',
};

interface ReportFormValues {
  projectName: string;
  frequency: string;
  workCategory: string;
  reportDate: string;
  completionPercent: string;
  workCompleted: string;
  delayReason: string;
}

const EMPTY_REPORT: ReportFormValues = {
  projectName: '',
  frequency: 'Daily',
  workCategory: '',
  reportDate: '',
  completionPercent: '',
  workCompleted: '',
  delayReason: '',
};

/**
 * Site Progress Monitoring — document module 3.
 *
 * Covers all six listed features: daily reports, weekly reports, milestone
 * tracking (via completion percentages by work category), work completion
 * status, delay tracking and site activity logs. The Figma had no screen for
 * this module beyond the "Site Telemetry" video card on the Overview.
 */
export function SiteProgressPage() {
  const [tab, setTab] = useState<FrequencyTab>('All reports');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [values, setValues] = useState<ReportFormValues>(EMPTY_REPORT);
  const [errors, setErrors] = useState<FieldErrors<ReportFormValues>>({});

  const scopedReports = useMemo(
    () =>
      tab === 'All reports'
        ? progressReports
        : progressReports.filter((report) => report.frequency === tab),
    [tab],
  );

  const controls = useTableControls<ProgressReport>({
    rows: scopedReports,
    searchKeys: ['projectName', 'workCategory', 'submittedBy', 'workCompleted'],
    filterKeys: FILTER_KEYS,
    initialSortKey: 'reportDate',
    initialSortDirection: 'desc',
    pageSize: 6,
  });

  const totalDelayDays = progressReports.reduce(
    (sum, report) => sum + report.delayDays,
    0,
  );

  function setField(field: keyof ReportFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmitReport(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors<ReportFormValues> = {
      projectName: requiredField(values.projectName, 'Project'),
      workCategory: requiredField(values.workCategory, 'Work category'),
      reportDate: requiredField(values.reportDate, 'Report date'),
      completionPercent: requiredField(values.completionPercent, 'Completion percentage'),
      workCompleted: requiredField(values.workCompleted, 'Work completed'),
    };

    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setToast(`${values.frequency} progress report submitted for ${values.projectName}.`);
    setValues(EMPTY_REPORT);
    setModalOpen(false);
  }

  const columns: DataTableColumn<ProgressReport>[] = [
    {
      key: 'reportDate',
      header: 'Date',
      sortable: true,
      width: '120px',
      render: (row) => <span className="bt-mono small">{formatDate(row.reportDate)}</span>,
    },
    {
      key: 'projectName',
      header: 'Project',
      sortable: true,
      render: (row) => (
        <div>
          <p className="mb-1 fw-semibold">{row.projectName}</p>
          <p className="bt-label mb-0">{row.frequency} report</p>
        </div>
      ),
    },
    { key: 'workCategory', header: 'Work category', sortable: true },
    {
      key: 'completionPercent',
      header: 'Completion',
      sortable: true,
      width: '160px',
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          <ProgressBar
            value={row.completionPercent}
            tone="accent"
            className="flex-grow-1"
            label={`${row.workCategory} completion`}
          />
          <span className="bt-mono small bt-text-dim">{row.completionPercent}%</span>
        </div>
      ),
    },
    {
      key: 'delayDays',
      header: 'Delay',
      sortable: true,
      render: (row) =>
        row.delayDays > 0 ? (
          <span className="bt-badge bt-badge-danger">
            <span className="bt-dot" aria-hidden="true" />
            {row.delayDays} day{row.delayDays === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="bt-badge bt-badge-success">
            <span className="bt-dot" aria-hidden="true" />
            On schedule
          </span>
        ),
    },
    { key: 'submittedBy', header: 'Submitted by', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Site Progress"
        subtitle="Daily and weekly progress reporting, work completion status, delay tracking and site activity logs."
        actions={
          <button type="button" className="btn btn-accent" onClick={() => setModalOpen(true)}>
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Submit report
          </button>
        }
      />

      <div className="row g-3 g-lg-4 mb-4">
        <div className="col-12 col-xl-8">
          <ChartCard
            title="Work Completion Status"
            subtitle="Planned vs actual by work category"
            actions={
              <>
                <LegendChip label="Planned" color={chartColors.green} />
                <LegendChip label="Actual" color={chartColors.accent} />
              </>
            }
          >
            <BarChart
              labels={workCategoryProgress.map((entry) => entry.category)}
              series={[
                {
                  label: 'Planned',
                  values: workCategoryProgress.map((entry) => entry.planned),
                  color: chartColors.green,
                },
                {
                  label: 'Actual',
                  values: workCategoryProgress.map((entry) => entry.actual),
                  color: chartColors.accent,
                },
              ]}
              valueSuffix="%"
              yMax={100}
              height={290}
              ariaLabel="Planned versus actual completion by work category"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-4">
          <ChartCard
            title="Delay Tracking"
            subtitle={`${totalDelayDays} delay days logged across the portfolio`}
          >
            <BarChart
              labels={delayByProject.map((entry) => entry.label)}
              series={[
                { label: 'Delay days', values: delayByProject.map((entry) => entry.value) },
              ]}
              pointColors={delayByProject.map((entry) =>
                entry.value === 0
                  ? chartColors.green
                  : entry.value <= 5
                    ? chartColors.amber
                    : chartColors.red,
              )}
              horizontal
              height={290}
              valueFormatter={(value) => `${value} day${value === 1 ? '' : 's'}`}
              ariaLabel="Delay days by project"
            />
          </ChartCard>
        </div>
      </div>

      <div className="row g-3 g-lg-4 mb-4">
        <div className="col-12 col-xl-8">
          <ChartCard
            title="Weekly Progress Trend"
            subtitle="Cumulative completion — Green Valley Residency"
          >
            <LineChart
              labels={weeklyProgressTrend.map((point) => point.label)}
              series={[
                {
                  label: 'Completion',
                  values: weeklyProgressTrend.map((point) => point.value),
                  color: chartColors.accent,
                  filled: true,
                },
              ]}
              valueSuffix="%"
              yMax={100}
              showLegend={false}
              height={250}
              ariaLabel="Weekly cumulative completion trend"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-4">
          <ChartCard title="Site Activity Log" subtitle="Latest logged site events">
            <ActivityFeed entries={activityLog} limit={4} />
          </ChartCard>
        </div>
      </div>

      <SectionCard
        title="Progress Reports"
        subtitle={`${controls.total} report${controls.total === 1 ? '' : 's'} in the current view`}
        flush
        actions={
          <>
            <div className="d-flex gap-2">
              {FREQUENCY_TABS.map((option) => (
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
              value={controls.search}
              onChange={controls.setSearch}
              placeholder="Search reports"
              label="Search progress reports"
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
        <DataTable
          columns={columns}
          rows={controls.pageRows}
          rowKey={(row) => row.id}
          sortKey={controls.sortKey}
          sortDirection={controls.sortDirection}
          onSort={controls.toggleSort}
          caption="Daily and weekly site progress reports"
        />

        <hr className="bt-divider m-0" />

        <Pagination
          page={controls.page}
          pageCount={controls.pageCount}
          rangeStart={controls.rangeStart}
          rangeEnd={controls.rangeEnd}
          total={controls.total}
          itemLabel="Reports"
          onPageChange={controls.setPage}
        />
      </SectionCard>

      <Modal
        open={modalOpen}
        title="Submit progress report"
        description="Record daily or weekly site progress against a work category."
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
            <button type="submit" form="progress-report-form" className="btn btn-accent">
              Submit report
            </button>
          </>
        }
      >
        <form id="progress-report-form" onSubmit={handleSubmitReport} noValidate>
          <div className="row g-3">
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
                as="select"
                label="Report frequency"
                value={values.frequency}
                onChange={(value) => setField('frequency', value)}
                options={['Daily', 'Weekly']}
                placeholderOption="Select frequency"
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                as="select"
                label="Work category"
                value={values.workCategory}
                onChange={(value) => setField('workCategory', value)}
                options={WORK_CATEGORIES}
                error={errors.workCategory}
                required
              />
            </div>

            <div className="col-12 col-md-3">
              <FormField
                type="date"
                label="Report date"
                value={values.reportDate}
                onChange={(value) => setField('reportDate', value)}
                error={errors.reportDate}
                required
              />
            </div>

            <div className="col-12 col-md-3">
              <FormField
                type="number"
                label="Completion %"
                value={values.completionPercent}
                onChange={(value) => setField('completionPercent', value)}
                error={errors.completionPercent}
                placeholder="0–100"
                min={0}
                required
              />
            </div>

            <div className="col-12">
              <FormField
                as="textarea"
                label="Work completed"
                value={values.workCompleted}
                onChange={(value) => setField('workCompleted', value)}
                error={errors.workCompleted}
                placeholder="Describe the work completed during this period."
                rows={3}
                required
              />
            </div>

            <div className="col-12">
              <FormField
                as="textarea"
                label="Delay reason (if any)"
                value={values.delayReason}
                onChange={(value) => setField('delayReason', value)}
                placeholder="Leave blank if the work is on schedule."
                rows={2}
              />
            </div>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}
