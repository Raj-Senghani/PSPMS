
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, DashboardType } from '../types';
import { INITIAL_USERS } from '../constants';

interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pspms_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [authState, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem('pspms_auth');
    return saved ? JSON.parse(saved) : { user: null, isAuthenticated: false };
  });

  useEffect(() => {
    localStorage.setItem('pspms_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('pspms_auth', JSON.stringify(authState));
  }, [authState]);

  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user && user.isActive) {
      setAuthState({ user, isAuthenticated: true });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({ user: null, isAuthenticated: false });
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setUsers([...users, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
    if (authState.user?.id === id) {
      setAuthState(prev => ({
        ...prev,
        user: { ...prev.user!, ...updates }
      }));
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, users, addUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
