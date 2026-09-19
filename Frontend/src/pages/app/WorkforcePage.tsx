import { useState } from 'react';

import { BarChart } from '../../components/charts/BarChart';
import { DoughnutChart } from '../../components/charts/DoughnutChart';
import { LineChart } from '../../components/charts/LineChart';
import { categoricalPalette, chartColors } from '../../components/charts/chartTheme';
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
import { workforceService } from '../../services';
import { projects } from '../../data/projects';
import {
  attendanceTrend,
  shiftCoverage,
  totalWorkforce,
  workforceDistribution,
} from '../../data/workforce';
import {
  SHIFT_NAMES,
  WORKFORCE_CATEGORIES,
  type AttendanceRecord,
  type DataTableColumn,
  type FilterDefinition,
  type KpiMetric,
  type Worker,
} from '../../types';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import {
  isValid,
  requiredField,
  validatePhone,
  validatePositiveNumber,
  type FieldErrors,
} from '../../utils/validation';

const TABS = ['Worker register', 'Attendance'] as const;
type Tab = (typeof TABS)[number];

/** KPI cards computed from the live worker + attendance lists (module 6). */
function buildKpis(workers: Worker[], attendance: AttendanceRecord[]): KpiMetric[] {
  const present = attendance.filter((record) => record.status === 'Present').length;
  const attendancePct =
    attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;
  const wageBill = workers.reduce((sum, worker) => sum + worker.dailyWage, 0);

  return [
    {
      id: 'wf-total',
      label: 'Total Workforce',
      value: String(workers.length),
      unit: 'personnel',
      caption: 'Registered on the current roster',
      delta: 'Live',
      trend: 'up',
      progress: 88,
      accent: 'accent',
      icon: 'bi-people',
    },
    {
      id: 'wf-present',
      label: 'Present Today',
      value: String(present),
      unit: `of ${attendance.length}`,
      caption: 'Checked in across all shifts',
      delta: `${attendancePct}% attendance`,
      trend: 'flat',
      progress: attendancePct,
      accent: 'green',
      icon: 'bi-person-check',
    },
    {
      id: 'wf-shifts',
      label: 'Shift Coverage',
      value: '3',
      unit: 'shifts',
      caption: 'Morning, Afternoon and Night rosters active',
      delta: 'Fully covered',
      trend: 'flat',
      progress: 100,
      accent: 'blue',
      icon: 'bi-clock-history',
    },
    {
      id: 'wf-payroll',
      label: 'Daily Wage Bill',
      value: formatCurrency(wageBill),
      caption: 'Registered workers on the current roster',
      delta: 'Per working day',
      trend: 'flat',
      progress: 64,
      accent: 'amber',
      icon: 'bi-cash-coin',
    },
  ];
}

const WORKER_FILTERS: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Workforce category',
    options: WORKFORCE_CATEGORIES.map((value) => ({ label: value, value })),
  },
  {
    id: 'shift',
    label: 'Shift',
    options: SHIFT_NAMES.map((value) => ({ label: value, value })),
  },
  {
    id: 'attendanceToday',
    label: 'Attendance today',
    options: ['Present', 'Absent', 'On Leave', 'Half Day'].map((value) => ({
      label: value,
      value,
    })),
  },
];

const ATTENDANCE_FILTERS: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Workforce category',
    options: WORKFORCE_CATEGORIES.map((value) => ({ label: value, value })),
  },
  {
    id: 'shift',
    label: 'Shift',
    options: SHIFT_NAMES.map((value) => ({ label: value, value })),
  },
  {
    id: 'status',
    label: 'Status',
    options: ['Present', 'Absent', 'On Leave', 'Half Day'].map((value) => ({
      label: value,
      value,
    })),
  },
];

interface WorkerFormValues {
  fullName: string;
  category: string;
  trade: string;
  assignedProject: string;
  shift: string;
  contact: string;
  dailyWage: string;
}

const EMPTY_WORKER: WorkerFormValues = {
  fullName: '',
  category: '',
  trade: '',
  assignedProject: '',
  shift: 'Morning',
  contact: '',
  dailyWage: '',
};

/**
 * Workforce Management — document module 6: worker registration, attendance
 * tracking, workforce allocation, shift scheduling and payroll monitoring
 * across the document's six workforce categories.
 */
