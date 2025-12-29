
export enum DashboardType {
  SALES_TEAM = 'Sales Team',
  INVENTORY = 'Inventory',
  ACCOUNTING = 'Accounting',
  PRODUCTION = 'Production',
  DISPATCH = 'Dispatch',
  SECURITY = 'Security',
  MASTER = 'Master',
  STATUS_OF_TASK = 'Status of Task'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  password?: string;
  roles: string[];
  assignedDashboards: string[]; // Changed from DashboardType[] to support custom strings
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
