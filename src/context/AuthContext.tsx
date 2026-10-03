import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthCredentials {
  idInstance: string;
  apiTokenInstance: string;
}

interface AuthContextType {
  credentials: AuthCredentials | null;
  login: (idInstance: string, apiTokenInstance: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [credentials, setCredentials] = useState<AuthCredentials | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('max_id_instance');
    const token = localStorage.getItem('max_api_token');
    if (id && token) {
      setCredentials({ idInstance: id, apiTokenInstance: token });
    }
  }, []);

  const login = (idInstance: string, apiTokenInstance: string) => {
    localStorage.setItem('max_id_instance', idInstance);
    localStorage.setItem('max_api_token', apiTokenInstance);
    setCredentials({ idInstance, apiTokenInstance });
  };

  const logout = () => {
    localStorage.removeItem('max_id_instance');
    localStorage.removeItem('max_api_token');
    setCredentials(null);
  };

  return (
    <AuthContext.Provider value={{ credentials, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
