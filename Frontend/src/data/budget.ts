import type { BudgetLine, Expense, SeriesPoint } from '../types';

/**
 * Budget & Cost Management — document module 11. The Figma has no screen for
 * this module at all, so it is built from the document's six cost categories.
 */
export const budgetLines: BudgetLine[] = [
  {
    id: 'bl-001',
    projectName: 'Green Valley Residency',
    category: 'Labor Cost',
    estimated: 1650000,
    actual: 1418000,
    variance: 232000,
    variancePercent: 14.1,
    status: 'Within Budget',
  },
  {
    id: 'bl-002',
    projectName: 'Green Valley Residency',
    category: 'Material Cost',
    estimated: 2200000,
    actual: 2094000,
    variance: 106000,
    variancePercent: 4.8,
    status: 'Near Limit',
  },
  {
    id: 'bl-003',
    projectName: 'Green Valley Residency',
    category: 'Equipment Cost',
    estimated: 780000,
    actual: 612000,
    variance: 168000,
    variancePercent: 21.5,
    status: 'Within Budget',
  },
  {
    id: 'bl-004',
    projectName: 'Green Valley Residency',
    category: 'Transportation Cost',
    estimated: 310000,
    actual: 186000,
    variance: 124000,
    variancePercent: 40.0,
    status: 'Within Budget',
  },
  {
    id: 'bl-005',
    projectName: 'Green Valley Residency',
    category: 'Maintenance Cost',
    estimated: 260000,
    actual: 118000,
    variance: 142000,
    variancePercent: 54.6,
    status: 'Within Budget',
  },
  {
    id: 'bl-006',
    projectName: 'Green Valley Residency',
    category: 'Administrative Cost',
    estimated: 300000,
    actual: 72000,
    variance: 228000,
    variancePercent: 76.0,
    status: 'Within Budget',
  },
  {
    id: 'bl-007',
    projectName: 'Alpha Tower Complex',
    category: 'Material Cost',
    estimated: 3100000,
    actual: 3268000,
    variance: -168000,
    variancePercent: -5.4,
    status: 'Over Budget',
  },
  {
    id: 'bl-008',
    projectName: 'Alpha Tower Complex',
    category: 'Labor Cost',
    estimated: 2400000,
    actual: 2296000,
    variance: 104000,
    variancePercent: 4.3,
    status: 'Near Limit',
  },
  {
    id: 'bl-009',
    projectName: 'Sector 7 Logistics Hub',
    category: 'Equipment Cost',
    estimated: 900000,
    actual: 984000,
    variance: -84000,
    variancePercent: -9.3,
    status: 'Over Budget',
  },
  {
    id: 'bl-010',
    projectName: 'Nexus Bridge Refit',
    category: 'Labor Cost',
    estimated: 720000,
    actual: 214000,
    variance: 506000,
    variancePercent: 70.3,
    status: 'Within Budget',
  },
];

/** Expense tracking — document module 11, feature (iii). */
export const expenses: Expense[] = [
  {
    id: 'ex-001',
    expenseCode: 'EXP-5510',
    projectName: 'Green Valley Residency',
    category: 'Material Cost',
    description: 'TMT reinforcement bars against PO-2261',
    amount: 2473800,
    incurredOn: '2026-09-02',
    approvedBy: 'Anita Desai',
    status: 'Approved',
  },
  {
    id: 'ex-002',
    expenseCode: 'EXP-5511',
    projectName: 'Green Valley Residency',
    category: 'Labor Cost',
    description: 'Fortnightly wage disbursement — 128 personnel',
    amount: 1642000,
    incurredOn: '2026-08-31',
    approvedBy: 'Anita Desai',
    status: 'Approved',
  },
  {
    id: 'ex-003',
    expenseCode: 'EXP-5512',
    projectName: 'Sector 7 Logistics Hub',
    category: 'Maintenance Cost',
    description: 'Mobile crane overhaul — advance payment',
    amount: 422500,
    incurredOn: '2026-09-01',
    approvedBy: 'Arjun Pillai',
    status: 'Pending',
  },
  {
    id: 'ex-004',
    expenseCode: 'EXP-5513',
    projectName: 'Delta Phase 2 Residential',
    category: 'Transportation Cost',
    description: 'Aggregate haulage — 14 trips',
    amount: 84000,
    incurredOn: '2026-08-29',
    approvedBy: 'Anita Desai',
    status: 'Approved',
  },
  {
    id: 'ex-005',
    expenseCode: 'EXP-5514',
    projectName: 'Municipal Civic Hall',
    category: 'Administrative Cost',
    description: 'Statutory approval and permit fees',
    amount: 118000,
    incurredOn: '2026-08-27',
    approvedBy: 'Anita Desai',
    status: 'Approved',
  },
  {
    id: 'ex-006',
    expenseCode: 'EXP-5515',
    projectName: 'Nexus Bridge Refit',
    category: 'Equipment Cost',
    description: 'Crawler crane monthly hire',
    amount: 296000,
    incurredOn: '2026-08-25',
    approvedBy: 'Arjun Pillai',
    status: 'Rejected',
  },
];

/** Spend split by the document's six cost categories (portfolio-wide). */
export const costByCategory: SeriesPoint[] = [
  { label: 'Labor Cost', value: 4128000 },
  { label: 'Material Cost', value: 5362000 },
  { label: 'Equipment Cost', value: 1596000 },
  { label: 'Transportation Cost', value: 486000 },
  { label: 'Maintenance Cost', value: 542000 },
  { label: 'Administrative Cost', value: 286000 },
];

/** Monthly planned vs actual spend, portfolio-wide (₹). */
export const monthlySpend = {
  labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  planned: [1420000, 1580000, 1710000, 1660000, 1840000, 1920000, 1880000],
  actual: [1385000, 1612000, 1668000, 1724000, 1796000, 2018000, 1197000],
};

export const totalBudgetAllocated = 19100000;
export const totalBudgetSpent = 12400000;
export const totalBudgetRemaining = totalBudgetAllocated - totalBudgetSpent;
