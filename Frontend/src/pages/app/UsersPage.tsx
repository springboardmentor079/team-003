import { useState } from 'react';

import { DoughnutChart } from '../../components/charts/DoughnutChart';
import { categoricalPalette } from '../../components/charts/chartTheme';
import { FilterPanel } from '../../components/common/FilterPanel';
import { Modal } from '../../components/common/Modal';
import { PageHeader, SectionCard } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast } from '../../components/common/Toast';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { FormField } from '../../components/forms/FormField';
import { DataTable } from '../../components/tables/DataTable';
import { useTableControls } from '../../hooks/useTableControls';
import { users } from '../../data/users';
import {
  USER_ROLES,
  type DataTableColumn,
  type FilterDefinition,
  type User,
} from '../../types';
import { formatDateTime } from '../../utils/format';
import {
  isValid,
  requiredField,
  validateEmail,
  validatePhone,
  type FieldErrors,
} from '../../utils/validation';

const FILTERS: FilterDefinition[] = [
  {
    id: 'role',
    label: 'Role',
    options: USER_ROLES.map((value) => ({ label: value, value })),
  },
  {
    id: 'status',
    label: 'Account status',
    options: ['Active', 'Inactive', 'Suspended'].map((value) => ({ label: value, value })),
  },
];

interface InviteFormValues {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
}

const EMPTY_INVITE: InviteFormValues = {
  fullName: '',
  email: '',
  phone: '',
  role: '',
  department: '',
};

/**
 * User Management — document module 9 (Admin Dashboard) and module 1
 * (role-based access). Administrator-only screen; the six roles here are the
 * document's six roles, none of which appeared anywhere in the Figma.
 */
export function UsersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [values, setValues] = useState<InviteFormValues>(EMPTY_INVITE);
  const [errors, setErrors] = useState<FieldErrors<InviteFormValues>>({});

  const controls = useTableControls<User>({
    rows: users,
    searchKeys: ['fullName', 'email', 'employeeId', 'department'],
    filterKeys: { role: 'role', status: 'status' },
    initialSortKey: 'fullName',
    pageSize: 8,
  });

  const roleCounts = USER_ROLES.map(
    (role) => users.filter((user) => user.role === role).length,
  );

  function setField(field: keyof InviteFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleInvite(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: FieldErrors<InviteFormValues> = {
      fullName: requiredField(values.fullName, 'Full name'),
      email: validateEmail(values.email),
      phone: validatePhone(values.phone),
      role: requiredField(values.role, 'Role'),
      department: requiredField(values.department, 'Department'),
    };

    setErrors(nextErrors);
    if (!isValid(nextErrors)) return;

    setToast(`Invitation sent to ${values.email} as ${values.role}.`);
    setValues(EMPTY_INVITE);
    setModalOpen(false);
  }

  const columns: DataTableColumn<User>[] = [
    {
      key: 'fullName',
      header: 'User',
      sortable: true,
      render: (row) => (
        <div className="d-flex align-items-center gap-3">
          <span className="bt-avatar" style={{ width: 36, height: 36, fontSize: '0.75rem' }}>
            {row.initials}
          </span>
          <div className="min-w-0">
            <p className="mb-1 fw-semibold">{row.fullName}</p>
            <p className="bt-label mb-0">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'employeeId',
      header: 'Employee ID',
      sortable: true,
      render: (row) => <span className="bt-mono small bt-text-dim">{row.employeeId}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (row) => <StatusBadge status={row.role} tone="info" withDot={false} />,
    },
    { key: 'department', header: 'Department', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'lastLogin',
      header: 'Last login',
      sortable: true,
      render: (row) => <span className="bt-mono small">{formatDateTime(row.lastLogin)}</span>,
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'end',
      width: '80px',
      render: () => (
        <button type="button" className="btn btn-ghost btn-icon" aria-label="User actions">
          <i className="bi bi-three-dots-vertical" aria-hidden="true" />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage platform accounts and role-based access across the six BuildTrack roles."
        actions={
          <button type="button" className="btn btn-accent" onClick={() => setModalOpen(true)}>
            <i className="bi bi-person-plus me-2" aria-hidden="true" />
            Invite user
          </button>
        }
      />

      <div className="row g-3 g-lg-4 mb-4">
        <div className="col-12 col-xl-4">
          <ChartCard title="Users by Role" subtitle="Distribution across the six roles">
            <DoughnutChart
              labels={[...USER_ROLES]}
              values={roleCounts}
              colors={categoricalPalette}
              centerValue={String(users.length)}
              centerCaption="Accounts"
              showLegend
              height={280}
              ariaLabel="Users by role"
            />
          </ChartCard>
        </div>

        <div className="col-12 col-xl-8">
          <SectionCard
            title="Directory"
            subtitle={`${controls.total} account${controls.total === 1 ? '' : 's'} in the current view`}
            flush
            actions={
              <>
                <SearchBar
                  value={controls.search}
                  onChange={controls.setSearch}
                  placeholder="Search users"
                  label="Search users"
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
              caption="Platform user accounts and roles"
            />

            <hr className="bt-divider m-0" />

            <Pagination
              page={controls.page}
              pageCount={controls.pageCount}
              rangeStart={controls.rangeStart}
              rangeEnd={controls.rangeEnd}
              total={controls.total}
              itemLabel="Users"
              onPageChange={controls.setPage}
            />
          </SectionCard>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title="Invite user"
        description="Create a platform account and assign a role."
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
            <button type="submit" form="invite-user-form" className="btn btn-accent">
              Send invitation
            </button>
          </>
        }
      >
        <form id="invite-user-form" onSubmit={handleInvite} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <FormField
                label="Full name"
                value={values.fullName}
                onChange={(value) => setField('fullName', value)}
                error={errors.fullName}
                placeholder="e.g. Anita Desai"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                type="email"
                label="Email"
                value={values.email}
                onChange={(value) => setField('email', value)}
                error={errors.email}
                placeholder="user@buildtrack.com"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                type="tel"
                label="Phone"
                value={values.phone}
                onChange={(value) => setField('phone', value)}
                error={errors.phone}
                placeholder="+91 98400 00000"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <FormField
                as="select"
                label="Role"
                value={values.role}
                onChange={(value) => setField('role', value)}
                options={USER_ROLES}
                error={errors.role}
                required
              />
            </div>

            <div className="col-12">
              <FormField
                label="Department"
                value={values.department}
                onChange={(value) => setField('department', value)}
                error={errors.department}
                placeholder="e.g. Project Delivery"
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
