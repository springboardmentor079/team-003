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
import { milestones, projects } from '../data/projects';
import {
  maintenanceSchedule,
  resourceAllocation,
  resourceUtilisation,
  resources,
} from '../data/resources';
import {
  activityLog,
  delayByProject,
  progressReports,
  weeklyProgressTrend,
  workCategoryProgress,
} from '../data/siteProgress';
import {
  attendanceRecords,
  attendanceTrend,
  shiftCoverage,
  totalWorkforce,
  workers,
  workforceDistribution,
} from '../data/workforce';
import { mockResponse } from './apiClient';

export { authService } from './authService';
export { ApiError, API_BASE_URL } from './apiClient';

/** Projects & milestones — document module 2. */
export const projectService = {
  list: () => mockResponse(projects),
  getByCode: (code: string) =>
    mockResponse(projects.find((project) => project.code === code) ?? null),
  milestonesFor: (projectId: string) =>
    mockResponse(milestones.filter((milestone) => milestone.projectId === projectId)),
  allMilestones: () => mockResponse(milestones),
};

/** Site progress monitoring — document module 3. */
export const siteProgressService = {
  reports: () => mockResponse(progressReports),
  activityLog: () => mockResponse(activityLog),
  categoryProgress: () => mockResponse(workCategoryProgress),
  weeklyTrend: () => mockResponse(weeklyProgressTrend),
  delays: () => mockResponse(delayByProject),
};

/** Resource management — document module 4. */
export const resourceService = {
  list: () => mockResponse(resources),
  allocation: () => mockResponse(resourceAllocation),
  utilisation: () => mockResponse(resourceUtilisation),
  maintenance: () => mockResponse(maintenanceSchedule),
};

/** Material & inventory — document module 5. */
export const inventoryService = {
  materials: () => mockResponse(materials),
  requests: () => mockResponse(materialRequests),
  stockByCategory: () => mockResponse(stockByCategory),
};

/** Workforce — document module 6. */
export const workforceService = {
  workers: () => mockResponse(workers),
  attendance: () => mockResponse(attendanceRecords),
  distribution: () => mockResponse(workforceDistribution),
  attendanceTrend: () => mockResponse(attendanceTrend),
  shiftCoverage: () => mockResponse(shiftCoverage),
  total: () => mockResponse(totalWorkforce),
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
