/**
 * Adapters between the FastAPI backend (snake_case, integer IDs, thin enum
 * values) and the frontend view types (camelCase, rich unions).
 *
 * The backend stores fewer fields than the UI displays, so a few frontend
 * fields are derived (project `code` from the id, stock status from quantity
 * vs threshold, project progress from milestone completion). Where the
 * backend has no equivalent at all, a neutral placeholder is used.
 */
import type {
  AttendanceRecord,
  AttendanceStatus,
  MaterialCategory,
  MaterialItem,
  Milestone,
  MilestoneStatus,
  Project,
  ProjectStatus,
  Resource,
  ResourceCategory,
  ResourceStatus,
  StockStatus,
  User,
  UserRole,
  Worker,
  WorkforceCategory,
} from '../types';
import { initialsOf } from '../utils/format';

/* ------------------------------------------------------------------ */
/* Backend row shapes                                                  */
/* ------------------------------------------------------------------ */

export interface BackendUser {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface BackendMilestone {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  completion_percentage: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface BackendProject {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  spent_budget: number;
  status: string;
  manager_id: number | null;
  client_id: number | null;
  milestones?: BackendMilestone[];
  created_at?: string;
  updated_at?: string;
}

export interface BackendResource {
  id: number;
  name: string;
  resource_type: string;
  serial_number: string | null;
  cost_per_hour: number;
  status: string;
  project_id: number | null;
  notes: string | null;
  updated_at?: string;
}

export interface BackendInventoryItem {
  id: number;
  project_id: number | null;
  item_name: string;
  category: string;
  unit: string;
  quantity: number;
  min_threshold_quantity: number;
  unit_cost: number;
  supplier_name: string | null;
  location: string | null;
  updated_at?: string;
}

export interface BackendWorker {
  id: number;
  name: string;
  trade: string | null;
  phone: string | null;
  daily_rate: number;
  is_active: string;
  contractor_id: number | null;
  created_at?: string;
}

export interface BackendAttendance {
  id: number;
  worker_id: number;
  project_id: number | null;
  date: string;
  status: string;
  hours_worked: number;
  notes: string | null;
}

/* ------------------------------------------------------------------ */
/* Enum maps                                                           */
/* ------------------------------------------------------------------ */

const ROLE_TO_FRONTEND: Record<string, UserRole> = {
  administrator: 'Administrator',
  project_manager: 'Project Manager',
  site_engineer: 'Site Engineer',
  contractor: 'Contractor',
  client: 'Client',
  worker: 'Worker',
};

const ROLE_TO_BACKEND: Record<UserRole, string> = {
  Administrator: 'administrator',
  'Project Manager': 'project_manager',
  'Site Engineer': 'site_engineer',
  Contractor: 'contractor',
  Worker: 'worker',
  Client: 'client',
};

export function roleToBackend(role: UserRole): string {
  return ROLE_TO_BACKEND[role] ?? 'site_engineer';
}

function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PROJECT_STATUS: Record<string, ProjectStatus> = {
  planning: 'Planning',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Closed',
};

const MILESTONE_STATUS: Record<string, MilestoneStatus> = {
  not_started: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  delayed: 'Delayed',
};

const RESOURCE_STATUS: Record<string, ResourceStatus> = {
  available: 'Available',
  allocated: 'Allocated',
  maintenance: 'Under Maintenance',
  decommissioned: 'Out of Service',
};

const ATTENDANCE_STATUS: Record<string, AttendanceStatus> = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half Day',
  leave: 'On Leave',
  overtime: 'Present',
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function isoDate(value: string | null | undefined): string {
  if (!value) return '—';
  return value.slice(0, 10);
}

/** `PRJ-007` — stable, reversible project code derived from the id. */
export function projectCode(id: number): string {
  return `PRJ-${String(id).padStart(3, '0')}`;
}

/** Reverses `projectCode` (or accepts a raw numeric id). */
export function projectIdFromCode(code: string): number {
  const digits = code.replace(/\D/g, '');
  return Number(digits);
}

/* ------------------------------------------------------------------ */
/* Mappers                                                             */
/* ------------------------------------------------------------------ */

export function mapUser(row: BackendUser): User {
  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? '—',
    role: ROLE_TO_FRONTEND[row.role] ?? (titleCase(row.role) as UserRole),
    employeeId: `EMP-${String(row.id).padStart(3, '0')}`,
    department: titleCase(row.role.replace(/_/g, ' ')),
    status: row.is_active ? 'Active' : 'Inactive',
    lastLogin: (row.created_at ?? '').slice(0, 16).replace('T', ' ') || '—',
    initials: initialsOf(row.full_name),
  };
}

export function mapMilestone(row: BackendMilestone): Milestone {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    // Backend milestone titles are free text; the UI renders them as-is.
    name: row.title as Milestone['name'],
    description: row.description ?? '',
    status: MILESTONE_STATUS[row.status] ?? 'Scheduled',
    progress: Math.round(row.completion_percentage ?? 0),
    plannedStart: isoDate(row.created_at),
    plannedEnd: isoDate(row.due_date),
    owner: '—',
  };
}

