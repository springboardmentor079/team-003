import type { ReactNode } from 'react';

/**
 * Shared domain types for BuildTrack.
 *
 * Every union below is taken verbatim from the project reference document
 * (module list, category lists and role list) rather than from the Figma
 * mock, which uses invented labels in several places.
 */

/* ------------------------------------------------------------------ */
/* Auth & users — document module 1                                    */
/* ------------------------------------------------------------------ */

/** The six roles defined by the document. Figma showed none of these. */
export type UserRole =
  | 'Administrator'
  | 'Project Manager'
  | 'Site Engineer'
  | 'Contractor'
  | 'Worker'
  | 'Client';

export const USER_ROLES: readonly UserRole[] = [
  'Administrator',
  'Project Manager',
  'Site Engineer',
  'Contractor',
  'Worker',
  'Client',
] as const;

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  employeeId: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin: string;
  initials: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegistrationDetails {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

/* ------------------------------------------------------------------ */
/* Projects — document module 2                                        */
/* ------------------------------------------------------------------ */

export type ProjectCategory =
  | 'Residential'
  | 'Commercial'
  | 'Industrial'
  | 'Infrastructure'
  | 'Government';

export const PROJECT_CATEGORIES: readonly ProjectCategory[] = [
  'Residential',
  'Commercial',
  'Industrial',
  'Infrastructure',
  'Government',
] as const;

/** Lifecycle status — document: "Project Status Tracking" + "Project Closure". */
export type ProjectStatus =
  | 'Planning'
  | 'In Progress'
  | 'On Hold'
  | 'Delayed'
  | 'Completed'
  | 'Closed';

export const PROJECT_STATUSES: readonly ProjectStatus[] = [
  'Planning',
  'In Progress',
  'On Hold',
  'Delayed',
  'Completed',
  'Closed',
] as const;

/** Schedule health, shown as a badge on dashboards. */
export type ProjectHealth = 'On Track' | 'At Risk' | 'Delayed';

export interface Project {
  id: string;
  code: string;
  name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  health: ProjectHealth;
  client: string;
  location: string;
  projectManager: string;
  siteEngineer: string;
  startDate: string;
  targetEndDate: string;
  progress: number;
  budgetAllocated: number;
  budgetSpent: number;
  workforceCount: number;
  description: string;
}

export type MilestoneStatus = 'Completed' | 'In Progress' | 'Scheduled' | 'Delayed';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: MilestoneStatus;
  progress: number;
  plannedStart: string;
  plannedEnd: string;
  owner: string;
}

/* ------------------------------------------------------------------ */
/* Site progress monitoring — document module 3                        */
/* ------------------------------------------------------------------ */

/** The six progress categories named in the document. */
export type WorkCategory =
  | 'Foundation'
  | 'Structural Work'
  | 'Electrical Work'
  | 'Plumbing Work'
  | 'Finishing Work'
  | 'Inspection Work';

export const WORK_CATEGORIES: readonly WorkCategory[] = [
  'Foundation',
  'Structural Work',
  'Electrical Work',
  'Plumbing Work',
  'Finishing Work',
  'Inspection Work',
] as const;

export type ReportFrequency = 'Daily' | 'Weekly';

export interface ProgressReport {
  id: string;
  projectId: string;
  projectName: string;
  frequency: ReportFrequency;
  reportDate: string;
  workCategory: WorkCategory;
  completionPercent: number;
  workCompleted: string;
  submittedBy: string;
  delayDays: number;
  delayReason: string;
  status: 'Submitted' | 'Under Review' | 'Approved';
}

export type ActivitySeverity = 'info' | 'success' | 'warning' | 'danger';

export interface ActivityLogEntry {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  severity: ActivitySeverity;
  projectId: string;
  loggedBy: string;
}

/* ------------------------------------------------------------------ */
/* Resources — document module 4                                       */
/* ------------------------------------------------------------------ */

/** The six resource categories named in the document. */
export type ResourceCategory =
  | 'Excavators'
  | 'Concrete Mixers'
  | 'Cranes'
  | 'Dump Trucks'
  | 'Generators'
  | 'Safety Equipment';

export const RESOURCE_CATEGORIES: readonly ResourceCategory[] = [
  'Excavators',
  'Concrete Mixers',
  'Cranes',
  'Dump Trucks',
  'Generators',
  'Safety Equipment',
] as const;