export function WorkforcePage() {
  const [tab, setTab] = useState<Tab>('Worker register');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [values, setValues] = useState<WorkerFormValues>(EMPTY_WORKER);
  const [errors, setErrors] = useState<FieldErrors<WorkerFormValues>>({});

  const workersQuery = useAsyncData(() => workforceService.workers(), []);
  const attendanceQuery = useAsyncData(() => workforceService.attendance(), []);
  const workers = workersQuery.data ?? [];
  const attendance = attendanceQuery.data ?? [];
  const kpis = buildKpis(workers, attendance);

  const workerControls = useTableControls<Worker>({
    rows: workers,
    searchKeys: ['fullName', 'workerCode', 'trade', 'assignedProject'],
    filterKeys: {
      category: 'category',
      shift: 'shift',
      attendanceToday: 'attendanceToday',
    },
    initialSortKey: 'fullName',
    pageSize: 8,
  });

  const attendanceControls = useTableControls<AttendanceRecord>({
    rows: attendance,
    searchKeys: ['workerName', 'workerCode', 'project'],
    filterKeys: { category: 'category', shift: 'shift', status: 'status' },
    initialSortKey: 'workerName',
    pageSize: 8,
  });

  const activeLoading =
    tab === 'Worker register' ? workersQuery.loading : attendanceQuery.loading;
  const activeError =
    tab === 'Worker register' ? workersQuery.error : attendanceQuery.error;

  function setField(field: keyof WorkerFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleRegister(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors<WorkerFormValues> = {
      fullName: requiredField(values.fullName, 'Full name'),
      category: requiredField(values.category, 'Workforce category'),
      trade: requiredField(values.trade, 'Trade'),
      assignedProject: requiredField(values.assignedProject, 'Assigned project'),
      contact: validatePhone(values.contact),
      dailyWage: validatePositiveNumber(values.dailyWage, 'Daily wage'),
    };

    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setToast(`${values.fullName} registered to the ${values.shift} shift.`);
    setValues(EMPTY_WORKER);
    setModalOpen(false);
  }

  const workerColumns: DataTableColumn<Worker>[] = [
    {
      key: 'workerCode',
      header: 'Worker ID',
      sortable: true,
      width: '110px',
      render: (row) => <span className="bt-mono small bt-text-dim">{row.workerCode}</span>,
    },
    {
      key: 'fullName',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div className="d-flex align-items-center gap-3">
          <span className="bt-avatar" style={{ width: 34, height: 34, fontSize: '0.7rem' }}>
            {row.fullName
              .split(' ')
              .slice(0, 2)
              .map((part) => part[0])
              .join('')}
          </span>
          <div className="min-w-0">
            <p className="mb-1 fw-semibold">{row.fullName}</p>
            <p className="bt-label mb-0">{row.trade}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'assignedProject', header: 'Project', sortable: true },
    { key: 'shift', header: 'Shift', sortable: true },
    {
      key: 'attendanceToday',
      header: 'Today',
      sortable: true,
      render: (row) => <StatusBadge status={row.attendanceToday} />,
    },
    {
      key: 'attendanceRate',
      header: 'Attendance rate',
      sortable: true,
      width: '150px',
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          <ProgressBar
            value={row.attendanceRate}
            tone={row.attendanceRate >= 90 ? 'success' : row.attendanceRate >= 80 ? 'warning' : 'danger'}
            className="flex-grow-1"
            label={`${row.fullName} attendance rate`}
          />
          <span className="bt-mono small bt-text-dim">{row.attendanceRate}%</span>
        </div>
      ),
    },
    {
      key: 'dailyWage',
      header: 'Daily wage',
      sortable: true,
      align: 'end',
      render: (row) => <span className="bt-mono small">{formatCurrency(row.dailyWage)}</span>,
    },
  ];

  const attendanceColumns: DataTableColumn<AttendanceRecord>[] = [
    {
      key: 'workerCode',
      header: 'Worker ID',
      sortable: true,
      width: '110px',
      render: (row) => <span className="bt-mono small bt-text-dim">{row.workerCode}</span>,
    },
    { key: 'workerName', header: 'Name', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => <span className="bt-mono small">{formatDate(row.date)}</span>,
    },
    { key: 'shift', header: 'Shift', sortable: true },
    {
      key: 'checkIn',
      header: 'Check in',
      render: (row) => <span className="bt-mono small">{row.checkIn}</span>,
    },
    {
      key: 'checkOut',
      header: 'Check out',
      render: (row) => <span className="bt-mono small">{row.checkOut}</span>,
    },
    {
      key: 'hoursWorked',
      header: 'Hours',
      sortable: true,
      align: 'end',
      render: (row) => <span className="bt-mono small">{row.hoursWorked.toFixed(1)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const activeControls = tab === 'Worker register' ? workerControls : attendanceControls;

  return (
    <>
      <PageHeader
        title="Workforce"
        subtitle="Worker registration, attendance tracking, shift scheduling and payroll monitoring."
        actions={
          <button type="button" className="btn btn-accent" onClick={() => setModalOpen(true)}>
            <i className="bi bi-person-plus me-2" aria-hidden="true" />
            Register worker
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
        <div className="col-12 col-xl-5">
          <ChartCard
            title="Workforce Distribution"
            subtitle="Headcount by workforce category"
            footer={
              <p className="bt-label mb-0 text-center">
                Total active workforce: {formatNumber(totalWorkforce)}
              </p>
            }
          >
            <DoughnutChart
              labels={workforceDistribution.map((entry) => entry.category)}
              values={workforceDistribution.map((entry) => entry.headcount)}
              colors={categoricalPalette}
              centerValue={formatNumber(totalWorkforce)}
              centerCaption="Personnel"
              showLegend
              height={300}
              valueFormatter={formatNumber}
              ariaLabel="Workforce headcount by category"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-4">
          <ChartCard
            title="Attendance Trend"
            subtitle="Site attendance rate, last eight weeks"
          >
            <LineChart
              labels={attendanceTrend.map((point) => point.label)}
              series={[
                {
                  label: 'Attendance',
                  values: attendanceTrend.map((point) => point.value),
                  color: chartColors.green,
                  filled: true,
                },
              ]}
              valueSuffix="%"
              yMax={100}
              showLegend={false}
              height={300}
              ariaLabel="Weekly attendance rate trend"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-3">
          <ChartCard title="Shift Coverage" subtitle="Personnel per shift">
            <BarChart
              labels={shiftCoverage.map((entry) => entry.label)}
              series={[
                { label: 'Personnel', values: shiftCoverage.map((entry) => entry.value) },
              ]}
              pointColors={[chartColors.accent, chartColors.green, chartColors.blue]}
              height={300}
              valueFormatter={formatNumber}
              ariaLabel="Personnel deployed per shift"
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
              placeholder="Search workers"
              label="Search workforce"
              size="sm"
            />

            <FilterPanel
              filters={tab === 'Worker register' ? WORKER_FILTERS : ATTENDANCE_FILTERS}
              values={activeControls.filters}
              onChange={activeControls.setFilter}
              onClear={activeControls.clearFilters}
              activeCount={activeControls.activeFilterCount}
            />
          </>
        }
      >
        {activeLoading ? (
          <LoadingState label={`Loading ${tab.toLowerCase()}…`} />
        ) : activeError ? (
          <StateMessage
            icon="bi-exclamation-triangle"
            title="Couldn't load workforce data"
            message={activeError}
          />
        ) : (
          <>
            {tab === 'Worker register' ? (
              <DataTable
                columns={workerColumns}
                rows={workerControls.pageRows}
                rowKey={(row) => row.id}
                sortKey={workerControls.sortKey}
                sortDirection={workerControls.sortDirection}
                onSort={workerControls.toggleSort}
                caption="Registered workers with allocation and attendance"
              />
            ) : (
              <DataTable
                columns={attendanceColumns}
                rows={attendanceControls.pageRows}
                rowKey={(row) => row.id}
                sortKey={attendanceControls.sortKey}
                sortDirection={attendanceControls.sortDirection}
                onSort={attendanceControls.toggleSort}
                caption="Daily attendance register"
              />
            )}

            <hr className="bt-divider m-0" />

            <Pagination
              page={activeControls.page}
              pageCount={activeControls.pageCount}
              rangeStart={activeControls.rangeStart}
              rangeEnd={activeControls.rangeEnd}
              total={activeControls.total}
              itemLabel={tab === 'Worker register' ? 'Workers' : 'Records'}
              onPageChange={activeControls.setPage}
            />
          </>
        )}
      </SectionCard>

      <Modal
        open={modalOpen}
        title="Register worker"
        description="Add a worker to the register and assign them to a project and shift."
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
            <button type="submit" form="register-worker-form" className="btn btn-accent">
              Register worker
            </button>
          </>
        }
      >
        <form id="register-worker-form" onSubmit={handleRegister} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <FormField
                label="Full name"
                value={values.fullName}
                onChange={(value) => setField('fullName', value)}
                error={errors.fullName}
                placeholder="e.g. Ganesh Murthy"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                as="select"
                label="Workforce category"
                value={values.category}
                onChange={(value) => setField('category', value)}
                options={WORKFORCE_CATEGORIES}
                error={errors.category}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                label="Trade / designation"
                value={values.trade}
                onChange={(value) => setField('trade', value)}
                error={errors.trade}
                placeholder="e.g. Crane Operator"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                as="select"
                label="Assigned project"
                value={values.assignedProject}
                onChange={(value) => setField('assignedProject', value)}
                options={projects.map((project) => project.name)}
                error={errors.assignedProject}
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <FormField
                as="select"
                label="Shift"
                value={values.shift}
                onChange={(value) => setField('shift', value)}
                options={SHIFT_NAMES}
                placeholderOption="Select shift"
              />
            </div>

            <div className="col-12 col-md-4">
              <FormField
                type="tel"
                label="Contact number"
                value={values.contact}
                onChange={(value) => setField('contact', value)}
                error={errors.contact}
                placeholder="+91 98400 00000"
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <FormField
                type="number"
                label="Daily wage (₹)"
                value={values.dailyWage}
                onChange={(value) => setField('dailyWage', value)}
                error={errors.dailyWage}
                placeholder="1250"
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
