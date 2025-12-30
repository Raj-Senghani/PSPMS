
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
  phoneNumber?: string;
  roles: string[];
  assignedDashboards: string[];
  isActive: boolean;
  isRevocable: boolean;
  createdAt: string;
  vehicleNumber?: string;
  // Security enhancements
  isMasterAdmin?: boolean; // The primary/original admin
  isMasterLocked?: boolean; // If secondary master access is revoked
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export enum RequestType {
  DELETE_MEMBER = 'DELETE_MEMBER',
  EDIT_ADMIN = 'EDIT_ADMIN',
  MASTER_ACCESS = 'MASTER_ACCESS'
}

export interface AdminRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  type: RequestType;
  targetId?: string;
  targetName?: string;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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
  phoneNumber?: string;
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
