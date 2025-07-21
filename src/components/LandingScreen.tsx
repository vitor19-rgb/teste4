/**
 * LandingScreen - Tela inicial de apresentação do OrçaMais
 * Design profissional corporativo
 */

import React from 'react';

interface LandingScreenProps {
  onGetStarted: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-cyan-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12 sm:mb-16">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 sm:mb-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
              <svg className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 sm:mb-6">
              Orça<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Mais</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-blue-100 font-light max-w-4xl mx-auto leading-relaxed px-4">
              Plataforma profissional para gestão financeira inteligente
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 max-w-5xl mx-auto px-4">
            {/* Feature 1 */}
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Análise Avançada</h3>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                Relatórios detalhados e insights inteligentes para otimizar sua gestão financeira com precisão profissional.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Crescimento Sustentável</h3>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                Estratégias comprovadas e ferramentas profissionais para maximizar seus resultados financeiros a longo prazo.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl md:col-span-1">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Segurança Corporativa</h3>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                Proteção de nível empresarial com criptografia avançada e armazenamento local para máxima privacidade.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mb-8 sm:mb-12 px-4">
            <button
              onClick={onGetStarted}
              className="group relative inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-lg sm:text-xl font-bold px-8 sm:px-12 py-4 sm:py-5 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 hover:scale-105 transform"
            >
              <span className="relative z-10 flex items-center">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 mr-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Acessar Plataforma
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <p className="text-blue-200 text-sm sm:text-base mt-4 sm:mt-6 font-medium">
              ✨ Acesso gratuito • Interface profissional • Resultados imediatos
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-blue-200/80 text-xs sm:text-sm px-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Dados 100% Privados
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Funciona Offline
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Padrão Corporativo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};