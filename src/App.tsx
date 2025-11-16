// src/App.tsx
// ✅ Versão final com tela de loading bonita e lógica 100% corrigida
// ✅ Tempo de loading aumentado para 5 segundos

import React, { useState, useEffect } from 'react';
import dataManager from './core/DataManager';
import { LandingScreen } from './components/LandingScreen';
import { AccessibilityEnhancedAuthScreen } from './components/AccessibilityEnhancedAuthScreen';
import { AccessibilityEnhancedMainScreen } from './components/AccessibilityEnhancedMainScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { DreamsScreen } from './components/DreamsScreen';
import { InvestmentsScreen } from './components/InvestmentsScreen';
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
import './styles/accessibility.css';

type AppScreen =
  | 'loading'
  | 'landing'
  | 'auth'
  | 'main'
  | 'summary'
  | 'dreams'
  | 'investments'
  | 'forgotPassword';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('loading');
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // ---------- CHECAGEM INICIAL ----------
  useEffect(() => {
    const checkUser = () => {
      const currentUser = dataManager.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setCurrentScreen('main'); // usuário logado → dashboard
      } else {
        const hasSeenLanding = localStorage.getItem('hasSeenLanding');
        if (hasSeenLanding) {
          setAuthMode('login');
          setCurrentScreen('auth'); // não logado mas já visitou → tela de login
        } else {
          setCurrentScreen('landing'); // primeira vez → landing page
        }
      }
    };

    const timer = setTimeout(() => {
      checkUser();
    }, 5000); // MODIFICADO: tempo da tela de loading (5 segundos)

    const handleAuthChange = () => checkUser();
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // ---------- SINCRONIZAÇÃO DE USUÁRIO ----------
  useEffect(() => {
    const handleDataChange = () => {
      setUser(dataManager.getCurrentUser());
    };
    window.addEventListener('datachanged', handleDataChange);
    return () => {
      window.removeEventListener('datachanged', handleDataChange);
    };
  }, []);

  // ---------- LOGIN ----------
  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setCurrentScreen('main'); // ✅ vai direto pro dashboard, sem loading
  };

  // ---------- LOGOUT ----------
  const handleLogout = () => {
    dataManager.logout();
    setUser(null);
    setCurrentScreen('loading'); // mostra loading
    setTimeout(() => {
      setAuthMode('login');
      setCurrentScreen('auth'); // vai para tela de login
    }, 5000); // MODIFICADO: tempo de loading no logout (5 segundos)
  };

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenLanding', 'true');
    setCurrentScreen('auth');
  };

  // ---------- NAVEGAÇÃO ENTRE TELAS ----------
  const handleNavigate = (screen: string) => {
    if (screen === 'register') {
      setAuthMode('register');
      setCurrentScreen('auth');
    } else if (screen === 'auth') {
      setAuthMode('login');
      setCurrentScreen('auth');
    } else if (screen === 'logout') {
      handleLogout();
    } else {
      setCurrentScreen(screen as AppScreen);
    }
  };

  // ---------- TELA DE CARREGAMENTO (BONITA DO ANTIGO) ----------
  const renderLoadingScreen = () => {
    const backgroundPatternSvg =
      "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url("${backgroundPatternSvg}")` }}
        ></div>

        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-cyan-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-lg w-full">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 sm:mb-8 shadow-2xl animate-pulse">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                ></path>
              </svg>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 sm:mb-6">
              Orça
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Mais
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 font-light">
              Carregando sua experiência financeira...
            </p>

            <div
              className="flex space-x-2 justify-center mb-8 sm:mb-12"
              role="status"
              aria-label="Carregando"
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                  aria-hidden="true"
                />
              ))}
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm font-semibold text-blue-300 mb-2">
                    Desenvolvido por
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-white">
                    Vitor Rafael de Almeida
                  </p>
                </div>

                <div className="border-t border-white/20 pt-4">
                  <p className="text-sm text-blue-100 text-center mb-2">
                    Projeto de TCC - FETEPS
                  </p>
                  <div className="inline-flex items-center justify-center w-full">
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Versão Completa
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-3 pt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-200">
                    Todas as funcionalidades ativas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------- RENDERIZAÇÃO DAS TELAS ----------
  const renderScreen = () => {
    switch (currentScreen) {
      case 'loading':
        return renderLoadingScreen();

      case 'landing':
        return <LandingScreen onGetStarted={handleGetStarted} />;

      case 'auth':
        return (
          <AccessibilityEnhancedAuthScreen
            onAuthSuccess={handleAuthSuccess}
            onNavigate={handleNavigate}
            initialMode={authMode}
          />
        );

      case 'forgotPassword':
        return <ForgotPasswordScreen onNavigate={handleNavigate} />;

      case 'main':
        return <AccessibilityEnhancedMainScreen onNavigate={handleNavigate} />;

      case 'summary':
        return <SummaryScreen onNavigate={handleNavigate} />;

      case 'dreams':
        return <DreamsScreen onNavigate={handleNavigate} />;

      case 'investments':
        return <InvestmentsScreen onNavigate={handleNavigate} />;

      default:
        return <div>Tela não encontrada</div>;
    }
  };

  return (
    <div
      className="app-container"
      role="application"
      aria-label="OrçaMais Aplicação de Finanças"
    >
      {renderScreen()}
    </div>
  );
};

export default App;
