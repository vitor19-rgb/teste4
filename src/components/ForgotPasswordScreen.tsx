/**
 * ForgotPasswordScreen - Tela de Redefinição de Senha
 *
 * VERSÃO ATUALIZADA:
 * - Layout e CSS 100% baseados no AccessibilityEnhancedAuthScreen
 * - Mantém a lógica de redefinição de senha do Firebase.
 */

import React, { useState } from 'react';
import { auth } from '../core/firebaseConfig';
import { sendPasswordResetEmail } from "firebase/auth";

// Interface corrigida (da nossa conversa anterior)
interface ForgotPasswordScreenProps {
  onNavigate: (screen: 'auth' | string) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    sendPasswordResetEmail(auth, email)
      .then(() => {
        setMessage('Email enviado! Verifique sua caixa de entrada para redefinir a senha.');
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.code === 'auth/user-not-found') {
          setError('Nenhum usuário encontrado com este email.');
        } else {
          setError('Ocorreu um erro. Tente novamente.');
        }
        setIsLoading(false);
      });
  };

  // --- O JSX abaixo é uma cópia da estrutura do seu AccessibilityEnhancedAuthScreen ---
  //
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
            
            {/* Header */}
            <header className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 sm:mb-6 shadow-xl">
                <svg 
                  className="w-8 h-8 sm:w-10 sm:h-10 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {/* Ícone de "chave" ou "lock" pode ser melhor, mas vamos manter o padrão por enquanto */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Redefinir Senha
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Digite seu email para receber o link de redefinição
              </p>
            </header>

            {/* Form */}
            <main>
              <form 
                onSubmit={handleResetPassword} 
                className="space-y-5 sm:space-y-6"
                noValidate
                aria-label="Formulário de redefinição de senha"
              >
                {/* Email */}
                <div className="space-y-2">
                  <label 
                    htmlFor="email"
                    className="block text-sm font-semibold text-white"
                  >
                    Email de Cadastro
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    // Classes CSS copiadas do seu login
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                    placeholder="Digite seu email"
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? 'email-error' : undefined}
                  />
                  {/* Mensagem de Erro (vermelha) */}
                  {error && (
                    <div 
                      id="email-error"
                      className="text-red-300 text-sm mt-1 flex items-center"
                      role="alert"
                      aria-live="polite"
                    >
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                      {error}
                    </div>
                  )}
                  {/* Mensagem de Sucesso (azul/verde) */}
                  {message && (
                    <div 
                      id="email-success"
                      // Usando text-blue-300 para consistência
                      className="text-blue-300 text-sm mt-1 flex items-center"
                      role="status" // 'status' para mensagens de sucesso
                      aria-live="polite"
                    >
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {message}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  // Classes CSS copiadas do seu login
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-xl hover:shadow-blue-500/25 hover:scale-[1.02] transform disabled:opacity-75 disabled:scale-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Enviar Email de Redefinição'}
                </button>
              </form>

              {/* Link para Voltar ao Login */}
              <div className="mt-6 text-center">
                <p className="text-blue-100 text-sm">
                  Lembrou da senha?
                  <button
                    type="button"
                    onClick={() => onNavigate('auth')}
                    // Classes CSS copiadas do seu login
                    className="text-blue-300 hover:text-white font-semibold ml-2 underline transition-colors duration-300 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Fazer login
                  </button>
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};