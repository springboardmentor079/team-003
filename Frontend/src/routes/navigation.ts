import type { NavItem } from '../types';

/**
 * Canonical application navigation.
 *
 * The three Figma screens each showed a *different* sidebar, with invented
 * entries ("Project Grid", "Site Logistics", "Resource Map", "Technical
 * Docs", "Logistics"). This list is rebuilt from the document's twelve
 * modules; the Analytics screen's sidebar was closest and is the visual
 * reference. "Budget & Cost" (module 11) was missing from every Figma
 * sidebar and is restored here.
 */
export const primaryNav: NavItem[] = [
  { label: 'Overview', to: '/app/overview', icon: 'bi-grid-1x2' },
  { label: 'Projects', to: '/app/projects', icon: 'bi-diagram-3' },
  { label: 'Site Progress', to: '/app/site-progress', icon: 'bi-clipboard-data' },
  {
    label: 'Resources',
    to: '/app/resources',
    icon: 'bi-truck-front',
    roles: ['Administrator', 'Project Manager', 'Site Engineer', 'Contractor'],
  },
  {
    label: 'Inventory',
    to: '/app/inventory',
    icon: 'bi-box-seam',
    roles: ['Administrator', 'Project Manager', 'Site Engineer', 'Contractor'],
  },
  {
    label: 'Workforce',
    to: '/app/workforce',
    icon: 'bi-people',
    roles: ['Administrator', 'Project Manager', 'Site Engineer', 'Contractor'],
  },
  {
    label: 'Procurement',
    to: '/app/procurement',
    icon: 'bi-cart3',
    roles: ['Administrator', 'Project Manager', 'Contractor'],
  },
  {
    label: 'Budget & Cost',
    to: '/app/budget',
    icon: 'bi-cash-coin',
    roles: ['Administrator', 'Project Manager', 'Client'],
  },
  {
    label: 'Analytics',
    to: '/app/analytics',
    icon: 'bi-graph-up-arrow',
    roles: ['Administrator', 'Project Manager', 'Client'],
  },
  { label: 'Reports', to: '/app/reports', icon: 'bi-file-earmark-bar-graph' },
  { label: 'Notifications', to: '/app/notifications', icon: 'bi-bell' },
];

/** Administration section — document module 9, "Admin Dashboard". */
export const secondaryNav: NavItem[] = [
  {
    label: 'User Management',
    to: '/app/users',
    icon: 'bi-person-badge',
    roles: ['Administrator'],
  },
  { label: 'Settings', to: '/app/settings', icon: 'bi-gear' },
];

/** Marketing site navigation, from the Figma landing page top bar. */
export const publicNav = [
  { label: 'Platform', to: '/#platform' },
  { label: 'Projects', to: '/#modules' },
  { label: 'Site Progress', to: '/#modules' },
  { label: 'Analytics', to: '/#analytics' },
  { label: 'Resources', to: '/#modules' },
];
