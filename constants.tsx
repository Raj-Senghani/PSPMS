
import { DashboardType, User } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: '1',
    firstName: 'Admin',
    lastName: 'Master',
    username: 'admin',
    password: 'password123',
    roles: ['Administrator'],
    assignedDashboards: [DashboardType.MASTER],
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    firstName: 'Sales',
    lastName: 'Manager',
    username: 'sales01',
    password: 'password123',
    roles: ['Sales Head'],
    assignedDashboards: [DashboardType.SALES_TEAM],
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    firstName: 'Security',
    lastName: 'Officer',
    username: 'sec01',
    password: 'password123',
    roles: ['Security Head'],
    assignedDashboards: [DashboardType.SECURITY],
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const DASHBOARD_ROUTES: Record<DashboardType, string> = {
  [DashboardType.SALES_TEAM]: '/sales',
  [DashboardType.INVENTORY]: '/inventory',
  [DashboardType.ACCOUNTING]: '/accounting',
  [DashboardType.PRODUCTION]: '/production',
  [DashboardType.DISPATCH]: '/dispatch',
  [DashboardType.SECURITY]: '/security',
  [DashboardType.MASTER]: '/master',
  [DashboardType.STATUS_OF_TASK]: '/tasks',
};
