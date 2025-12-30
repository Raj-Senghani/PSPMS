
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, DashboardType } from '../types';
import { INITIAL_USERS } from '../constants';

interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Lazy initialization from storage to ensure session persistence on refresh
    const saved = localStorage.getItem('pspms_auth');
    try {
      return saved ? JSON.parse(saved) : { user: null, isAuthenticated: false };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  });

  // Initialize and Sync Users Database
  useEffect(() => {
    const savedUsers = localStorage.getItem('pspms_users');
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
    setIsLoading(false);
  }, []);

  // Sync Auth State to storage whenever it changes (for standard state updates)
  useEffect(() => {
    localStorage.setItem('pspms_auth', JSON.stringify(authState));
  }, [authState]);

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('pspms_users', JSON.stringify(updatedUsers));
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    // 1. Artificial latency to maintain the high-tech "Establishing Connection" UI feel
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 2. Fetch the latest user list directly from storage to avoid stale state bugs during initialization
    const currentUsersJson = localStorage.getItem('pspms_users');
    const currentUsers: User[] = currentUsersJson ? JSON.parse(currentUsersJson) : INITIAL_USERS;
    
    const user = currentUsers.find(u => u.username === username && u.password === password);
    
    if (user && user.isActive) {
      const newAuthState = { user, isAuthenticated: true };
      
      // 3. Update React State
      setAuthState(newAuthState);
      
      // 4. CRITICAL: Synchronously save to localStorage immediately. 
      // This ensures the LoginPage's setTimeout(..., 500) redirect logic finds the data it needs.
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
    
    // Update active session if the current user profile is the one being modified
    if (authState.user?.id === id) {
      const updatedUser = { ...authState.user, ...updates };
      const newAuthState = { ...authState, user: updatedUser };
      setAuthState(newAuthState);
      localStorage.setItem('pspms_auth', JSON.stringify(newAuthState));
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, users, addUser, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
