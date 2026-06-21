// Em: src/components/AccessibilityEnhancedAuthScreen.tsx

/**
 * Accessibility Enhanced AuthScreen
 * Design profissional corporativo com WCAG 2.1 compliance
 *
 * VERSÃO ATUALIZADA:
 * - Mantém 100% do CSS/HTML e funções de acessibilidade originais.
 * - Adiciona o link "Esqueceu a senha?".
 * - Integra login/cadastro com Firebase.
 * - Logótipo redimensionado (mais pequeno e subtil).
 * - NOVO: Adicionado Login Social com Google.
 */

import React, { useState, useEffect, useRef } from 'react';
import { validateEmail, validatePassword } from '../utils/formatters';

import { auth } from '../core/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,     // Ferramenta do Google adicionada
  signInWithPopup         // Ferramenta de abrir a janela do Google adicionada
} from 'firebase/auth';


// --- Interface de Props ---
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

  // Login normal com Email e Senha
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
      
      setIsLoading(false);
      announceError('Login realizado com sucesso');
      onAuthSuccess(userCredential.user);

    } catch (error: any) {
      setIsLoading(false);
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
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: formData.name
        });
      }

      setIsLoading(false);
      announceError('Conta criada com sucesso');
      onAuthSuccess({ ...userCredential.user, displayName: formData.name });

    } catch (error: any) {
      setIsLoading(false);
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

  // --- NOVA FUNÇÃO: LOGIN COM GOOGLE ---
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    clearErrors();
    try {
      const provider = new GoogleAuthProvider();
      // Abre a janelinha do Google para o usuário escolher a conta
      const userCredential = await signInWithPopup(auth, provider);
      
      setIsLoading(false);
      announceError('Acesso com Google realizado com sucesso');
      onAuthSuccess(userCredential.user);

    } catch (error: any) {
      setIsLoading(false);
      console.error("Erro Google:", error);
      // Se o usuário fechar a janela antes de logar, podemos ignorar ou mostrar aviso
      if (error.code !== 'auth/popup-closed-by-user') {
        setErrors({ ...errors, email: 'Erro ao conectar com o Google. Tente novamente.' });
        announceError('Erro ao conectar com o Google.');
      }
    }
  };

  const handleModeToggle = () => {
    setIsLoginMode(!isLoginMode);
    clearErrors();
    setFormData({ name: '', email: '', password: '' });
    announceError(isLoginMode ? 'Modo de cadastro ativado' : 'Modo de login ativado');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background e Efeitos */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
            {/* Header */}
            <header className="text-center mb-6 sm:mb-8">
              
              {/* Logótipo Customizado do OrçaMais */}
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 transform hover:scale-105 transition-all duration-300">
                <img 
                  src="/icone.png" 
                  alt="Logo OrçaMais" 
                  className="w-full h-full object-contain"
                />
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

                {/* Link "Esqueceu a senha?" */}
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

                {/* Botão Submit Original */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-xl hover:shadow-blue-500/25 hover:scale-[1.02] transform disabled:opacity-75 disabled:scale-100"
                  aria-describedby="submit-help"
                  disabled={isLoading}
                >
                  {isLoading ? 'A Carregar...' : (isLoginMode ? 'Acessar Plataforma' : 'Criar Conta Profissional')}
                </button>
                <div id="submit-help" className="sr-only">
                  {isLoginMode ? 'Clique para fazer login' : 'Clique para criar sua conta'}
                </div>
              </form>

              {/* Divisor Visual para o Google */}
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="px-4 text-blue-200/60 text-sm font-medium">ou continue com</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              {/* Botão de Login com Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>

              {/* Toggle Mode (Criar Conta / Login) */}
              <div className="mt-8 text-center">
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