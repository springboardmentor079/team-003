import type { DualSeries, KpiMetric } from '../types';

/**
 * Portfolio progress, planned vs actual. Matches the Figma "Project
 * Performance" line chart; the Figma legend labelled the series only
 * "Actual"/"Planned", which is consistent with the document, so it is kept.
 */
export const portfolioPerformance: DualSeries = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  planned: [22, 46, 68, 90],
  actual: [19, 41, 63, 78],
};

/**
 * KPI strip on the Analytics screen. The Figma left these four cards empty,
 * so the metrics are taken from the document's Project Manager dashboard
 * (progress, budget utilisation, resource utilisation, workforce status).
 */
export const analyticsKpis: KpiMetric[] = [
  {
    id: 'kpi-progress',
    label: 'Project Progress',
    value: '68',
    unit: '%',
    caption: 'Portfolio average across 6 active projects',
    delta: '+3.2% vs last month',
    trend: 'up',
    progress: 68,
    accent: 'accent',
    icon: 'bi-graph-up-arrow',
  },
  {
    id: 'kpi-budget',
    label: 'Budget Utilization',
    value: '65',
    unit: '%',
    caption: '₹1.24 Cr spent of ₹1.91 Cr allocated',
    delta: 'Within plan',
    trend: 'flat',
    progress: 65,
    accent: 'green',
    icon: 'bi-cash-coin',
  },
  {
    id: 'kpi-resource',
    label: 'Resource Utilization',
    value: '84',
    unit: '%',
    caption: '25 of 32 assets currently allocated',
    delta: '+4.2% vs last month',
    trend: 'up',
    progress: 84,
    accent: 'accent',
    icon: 'bi-truck-front',
  },
  {
    id: 'kpi-attendance',
    label: 'Workforce Attendance',
    value: '92',
    unit: '%',
    caption: '1,910 personnel deployed across all sites',
    delta: '-2.0% vs last week',
    trend: 'down',
    progress: 92,
    accent: 'green',
    icon: 'bi-people',
  },
];

/**
 * KPI strip on the Overview screen. "Machine Utilization" in the Figma is
 * renamed to the document's term "Resource Utilization".
 */
export const overviewKpis: KpiMetric[] = [
  {
    id: 'ov-progress',
    label: 'Site Progress',
    value: '78',
    unit: '%',
    caption: 'Green Valley Residency',
    delta: '+2.4%',
    trend: 'up',
    progress: 78,
    accent: 'green',
    icon: 'bi-graph-up-arrow',
  },
  {
    id: 'ov-budget',
    label: 'Budget Tracker',
    value: '₹45.0L',
    caption: 'of ₹55.0L allocated',
    delta: '82% used',
    trend: 'flat',
    progress: 82,
    accent: 'accent',
    icon: 'bi-wallet2',
  },
  {
    id: 'ov-resource',
    label: 'Resource Utilization',
    value: '84',
    unit: '%',
    caption: '25 of 32 assets allocated',
    delta: 'Optimal',
    trend: 'flat',
    progress: 84,
    accent: 'green',
    icon: 'bi-truck-front',
  },
  {
    id: 'ov-workforce',
    label: 'Workforce Active',
    value: '128',
    unit: 'personnel',
    caption: 'On site today across 3 shifts',
    delta: '+12',
    trend: 'up',
    progress: 92,
    accent: 'accent',
    icon: 'bi-people',
  },
];

/**
 * Admin dashboard KPIs — document module 9, "Admin Dashboard":
 * user management, project monitoring, system analytics, reports management.
 */
export const adminKpis: KpiMetric[] = [
  {
    id: 'ad-users',
    label: 'Registered Users',
    value: '8',
    caption: 'Across all six roles',
    delta: '7 active',
    trend: 'flat',
    accent: 'blue',
    icon: 'bi-person-badge',
  },
  {
    id: 'ad-projects',
    label: 'Projects Monitored',
    value: '8',
    caption: '5 in progress, 1 delayed, 1 on hold',
    delta: '+1 this quarter',
    trend: 'up',
    accent: 'accent',
    icon: 'bi-diagram-3',
  },
  {
    id: 'ad-reports',
    label: 'Reports Generated',
    value: '6',
    caption: 'This reporting period',
    delta: '4 ready',
    trend: 'flat',
    accent: 'green',
    icon: 'bi-file-earmark-bar-graph',
  },
  {
    id: 'ad-alerts',
    label: 'Open Alerts',
    value: '3',
    caption: 'Unread notifications requiring action',
    delta: '2 high severity',
    trend: 'down',
    accent: 'red',
    icon: 'bi-bell',
  },
];
