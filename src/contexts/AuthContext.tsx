import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  login: (access_token: string, refresh_token: string, role: string, restaurant_id: string, email?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean; // Add loading state
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Start with loading true

  useEffect(() => {
    // Load user from localStorage on app start
    const savedUser = localStorage.getItem('restaurant_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Validate that the user data has the required fields
        if (userData.access_token && userData.refresh_token && userData.role && userData.restaurant_id) {
          setUser(userData);
          // Fix: Set axios default Authorization header on app start
          axios.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
        } else {
          // Clear invalid user data
          localStorage.removeItem('restaurant_user');
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('restaurant_user');
      }
    }
    
    // Set loading to false after attempting to restore user
    setIsAuthLoading(false);
  }, []);

  const login = (access_token: string, refresh_token: string, role: string, restaurant_id: string, email?: string) => {
    const userData: User = { 
      access_token, 
      refresh_token, 
      role, 
      restaurant_id, 
      email 
    };
    setUser(userData);
    localStorage.setItem('restaurant_user', JSON.stringify(userData));
    
    // Fix: Set axios default Authorization header on login
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('restaurant_user');
    
    // Fix: Clear axios default Authorization header on logout
    delete axios.defaults.headers.common['Authorization'];
    
    // Redirect to login page
    window.location.href = '/login';
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('restaurant_user', JSON.stringify(updatedUser));
      
      // Fix: Update axios header if access_token changed
      if (userData.access_token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
      }
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAuthLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};