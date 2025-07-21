/**
 * AuthScreen - Tela de autenticação (Login/Cadastro)
 */

import React, { useState } from 'react';
import dataManager from '../core/DataManager';
import { validateEmail, validatePassword } from '../utils/formatters';

interface AuthScreenProps {
  onAuthSuccess: (userData: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: ''
  });

  const clearErrors = () => {
    setErrors({ name: '', email: '', password: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    let hasErrors = false;
    const newErrors = { name: '', email: '', password: '' };

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
      hasErrors = true;
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      hasErrors = true;
    }

    if (!isLoginMode && (!formData.name || formData.name.length < 2)) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    if (isLoginMode) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const handleLogin = () => {
    const result = dataManager.loginUser(formData.email, formData.password);
    
    if (result.success) {
      onAuthSuccess(result.user);
    } else {
      // Para demo, sempre permite login
      const registerResult = dataManager.registerUser({
        name: formData.email.split('@')[0],
        email: formData.email
      });
      
      if (registerResult.success) {
        onAuthSuccess(registerResult.user);
      } else {
        setErrors({ ...errors, email: 'Erro ao fazer login' });
      }
    }
  };

  const handleRegister = () => {
    const result = dataManager.registerUser({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });

    if (result.success) {
      onAuthSuccess(result.user);
    } else {
      setErrors({ ...errors, email: result.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {isLoginMode ? 'Entrar' : 'Criar Conta'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              {isLoginMode ? 'Acesse sua conta OrçaMais' : 'Junte-se ao OrçaMais'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Nome (apenas no cadastro) */}
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  placeholder="Digite seu nome completo"
                />
                {errors.name && (
                  <div className="text-red-600 text-xs sm:text-sm mt-1">{errors.name}</div>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                placeholder="Digite seu email"
                required
              />
              {errors.email && (
                <div className="text-red-600 text-xs sm:text-sm mt-1">{errors.email}</div>
              )}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                placeholder="Digite sua senha"
                required
              />
              {errors.password && (
                <div className="text-red-600 text-xs sm:text-sm mt-1">{errors.password}</div>
              )}
              {!isLoginMode && (
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              {isLoginMode ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-sm sm:text-base text-gray-600">
              {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                type="button"
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-blue-600 hover:text-blue-700 font-medium ml-1"
              >
                {isLoginMode ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>

          {/* Demo Info (apenas no login) */}
          {isLoginMode && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl">
              <p className="text-xs sm:text-sm text-blue-800 text-center">
                <strong>Demo:</strong> Crie sua conta ou use qualquer email/senha para testar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};