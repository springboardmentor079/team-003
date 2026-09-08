import type { User, UserRole } from '../types';

/**
 * Demo accounts covering all six roles from the document. The Figma login
 * screen showed no roles at all, so role-based access is seeded here.
 */
export const users: User[] = [
  {
    id: 'u-001',
    fullName: 'Ravi Menon',
    email: 'admin@buildtrack.com',
    phone: '+91 98400 11221',
    role: 'Administrator',
    employeeId: 'BT-ADM-001',
    department: 'Platform Administration',
    status: 'Active',
    lastLogin: '2026-09-02 08:14',
    initials: 'RM',
  },
  {
    id: 'u-002',
    fullName: 'Anita Desai',
    email: 'manager@buildtrack.com',
    phone: '+91 98400 11222',
    role: 'Project Manager',
    employeeId: 'BT-PM-014',
    department: 'Project Delivery',
    status: 'Active',
    lastLogin: '2026-09-02 07:52',
    initials: 'AD',
  },
  {
    id: 'u-003',
    fullName: 'Karthik Iyer',
    email: 'engineer@buildtrack.com',
    phone: '+91 98400 11223',
    role: 'Site Engineer',
    employeeId: 'BT-SE-032',
    department: 'Site Operations',
    status: 'Active',
    lastLogin: '2026-09-02 06:40',
    initials: 'KI',
  },
  {
    id: 'u-004',
    fullName: 'Sunil Rathore',
    email: 'contractor@buildtrack.com',
    phone: '+91 98400 11224',
    role: 'Contractor',
    employeeId: 'BT-CON-058',
    department: 'Structural Contracting',
    status: 'Active',
    lastLogin: '2026-09-01 18:05',
    initials: 'SR',
  },
  {
    id: 'u-005',
    fullName: 'Meena Kumari',
    email: 'worker@buildtrack.com',
    phone: '+91 98400 11225',
    role: 'Worker',
    employeeId: 'BT-WRK-311',
    department: 'Finishing Crew',
    status: 'Active',
    lastLogin: '2026-09-02 06:05',
    initials: 'MK',
  },
  {
    id: 'u-006',
    fullName: 'Vikram Shah',
    email: 'client@buildtrack.com',
    phone: '+91 98400 11226',
    role: 'Client',
    employeeId: 'BT-CLI-007',
    department: 'Greenfield Developers',
    status: 'Active',
    lastLogin: '2026-08-31 15:22',
    initials: 'VS',
  },
  {
    id: 'u-007',
    fullName: 'Priya Nair',
    email: 'priya.nair@buildtrack.com',
    phone: '+91 98400 11227',
    role: 'Site Engineer',
    employeeId: 'BT-SE-041',
    department: 'MEP Services',
    status: 'Active',
    lastLogin: '2026-09-01 09:30',
    initials: 'PN',
  },
  {
    id: 'u-008',
    fullName: 'Arjun Pillai',
    email: 'arjun.pillai@buildtrack.com',
    phone: '+91 98400 11228',
    role: 'Project Manager',
    employeeId: 'BT-PM-019',
    department: 'Infrastructure',
    status: 'Inactive',
    lastLogin: '2026-08-12 11:10',
    initials: 'AP',
  },
];

/** Password accepted for every demo account when running on mock auth only. */
export const DEMO_PASSWORD = 'buildtrack123';

/**
 * Demo sign-in accounts. Credentials match the FastAPI backend seed
 * (`backend/app/seed.py`), so these log in against the real API.
 */
export interface DemoAccount {
  role: UserRole;
  email: string;
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'Administrator', email: 'admin@buildtrack.com', password: 'admin123' },
  { role: 'Project Manager', email: 'manager@buildtrack.com', password: 'manager123' },
  { role: 'Site Engineer', email: 'engineer@buildtrack.com', password: 'engineer123' },
  { role: 'Contractor', email: 'contractor@buildtrack.com', password: 'contractor123' },
  { role: 'Worker', email: 'worker@buildtrack.com', password: 'worker123' },
  { role: 'Client', email: 'client@buildtrack.com', password: 'client123' },
];
