import { createContext, useContext, useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'CALIBRATION_ENGINEER' | 'TECHNICIAN' | 'CUSTOMER_SERVICE' | 'USER';
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const [tokenRefreshTimeout, setTokenRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const refreshInterval = 30 * 60 * 1000; // 30 minutes
      const timeout = setTimeout(() => {
        refreshUser();
      }, refreshInterval);
      setTokenRefreshTimeout(timeout);
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [isAuthenticated, user]);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      handleAuthError(error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch (error) {
        handleAuthError(error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleAuthError = (error: unknown) => {
    const errorMessage = error instanceof AxiosError 
      ? error.response?.data?.message || error.message
      : error instanceof Error ? error.message : 'Unknown error';

    console.error('Authentication error occurred:', {
      error,
      status: error instanceof AxiosError ? error.response?.status : null,
      message: errorMessage,
      timestamp: new Date().toISOString()
    });

    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        console.error('Session expired - forcing logout');
      } else {
        toast.error(error.response?.data?.message || 'Authentication error');
        console.error('Authentication error:', error.response?.data?.message);
      }
    }
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear();
    
    // Clear token refresh timeout
    if (tokenRefreshTimeout) {
      clearTimeout(tokenRefreshTimeout);
      setTokenRefreshTimeout(null);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      toast.success(`Welcome back, ${user.name}!`);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Login failed');
      } else {
        toast.error('Login failed');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
      toast.success('You have been logged out');
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}