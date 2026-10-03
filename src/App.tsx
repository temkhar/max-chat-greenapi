import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './features/auth/LoginScreen';
import { MainLayout } from './features/layout/MainLayout';

const AppContent: React.FC = () => {
  const { credentials } = useAuth();

  // Если ключи API не введены, принудительно показываем экран авторизации
  if (!credentials) {
    return <LoginScreen />;
  }

  // Если авторизован — пускаем в мессенджер
  return <MainLayout />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
