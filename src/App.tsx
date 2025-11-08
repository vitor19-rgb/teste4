// Em: src/App.tsx
// (Versão 100% atualizada para corrigir a navegação do "Criar Conta")

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

// O tipo de AppScreen não precisa mudar. Vamos tratar 'register'
// como um "alias" para a tela 'auth'
type AppScreen = 'loading' | 'landing' | 'auth' | 'main' | 'summary' | 'dreams' | 'investments' | 'forgotPassword';


const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('loading');
  const [user, setUser] = useState<any>(null);

  // ▼▼▼ INÍCIO DA MODIFICAÇÃO (1/3) ▼▼▼
  // Novo estado para controlar o modo da tela de autenticação
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  // ▲▲▲ FIM DA MODIFICAÇÃO (1/3) ▲▲▲

  useEffect(() => {
    const checkUser = () => {
      const currentUser = dataManager.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setCurrentScreen('main');
      } else {
        const hasSeenLanding = localStorage.getItem('hasSeenLanding');
        if (hasSeenLanding) {
          setCurrentScreen('auth');
        } else {
          setCurrentScreen('landing');
        }
      }
    };

    checkUser();
    
    const handleAuthChange = () => checkUser();
    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const handleDataChange = () => {
      // Força a atualização do usuário
      setUser(dataManager.getCurrentUser());
    };
    window.addEventListener('datachanged', handleDataChange);
    return () => {
      window.removeEventListener('datachanged', handleDataChange);
    };
  }, []);


  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setCurrentScreen('main');
  };

  const handleLogout = () => {
    dataManager.logout();
    setUser(null);
    setCurrentScreen('auth');
    setAuthMode('login'); // Reseta para login ao sair
  };

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenLanding', 'true');
    setCurrentScreen('auth');
  };

  // ▼▼▼ INÍCIO DA MODIFICAÇÃO (2/3) ▼▼▼
  // A função de navegação agora entende o 'register'
  const handleNavigate = (screen: string) => {
    // Se o "Esqueci a Senha" nos mandar para 'register'...
    if (screen === 'register') {
      setAuthMode('register'); // 1. Define o modo que queremos
      setCurrentScreen('auth');  // 2. Navega para a tela de autenticação
    } 
    // Se qualquer outra tela nos mandar para 'auth' (ex: Voltar do "Esqueci a Senha")
    else if (screen === 'auth') {
      setAuthMode('login');   // 1. Garante que o modo é 'login'
      setCurrentScreen('auth'); // 2. Navega para a tela de autenticação
    } 
    // Para todas as outras telas (main, summary, etc.)
    else {
      setCurrentScreen(screen as AppScreen);
    }
  };
  // ▲▲▲ FIM DA MODIFICAÇÃO (2/3) ▲▲▲

  const renderScreen = () => {
    switch (currentScreen) {
      case 'loading':
        return (
          <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
            <div className="text-center text-white">
              <div role="status">
                <svg 
                  aria-hidden="true" 
                  className="inline w-10 h-10 text-slate-500 animate-spin fill-blue-500" 
                  viewBox="0 0 100 101" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 28.001 72.5987 9.68114 50 9.68114C27.4013 9.68114 9.08144 28.001 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span className="sr-only">Carregando...</span>
              </div>
              <p className="mt-4 text-lg font-semibold">Carregando sua plataforma...</p>
            </div>
          </div>
        );

      case 'landing':
        return <LandingScreen onGetStarted={handleGetStarted} />;

      // ▼▼▼ INÍCIO DA MODIFICAÇÃO (3/3) ▼▼▼
      // Agora passamos a prop 'initialMode' para o componente
      case 'auth':
        return <AccessibilityEnhancedAuthScreen 
                  onAuthSuccess={handleAuthSuccess} 
                  onNavigate={handleNavigate}
                  initialMode={authMode} // <-- Passa o modo ('login' ou 'register')
               />;
      // ▲▲▲ FIM DA MODIFICAÇÃO (3/3) ▲▲▲

      // O 'case register' não é necessário, pois a lógica
      // em 'handleNavigate' já o direciona para o 'case auth'.

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
    <div className="app-container" role="application" aria-label="OrçaMais Aplicação de Finanças">
      {renderScreen()}
    </div>
  );
};

export default App;