export function mapProject(row: BackendProject): Project {
  const milestones = row.milestones ?? [];
  const progress =
    milestones.length > 0
      ? Math.round(
          milestones.reduce((sum, m) => sum + (m.completion_percentage ?? 0), 0) /
            milestones.length,
        )
      : 0;

  const status = PROJECT_STATUS[row.status] ?? 'Planning';
  const health: Project['health'] =
    status === 'On Hold' ? 'At Risk' : status === 'Closed' ? 'Delayed' : 'On Track';

  return {
    id: String(row.id),
    code: projectCode(row.id),
    name: row.name,
    // Backend has no project category; default to a neutral value.
    category: 'Commercial',
    status,
    health,
    client: row.client_id ? `Client #${row.client_id}` : 'Unassigned',
    location: row.location ?? '—',
    projectManager: row.manager_id ? `Manager #${row.manager_id}` : 'Unassigned',
    siteEngineer: '—',
    startDate: isoDate(row.start_date),
    targetEndDate: isoDate(row.end_date),
    progress,
    budgetAllocated: row.budget ?? 0,
    budgetSpent: row.spent_budget ?? 0,
    workforceCount: 0,
    description: row.description ?? '',
  };
}

export function mapResource(row: BackendResource): Resource {
  const condition = Math.max(
    20,
    100 - (row.status === 'maintenance' ? 55 : row.status === 'decommissioned' ? 80 : 8),
  );

  return {
    id: String(row.id),
    assetId: row.serial_number ?? `RES-${row.id}`,
    name: row.name,
    // Backend resource_type (equipment/machinery/vehicle/tool) is broader than
    // the document's six categories; display the type, title-cased.
    category: titleCase(row.resource_type) as ResourceCategory,
    status: RESOURCE_STATUS[row.status] ?? 'Available',
    conditionPercent: condition,
    allocatedProject: row.project_id ? projectCode(row.project_id) : 'Unallocated',
    operator: row.notes ?? '—',
    utilisationPercent: row.status === 'allocated' ? 80 : 25,
    lastMaintenance: isoDate(row.updated_at),
    nextMaintenance: '—',
  };
}

function deriveStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= threshold) return 'Low Stock';
  return 'In Stock';
}

export function mapInventory(row: BackendInventoryItem): MaterialItem {
  return {
    id: String(row.id),
    materialCode: `MAT-${String(row.id).padStart(3, '0')}`,
    name: row.item_name,
    category: (row.category as MaterialCategory) ?? 'Cement',
    unit: row.unit,
    quantityInStock: row.quantity,
    reorderLevel: row.min_threshold_quantity,
    stockStatus: deriveStockStatus(row.quantity, row.min_threshold_quantity),
    unitCost: row.unit_cost,
    storeLocation: row.location ?? '—',
    allocatedProject: row.project_id ? projectCode(row.project_id) : 'Central Store',
    lastRestocked: isoDate(row.updated_at),
  };
}

export function mapWorker(row: BackendWorker): Worker {
  return {
    id: String(row.id),
    workerCode: `WRK-${String(row.id).padStart(3, '0')}`,
    fullName: row.name,
    // Backend has no workforce category; approximate from presence of a trade.
    category: (row.trade ? 'Skilled Workers' : 'Unskilled Workers') as WorkforceCategory,
    trade: row.trade ?? '—',
    assignedProject: row.contractor_id ? `Contractor #${row.contractor_id}` : 'Unassigned',
    shift: 'Morning',
    contact: row.phone ?? '—',
    dailyWage: row.daily_rate,
    attendanceToday: 'Present',
    attendanceRate: row.is_active === 'active' ? 95 : 60,
    joinedOn: isoDate(row.created_at),
  };
}

export function mapAttendance(
  row: BackendAttendance,
  workerName: (id: number) => string,
): AttendanceRecord {
  return {
    id: String(row.id),
    workerCode: `WRK-${String(row.worker_id).padStart(3, '0')}`,
    workerName: workerName(row.worker_id),
    category: 'Skilled Workers',
    date: isoDate(row.date),
    shift: 'Morning',
    checkIn: '—',
    checkOut: '—',
    hoursWorked: row.hours_worked ?? 0,
    status: ATTENDANCE_STATUS[row.status] ?? 'Present',
    project: row.project_id ? projectCode(row.project_id) : '—',
  };
}
