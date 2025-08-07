import React, { ReactNode, createContext, useContext } from 'react';
import { useAuth as useAuthHook, UseAuthReturn } from '../../hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

export const useAuth = (): UseAuthReturn => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthHook();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;