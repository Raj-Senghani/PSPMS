
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, DashboardType, AdminRequest, RequestType } from '../types';
import { INITIAL_USERS } from '../constants';

interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  isLoading: boolean;
  // Request System
  requests: AdminRequest[];
  createRequest: (type: RequestType, targetId?: string, targetName?: string) => void;
  handleRequest: (requestId: string, approve: boolean) => void;
  lockUserMaster: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem('pspms_auth');
    try {
      return saved ? JSON.parse(saved) : { user: null, isAuthenticated: false };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  });

  useEffect(() => {
    const savedUsers = localStorage.getItem('pspms_users');
    const savedRequests = localStorage.getItem('pspms_requests');
    
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch {
        setUsers(INITIAL_USERS);
      }
    } else {
      localStorage.setItem('pspms_users', JSON.stringify(INITIAL_USERS));
      setUsers(INITIAL_USERS);
    }

    if (savedRequests) {
      try {
        setRequests(JSON.parse(savedRequests));
      } catch {
        setRequests([]);
      }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('pspms_auth', JSON.stringify(authState));
  }, [authState]);

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('pspms_users', JSON.stringify(updatedUsers));
  };

  const saveRequests = (updatedRequests: AdminRequest[]) => {
    setRequests(updatedRequests);
    localStorage.setItem('pspms_requests', JSON.stringify(updatedRequests));
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const currentUsersJson = localStorage.getItem('pspms_users');
    const currentUsers: User[] = currentUsersJson ? JSON.parse(currentUsersJson) : INITIAL_USERS;
    const user = currentUsers.find(u => u.username === username && u.password === password);
    
    if (user && user.isActive) {
      const newAuthState = { user, isAuthenticated: true };
      setAuthState(newAuthState);
      localStorage.setItem('pspms_auth', JSON.stringify(newAuthState));
      return true;
    }
    return false;
  };

  const logout = () => {
    const emptyAuth = { user: null, isAuthenticated: false };
    setAuthState(emptyAuth);
    localStorage.setItem('pspms_auth', JSON.stringify(emptyAuth));
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    const updated = [...users, newUser];
    saveUsers(updated);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const updated = users.map(u => u.id === id ? { ...u, ...updates } : u);
    saveUsers(updated);
    
    if (authState.user?.id === id) {
      const updatedUser = { ...authState.user, ...updates } as User;
      const newAuthState = { ...authState, user: updatedUser };
      setAuthState(newAuthState);
      localStorage.setItem('pspms_auth', JSON.stringify(newAuthState));
    }
  };

  const deleteUser = async (id: string) => {
    const updated = users.filter(u => u.id !== id);
    saveUsers(updated);
  };

  const createRequest = (type: RequestType, targetId?: string, targetName?: string) => {
    if (!authState.user) return;
    const newReq: AdminRequest = {
      id: Math.random().toString(36).substr(2, 9),
      fromUserId: authState.user.id,
      fromUserName: `${authState.user.firstName} ${authState.user.lastName}`,
      type,
      targetId,
      targetName,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };
    const updated = [newReq, ...requests];
    saveRequests(updated);

    // Auto-lock logic: If no response in 30 seconds, lock the user
    setTimeout(() => {
      const currentReqs = JSON.parse(localStorage.getItem('pspms_requests') || '[]');
      const targetReq = currentReqs.find((r: AdminRequest) => r.id === newReq.id);
      if (targetReq && targetReq.status === 'PENDING') {
        lockUserMaster(newReq.fromUserId);
        handleRequest(newReq.id, false);
      }
    }, 30000);
  };

  const handleRequest = (requestId: string, approve: boolean) => {
    const updated = requests.map(r => 
      r.id === requestId ? { ...r, status: approve ? 'APPROVED' : 'REJECTED' as any } : r
    );
    saveRequests(updated);
  };

  const lockUserMaster = (userId: string) => {
    updateUser(userId, { isMasterLocked: true });
  };

  return (
    <AuthContext.Provider value={{ 
      authState, login, logout, users, addUser, updateUser, deleteUser, isLoading, 
      requests, createRequest, handleRequest, lockUserMaster 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
