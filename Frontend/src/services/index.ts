/**
 * Service layer.
 *
 * Milestone 2 modules — Projects, Resources, Inventory, Workforce — are wired
 * to the FastAPI backend (`request(...)`), with the bundled fixtures used as a
 * fallback if the server is unreachable so the UI still renders. The remaining
 * modules (site progress, procurement, analytics, reports, budget,
 * notifications) belong to later milestones and continue to serve mock data.
 */
import {
  adminKpis,
  analyticsKpis,
  overviewKpis,
  portfolioPerformance,
} from '../data/analytics';
import {
  budgetLines,
  costByCategory,
  expenses,
  monthlySpend,
  totalBudgetAllocated,
  totalBudgetRemaining,
  totalBudgetSpent,
} from '../data/budget';
import {
  materialRequests,
  materials,
  stockByCategory,
} from '../data/inventory';
import { generatedReports, notifications } from '../data/notifications';
import {
  invoices,
  procurementByCategory,
  purchaseOrders,
  vendors,
} from '../data/procurement';
import { milestones as mockMilestones, projects as mockProjects } from '../data/projects';
import {
  maintenanceSchedule,
  resourceAllocation,
  resourceUtilisation,
  resources as mockResources,
} from '../data/resources';
import {
  activityLog,
  delayByProject,
  progressReports,
  weeklyProgressTrend,
  workCategoryProgress,
} from '../data/siteProgress';
import {
  attendanceRecords as mockAttendance,
  attendanceTrend,
  shiftCoverage,
  totalWorkforce,
  workers as mockWorkers,
  workforceDistribution,
} from '../data/workforce';
import type {
  AttendanceRecord,
  MaterialItem,
  Milestone,
  Project,
  Resource,
  Worker,
} from '../types';
import { isOffline, mockResponse, request } from './apiClient';
import {
  mapAttendance,
  mapInventory,
  mapMilestone,
  mapProject,
  mapResource,
  mapWorker,
  projectIdFromCode,
  type BackendAttendance,
  type BackendInventoryItem,
  type BackendMilestone,
  type BackendProject,
  type BackendResource,
  type BackendWorker,
} from './mappers';

export { authService } from './authService';
export { ApiError, API_BASE_URL, isOffline } from './apiClient';

/**
 * Runs a live API loader, falling back to bundled data only when the backend
 * is unreachable. Real API errors (401/404/500) propagate to the caller.
 */
async function live<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (isOffline(error)) {
      // eslint-disable-next-line no-console
      console.warn('[BuildTrack] Backend unreachable — serving bundled data.');
      return fallback;
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Milestone 2 — live services                                         */
/* ------------------------------------------------------------------ */

/** Projects & milestones — document module 2. */
export const projectService = {
  list: (): Promise<Project[]> =>
    live(
      async () => (await request<BackendProject[]>('/projects')).map(mapProject),
      mockProjects,
    ),

  getByCode: (code: string): Promise<Project | null> =>
    live(async () => {
      const id = projectIdFromCode(code);
      if (!id) return null;
      const row = await request<BackendProject>(`/projects/${id}`);
      return mapProject(row);
    }, mockProjects.find((project) => project.code === code) ?? null),

  milestonesFor: (projectRef: string): Promise<Milestone[]> =>
    live(async () => {
      const id = projectRef.startsWith('PRJ') ? projectIdFromCode(projectRef) : Number(projectRef);
      const rows = await request<BackendMilestone[]>(`/projects/${id}/milestones`);
      return rows.map(mapMilestone);
    }, mockMilestones.filter((milestone) => milestone.projectId === projectRef)),

  allMilestones: (): Promise<Milestone[]> =>
    live(async () => {
      const projects = await request<BackendProject[]>('/projects');
      return projects.flatMap((project) => (project.milestones ?? []).map(mapMilestone));
    }, mockMilestones),
};

/** Resource management — document module 4. */
export const resourceService = {
  list: (): Promise<Resource[]> =>
    live(
      async () => (await request<BackendResource[]>('/resources')).map(mapResource),
      mockResources,
    ),
  // Aggregate views the backend does not expose yet — illustrative data.
  allocation: () => mockResponse(resourceAllocation),
  utilisation: () => mockResponse(resourceUtilisation),
  maintenance: () => mockResponse(maintenanceSchedule),
};

/** Material & inventory — document module 5. */
export const inventoryService = {
  materials: (): Promise<MaterialItem[]> =>
    live(
      async () => (await request<BackendInventoryItem[]>('/inventory')).map(mapInventory),
      materials,
    ),
  requests: () => mockResponse(materialRequests),
  stockByCategory: () => mockResponse(stockByCategory),
};

/** Workforce — document module 6. */
export const workforceService = {
  workers: (): Promise<Worker[]> =>
    live(
      async () => (await request<BackendWorker[]>('/workforce/workers')).map(mapWorker),
      mockWorkers,
    ),

  attendance: (): Promise<AttendanceRecord[]> =>
    live(async () => {
      const [workers, records] = await Promise.all([
        request<BackendWorker[]>('/workforce/workers'),
        request<BackendAttendance[]>('/workforce/attendance'),
      ]);
      const nameById = new Map(workers.map((w) => [w.id, w.name]));
      return records.map((row) =>
        mapAttendance(row, (id) => nameById.get(id) ?? `Worker #${id}`),
      );
    }, mockAttendance),

  // Aggregate views the backend does not expose yet — illustrative data.
  distribution: () => mockResponse(workforceDistribution),
  attendanceTrend: () => mockResponse(attendanceTrend),
  shiftCoverage: () => mockResponse(shiftCoverage),
  total: () => mockResponse(totalWorkforce),
};

/* ------------------------------------------------------------------ */
/* Later-milestone modules — mock data                                 */
/* ------------------------------------------------------------------ */

/** Site progress monitoring — document module 3. */
export const siteProgressService = {
  reports: () => mockResponse(progressReports),
  activityLog: () => mockResponse(activityLog),
  categoryProgress: () => mockResponse(workCategoryProgress),
  weeklyTrend: () => mockResponse(weeklyProgressTrend),
  delays: () => mockResponse(delayByProject),
};

/** Procurement — document module 7. */
export const procurementService = {
  vendors: () => mockResponse(vendors),
  purchaseOrders: () => mockResponse(purchaseOrders),
  invoices: () => mockResponse(invoices),
  spendByCategory: () => mockResponse(procurementByCategory),
};

/** Notifications — document module 8. */
export const notificationService = {
  list: () => mockResponse(notifications),
};

/** Dashboards & analytics — document module 9. */
export const analyticsService = {
  overviewKpis: () => mockResponse(overviewKpis),
  analyticsKpis: () => mockResponse(analyticsKpis),
  adminKpis: () => mockResponse(adminKpis),
  portfolioPerformance: () => mockResponse(portfolioPerformance),
};

/** Reports & documentation — document module 10. */
export const reportService = {
  list: () => mockResponse(generatedReports),
};

/** Budget & cost management — document module 11. */
export const budgetService = {
  lines: () => mockResponse(budgetLines),
  expenses: () => mockResponse(expenses),
  costByCategory: () => mockResponse(costByCategory),
  monthlySpend: () => mockResponse(monthlySpend),
  totals: () =>
    mockResponse({
      allocated: totalBudgetAllocated,
      spent: totalBudgetSpent,
      remaining: totalBudgetRemaining,
    }),
};
