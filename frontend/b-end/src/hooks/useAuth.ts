import { useState, useEffect, createContext, useContext } from 'react';
// import { useQuery, useMutation, useQueryClient } from 'react-query';
// import axios from 'axios';

// C-end uses simple local authentication for Gemini client
// No backend API needed for authentication

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// interface LoginCredentials {
//   email: string;
//   password: string;
// }

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple local storage management for C-end
const userManager = {
  getUser: (): User | null => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },
  setUser: (user: User) => localStorage.setItem('user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('user'),
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const userData = userManager.getUser();
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        userManager.removeUser();
        setUser(null);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // C-end uses simple mock authentication for demo purposes
      // In production, this could integrate with your preferred auth provider
      if (email && password) {
        const userData: User = {
          id: 'demo-user',
          username: email.split('@')[0],
          email: email,
          role: 'user'
        };
        setUser(userData);
        userManager.setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: 'Please enter email and password' };
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: 'Login failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    userManager.removeUser();
  };
  
  const isAuthenticated = !!user;
  
  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};

export { AuthContext };