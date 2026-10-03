import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, ShieldCheck } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idInstance.trim() || !apiTokenInstance.trim()) {
      setError('Пожалуйста, заполните оба поля');
      return;
    }
    setError('');
    login(idInstance.trim(), apiTokenInstance.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#e7ebf0]">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Вход в MAX Chat</h2>
          <p className="text-sm text-gray-500 mt-2">Используйте учетные данные из личного кабинета GREEN-API</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">idInstance</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <ShieldCheck size={18} />
              </span>
              <input
                type="text"
                value={idInstance}
                onChange={(e) => setIdInstance(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tgActive focus:border-transparent outline-none transition-all"
                placeholder="Например: 110174XXXX"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">apiTokenInstance</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <KeyRound size={18} />
              </span>
              <input
                type="password"
                value={apiTokenInstance}
                onChange={(e) => setApiTokenInstance(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tgActive focus:border-transparent outline-none transition-all"
                placeholder="Введите ваш токен"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-tgActive text-white font-medium rounded-lg hover:bg-[#267bb7] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tgActive"
          >
            Войти в личный кабинет
          </button>
        </form>
      </div>
    </div>
  );
};