export type ResourceStatus =
  | 'Available'
  | 'Allocated'
  | 'Under Maintenance'
  | 'Out of Service';

export const RESOURCE_STATUSES: readonly ResourceStatus[] = [
  'Available',
  'Allocated',
  'Under Maintenance',
  'Out of Service',
] as const;

export interface Resource {
  id: string;
  assetId: string;
  name: string;
  category: ResourceCategory;
  status: ResourceStatus;
  conditionPercent: number;
  allocatedProject: string;
  operator: string;
  utilisationPercent: number;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface ResourceAllocationSummary {
  category: ResourceCategory;
  active: number;
  total: number;
}

/* ------------------------------------------------------------------ */
/* Materials & inventory — document module 5                           */
/* ------------------------------------------------------------------ */

/** The seven material categories named in the document. */
export type MaterialCategory =
  | 'Cement'
  | 'Steel'
  | 'Bricks'
  | 'Sand'
  | 'Concrete'
  | 'Electrical Materials'
  | 'Plumbing Materials';

export const MATERIAL_CATEGORIES: readonly MaterialCategory[] = [
  'Cement',
  'Steel',
  'Bricks',
  'Sand',
  'Concrete',
  'Electrical Materials',
  'Plumbing Materials',
] as const;

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Reordered';

export interface MaterialItem {
  id: string;
  materialCode: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  quantityInStock: number;
  reorderLevel: number;
  stockStatus: StockStatus;
  unitCost: number;
  storeLocation: string;
  allocatedProject: string;
  lastRestocked: string;
}

export type MaterialRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Issued'
  | 'Fulfilled';

export interface MaterialRequest {
  id: string;
  requestCode: string;
  materialName: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  projectName: string;
  requestedBy: string;
  requestedOn: string;
  requiredBy: string;
  status: MaterialRequestStatus;
}

/* ------------------------------------------------------------------ */
/* Workforce — document module 6                                       */
/* ------------------------------------------------------------------ */

/** The six workforce categories named in the document. */
export type WorkforceCategory =
  | 'Engineers'
  | 'Supervisors'
  | 'Contractors'
  | 'Skilled Workers'
  | 'Unskilled Workers'
  | 'Consultants';

export const WORKFORCE_CATEGORIES: readonly WorkforceCategory[] = [
  'Engineers',
  'Supervisors',
  'Contractors',
  'Skilled Workers',
  'Unskilled Workers',
  'Consultants',
] as const;

export type ShiftName = 'Morning' | 'Afternoon' | 'Night';

export const SHIFT_NAMES: readonly ShiftName[] = ['Morning', 'Afternoon', 'Night'] as const;

export type AttendanceStatus = 'Present' | 'Absent' | 'On Leave' | 'Half Day';

export interface Worker {
  id: string;
  workerCode: string;
  fullName: string;
  category: WorkforceCategory;
  trade: string;
  assignedProject: string;
  shift: ShiftName;
  contact: string;
  dailyWage: number;
  attendanceToday: AttendanceStatus;
  attendanceRate: number;
  joinedOn: string;
}

export interface AttendanceRecord {
  id: string;
  workerCode: string;
  workerName: string;
  category: WorkforceCategory;
  date: string;
  shift: ShiftName;
  checkIn: string;
  checkOut: string;
  hoursWorked: number;
  status: AttendanceStatus;
  project: string;
}

export interface WorkforceDistribution {
  category: WorkforceCategory;
  headcount: number;
  percentage: number;
}

/* ------------------------------------------------------------------ */
/* Procurement — document module 7                                     */
/* ------------------------------------------------------------------ */

/** The five procurement categories named in the document. */
export type ProcurementCategory =
  | 'Raw Materials'
  | 'Equipment'
  | 'Machinery'
  | 'Safety Equipment'
  | 'Office Supplies';

export const PROCUREMENT_CATEGORIES: readonly ProcurementCategory[] = [
  'Raw Materials',
  'Equipment',
  'Machinery',
  'Safety Equipment',
  'Office Supplies',
] as const;

export type PurchaseOrderStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Ordered'
  | 'Delivered'
  | 'Cancelled';

export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  category: ProcurementCategory;
  contactPerson: string;
  email: string;
  phone: string;
  rating: number;
  activeOrders: number;
  status: 'Active' | 'Inactive' | 'Blacklisted';
  onboardedOn: string;
}

