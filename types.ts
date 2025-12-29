
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
  phoneNumber?: string; // Contact tracking
  roles: string[];
  assignedDashboards: string[];
  isActive: boolean;
  createdAt: string;
  vehicleNumber?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export enum SecurityCategory {
  PERSON = 'Person',
  MATERIAL = 'Material'
}

export enum SecuritySubType {
  VISITOR = 'Visitor',
  STAFF = 'Staff',
  INPUT_VEHICLE = 'Input Material Vehicle',
  OUTPUT_VEHICLE = 'Output Material Vehicle',
  SCRAP_VEHICLE = 'Scrap Material Vehicle',
  RETURN_INPUT = 'Return Material Input',
  RETURN_OUTPUT = 'Return Material Output'
}

export enum SecurityStatus {
  IN = 'IN',
  OUT = 'OUT',
  OVERSTAY = 'OVERSTAY'
}

export interface SecurityEntry {
  id: string;
  category: SecurityCategory;
  subType: SecuritySubType;
  name: string;
  staffId?: string;
  phoneNumber?: string; // Contact tracking for entries
  vehiclePresence: boolean;
  vehicleNumber?: string;
  reason?: string;
  inTime: string;
  expectedOutTime?: string;
  outTime?: string;
  remarks?: string;
  photoUrl?: string;
  status: SecurityStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}
