// Em: src/components/AccessibilityEnhancedAuthScreen.tsx
// (Esta é a tua versão atual, que já contém o "isLoading" e o "Esqueceu a Senha")

/**
 * Accessibility Enhanced AuthScreen
 * Design profissional corporativo com WCAG 2.1 compliance
 *
 * VERSÃO ATUALIZADA:
 * - Mantém 100% do CSS/HTML e funções de acessibilidade originais.
 * - Adiciona o link "Esqueceu a senha?" (Passo 3).
 * - Integra login/cadastro com Firebase (Passo 4).
 * - CORREÇÃO: Recebe 'initialMode' para corrigir bug de navegação.
 */

import React, { useState, useEffect, useRef } from 'react';
import { validateEmail, validatePassword } from '../utils/formatters';

import { auth } from '../core/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';


// --- Interface de Props (Já inclui 'onNavigate' e 'initialMode') ---
interface AuthScreenProps {
  onAuthSuccess: (userData: any) => void;
  onNavigate: (screen: 'forgotPassword' | string) => void;
  initialMode?: 'login' | 'register'; 
}

export const AccessibilityEnhancedAuthScreen: React.FC<AuthScreenProps> = ({ 
  onAuthSuccess, 
  onNavigate,
  initialMode = 'login' 
}) => {

  // O estado 'isLoginMode' agora começa com base na prop
  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login');
  
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
  
  // --- O ESTADO DE CARREGAMENTO QUE PROCURAVAS ---
  // Este estado 'isLoading' já existe no teu código atual.
  const [isLoading, setIsLoading] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isLoginMode]);

  const clearErrors = () => {
    setErrors({ name: '', email: '', password: '' });
  };

  const announceError = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    let hasErrors = false;
    const newErrors = { name: '', email: '', password: '' };

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
      hasErrors = true;
    }

    if (!isLoginMode && !validatePassword(formData.password)) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      hasErrors = true;
    }

    if (!isLoginMode && (!formData.name || formData.name.length < 2)) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      
      const errorMessages = Object.values(newErrors).filter(msg => msg).join('. ');
      announceError(`Erro no formulário: ${errorMessages}`);
      
      const firstErrorField = Object.keys(newErrors).find(key => newErrors[key as keyof typeof newErrors]);
      if (firstErrorField && formRef.current) {
        const field = formRef.current.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement;
        if (field) {
          field.focus();
        }
      }
      
      return;
    }

    // --- AQUI COMEÇA O CARREGAMENTO ---
    setIsLoading(true); 
    
    if (isLoginMode) {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // Sucesso
      setIsLoading(false); // <-- Termina o carregamento
      announceError('Login realizado com sucesso');
      onAuthSuccess(userCredential.user);

    } catch (error: any) {
      // Erro
      setIsLoading(false); // <-- Termina o carregamento
      let message = 'Erro ao fazer login.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Email ou senha inválidos.';
      }
      setErrors({ ...errors, email: message });
      announceError(`Erro ao fazer login: ${message}`);
    }
  };

  const handleRegister = async () => {
    try {
      // 1. Criamos o usuário
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // 2. Atualizamos o perfil dele com o NOME
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: formData.name
        });
      }

      // Sucesso
      setIsLoading(false); // <-- Termina o carregamento
      announceError('Conta criada com sucesso');
      onAuthSuccess({ ...userCredential.user, displayName: formData.name });

    } catch (error: any) {
      // Erro
      setIsLoading(false); // <-- Termina o carregamento
      let message = 'Erro ao criar conta.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este email já está sendo usado.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha é muito fraca.';
      }
      setErrors({ ...errors, email: message });
      announceError(`Erro ao criar conta: ${message}`);
    }
  };

  const handleModeToggle = () => {
    setIsLoginMode(!isLoginMode);
    clearErrors();
    setFormData({ name: '', email: '', password: '' });
    announceError(isLoginMode ? 'Modo de cadastro ativado' : 'Modo de login ativado');
  };

  // --- O JSX (Layout) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* (O teu layout e ícones originais estão todos aqui...) */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
            {/* Header */}
            <header className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 sm:mb-6 shadow-xl">
                {/* O Teu Ícone Original */}
                <svg 
                  className="w-8 h-8 sm:w-10 sm:h-10 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {isLoginMode ? 'Acesso à Plataforma' : 'Criar Conta Profissional'}
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                {isLoginMode ? 'Entre na sua conta OrçaMais' : 'Junte-se à plataforma profissional'}
              </p>
            </header>

            {/* Form */}
            <main>
              <form 
                ref={formRef}
                onSubmit={handleSubmit} 
                className="space-y-5 sm:space-y-6"
                noValidate
                aria-label={isLoginMode ? 'Formulário de login' : 'Formulário de cadastro'}
              >
                {/* Nome (apenas no cadastro) */}
                {!isLoginMode && (
                  <div className="space-y-2">
                    <label 
                      htmlFor="name"
                      className="block text-sm font-semibold text-white"
                    >
                      Nome Completo
                    </label>
                    <input
                      ref={!isLoginMode ? firstInputRef : undefined}
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                      placeholder="Digite seu nome completo"
                      maxLength={50}
                      aria-invalid={errors.name ? 'true' : 'false'}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                      autoComplete="name"
                      disabled={isLoading}
                    />
                    {errors.name && (
                      <div 
                        id="name-error"
                        className="text-red-300 text-sm mt-1 flex items-center"
                        role="alert"
                        aria-live="polite"
                      >
                        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        {errors.name}
                      </div>
                    )}
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <label 
                    htmlFor="email"
                    className="block text-sm font-semibold text-white"
                  >
                    Email Corporativo
                  </label>
                  <input
                    ref={isLoginMode ? firstInputRef : undefined}
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                    placeholder="Digite seu email"
                    maxLength={70}
                    required
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    autoComplete="email"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <div 
                      id="email-error"
                      className="text-red-300 text-sm mt-1 flex items-center"
                      role="alert"
                      aria-live="polite"
                    >
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                      {errors.email}
                    </div>
                  )}
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <label 
                    htmlFor="password"
                    className="block text-sm font-semibold text-white"
                  >
                    Senha Segura
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                    placeholder="Digite sua senha"
                    maxLength={50}
                    required
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error password-help' : 'password-help'}
                    autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <div 
                      id="password-error"
                      className="text-red-300 text-sm mt-1 flex items-center"
                      role="alert"
                      aria-live="polite"
                    >
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                      {errors.password}
                    </div>
                  )}
                  {!isLoginMode && (
                    <p 
                      id="password-help"
                      className="text-blue-200 text-xs mt-1"
                    >
                      Mínimo 6 caracteres para segurança corporativa
                    </p>
                  )}
                </div>

                {/* Link "Esqueceu a senha?" (JÁ INCLUÍDO) */}
                {isLoginMode && (
                  <div className="text-right text-sm">
                    <button
                      type="button"
                      onClick={() => onNavigate('forgotPassword')}
                      className="font-semibold text-blue-300 hover:text-white underline transition-colors duration-300 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                )}


                {/* Botão Submit (COM O LOADING) */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-xl hover:shadow-blue-500/25 hover:scale-[1.02] transform disabled:opacity-75 disabled:scale-100"
                  aria-describedby="submit-help"
                  disabled={isLoading}
                >
                  {/* Este é o texto de carregamento que tu procuravas */}
                  {isLoading ? 'Carregando...' : (isLoginMode ? 'Acessar Plataforma' : 'Criar Conta Profissional')}
                </button>
                <div id="submit-help" className="sr-only">
                  {isLoginMode ? 'Clique para fazer login' : 'Clique para criar sua conta'}
                </div>
              </form>

              {/* Toggle Mode */}
              <div className="mt-6 text-center">
                <p className="text-blue-100 text-sm">
                  {isLoginMode ? 'Novo na plataforma?' : 'Já tem uma conta?'}
                  <button
                    type="button"
                    onClick={handleModeToggle}
                    className="text-blue-300 hover:text-white font-semibold ml-2 underline transition-colors duration-300 disabled:opacity-50"
                    aria-label={isLoginMode ? 'Alternar para modo de cadastro' : 'Alternar para modo de login'}
                    disabled={isLoading}
                  >
                    {isLoginMode ? 'Criar conta profissional' : 'Fazer login'}
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