export interface PurchaseOrder {
  id: string;
  orderCode: string;
  vendorName: string;
  category: ProcurementCategory;
  projectName: string;
  itemSummary: string;
  quantity: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  raisedBy: string;
  raisedOn: string;
  expectedDelivery: string;
}

export type InvoiceStatus = 'Pending' | 'Approved' | 'Paid' | 'Overdue';

export interface Invoice {
  id: string;
  invoiceCode: string;
  orderCode: string;
  vendorName: string;
  amount: number;
  issuedOn: string;
  dueOn: string;
  status: InvoiceStatus;
}

/* ------------------------------------------------------------------ */
/* Notifications — document module 8                                   */
/* ------------------------------------------------------------------ */

/** The six notification types named in the document. */
export type NotificationType =
  | 'Project Update'
  | 'Task Assignment'
  | 'Procurement Alert'
  | 'Attendance Alert'
  | 'Deadline Notification'
  | 'System Notification';

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'Project Update',
  'Task Assignment',
  'Procurement Alert',
  'Attendance Alert',
  'Deadline Notification',
  'System Notification',
] as const;

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: ActivitySeverity;
  relatedTo: string;
}

/* ------------------------------------------------------------------ */
/* Reports — document module 10                                        */
/* ------------------------------------------------------------------ */

/** The five report types named in the document. */
export type ReportType =
  | 'Project Progress Report'
  | 'Resource Utilization Report'
  | 'Budget Report'
  | 'Workforce Report'
  | 'Procurement Report';

export const REPORT_TYPES: readonly ReportType[] = [
  'Project Progress Report',
  'Resource Utilization Report',
  'Budget Report',
  'Workforce Report',
  'Procurement Report',
] as const;

/** The document specifies PDF and Excel export only. */
export type ExportFormat = 'PDF' | 'Excel';

export interface GeneratedReport {
  id: string;
  reportCode: string;
  type: ReportType;
  projectName: string;
  periodFrom: string;
  periodTo: string;
  generatedBy: string;
  generatedOn: string;
  format: ExportFormat;
  sizeKb: number;
  status: 'Ready' | 'Generating' | 'Failed';
}

/* ------------------------------------------------------------------ */
/* Budget & cost — document module 11                                  */
/* ------------------------------------------------------------------ */

/** The six cost categories named in the document. */
export type CostCategory =
  | 'Labor Cost'
  | 'Material Cost'
  | 'Equipment Cost'
  | 'Transportation Cost'
  | 'Maintenance Cost'
  | 'Administrative Cost';

export const COST_CATEGORIES: readonly CostCategory[] = [
  'Labor Cost',
  'Material Cost',
  'Equipment Cost',
  'Transportation Cost',
  'Maintenance Cost',
  'Administrative Cost',
] as const;

export interface BudgetLine {
  id: string;
  projectName: string;
  category: CostCategory;
  estimated: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'Within Budget' | 'Near Limit' | 'Over Budget';
}

export interface Expense {
  id: string;
  expenseCode: string;
  projectName: string;
  category: CostCategory;
  description: string;
  amount: number;
  incurredOn: string;
  approvedBy: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

/* ------------------------------------------------------------------ */
/* Dashboard / analytics primitives                                    */
/* ------------------------------------------------------------------ */

export type TrendDirection = 'up' | 'down' | 'flat';

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  delta?: string;
  trend?: TrendDirection;
  progress?: number;
  accent: 'accent' | 'green' | 'amber' | 'red' | 'blue';
  icon: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DualSeries {
  labels: string[];
  planned: number[];
  actual: number[];
}

/* ------------------------------------------------------------------ */
/* Table / UI helpers                                                  */
/* ------------------------------------------------------------------ */

export type SortDirection = 'asc' | 'desc';

export interface SortState<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  /** Property this column reads. Use `id` for purely derived columns. */
  key: keyof T;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'start' | 'center' | 'end';
  /** Custom cell renderer; falls back to the raw string value. */
  render?: (row: T) => ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDefinition {
  id: string;
  label: string;
  options: FilterOption[];
}

export type FilterValues = Record<string, string>;

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  /** Roles allowed to see this entry. Omitted means "every role". */
  roles?: readonly UserRole[];
}
