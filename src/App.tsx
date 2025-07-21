/**
 * OrçaMais - MVP Sistema Multiusuário com Acessibilidade WCAG 2.1
 * Aplicação SPA para controle financeiro pessoal
 * VERSÃO ESTENDIDA COM NOVAS FUNCIONALIDADES
 */

import React, { useState, useEffect } from 'react';
import dataManager from './core/DataManager';
import { LandingScreen } from './components/LandingScreen';
import { AccessibilityEnhancedAuthScreen } from './components/AccessibilityEnhancedAuthScreen';
import { AccessibilityEnhancedMainScreen } from './components/AccessibilityEnhancedMainScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { DreamsScreen } from './components/DreamsScreen';

// Import accessibility styles
import './styles/accessibility.css';

type AppScreen = 'loading' | 'landing' | 'auth' | 'main' | 'summary' | 'dreams';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('loading');
  const [user, setUser] = useState(null);

  // useEffect para parar a leitura de voz ao mudar de tela
  useEffect(() => {
    if (window.accessibilityManager && window.accessibilityManager.isReading) {
      window.accessibilityManager.stopVoiceReading();
    }
  }, [currentScreen]);

  // useEffect para simular carregamento inicial e aplicar tema
  useEffect(() => {
    setTimeout(() => {
      if (dataManager.isLoggedIn()) {
        const currentUser = dataManager.getCurrentUser();
        setUser(currentUser);
        // Aplica o tema do usuário logado
        dataManager.setUserTheme(currentUser?.settings?.theme || 'light');
        setCurrentScreen('main');
      } else {
        setCurrentScreen('landing');
      }
    }, 2000);
  }, []);

  const handleGetStarted = () => {
    setCurrentScreen('auth');
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    // Aplica o tema do usuário recém-autenticado
    dataManager.setUserTheme(userData?.settings?.theme || 'light');
    setCurrentScreen('main');
  };

  const handleNavigate = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'loading':
        const backgroundPatternSvg = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";
        
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: `url("${backgroundPatternSvg}")` }}
            ></div>
            
            {/* Floating Elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-20 w-24 h-24 bg-cyan-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>

            <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
              <div className="text-center max-w-lg w-full">
                {/* Logo */}
                <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 sm:mb-8 shadow-2xl animate-pulse">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 sm:mb-6">
                  Orça<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Mais</span>
                </h1>
                
                <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 font-light">
                  Carregando sua experiência financeira...
                </p>
                
                {/* Loading Animation */}
                <div className="flex space-x-2 justify-center mb-8 sm:mb-12" role="status" aria-label="Carregando">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                      aria-hidden="true"
                    />
                  ))}
                </div>

                {/* Developer and Project Info */}
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
                      <span className="text-xs text-blue-200">Todas as funcionalidades ativas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'landing':
        return <LandingScreen onGetStarted={handleGetStarted} />;

      case 'auth':
        return <AccessibilityEnhancedAuthScreen onAuthSuccess={handleAuthSuccess} />;

      case 'main':
        return <AccessibilityEnhancedMainScreen onNavigate={handleNavigate} />;

      case 'summary':
        return <SummaryScreen onNavigate={handleNavigate} />;

      case 'dreams':
        return <DreamsScreen onNavigate={handleNavigate} />;

      default:
        return <div>Tela não encontrada</div>;
    }
  };

  return (
    <div className="app-container" role="application" aria-label="OrçaMais - Controle Financeiro Pessoal">
      {renderScreen()}
    </div>
  );
};

export default App;

