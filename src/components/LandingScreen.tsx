/**
 * LandingScreen - Tela inicial de apresentação do OrçaMais
 * Atualizada com design premium, novo copy persuasivo e logo limpa (sem brilho).
 */

import React from 'react';

// Define que esta tela recebe uma função para ser ativada ao clicar no botão
interface LandingScreenProps {
  onGetStarted: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onGetStarted }) => {
  return (
    // Fundo mantido com o gradiente original, que traz uma sensação corporativa de confiança
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern - Detalhes sutis de bolinhas ao fundo */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Efeitos Flutuantes (luzes ao fundo para profundidade) */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-cyan-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        <div className="max-w-6xl mx-auto text-center">
          
          {/* Seção de Cabeçalho (Hero Section) */}
          <div className="mb-14 sm:mb-20 mt-8">
            {/* Logo Customizada - EFEITO DE BRILHO REMOVIDO AQUI */}
            <div className="inline-flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 mb-6 sm:mb-8 transform hover:scale-105 transition-all duration-500">
              <img 
                src="/icone.png" 
                alt="Logo OrçaMais" 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Título Principal */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold text-white mb-6 tracking-tight">
              Orça<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Mais</span>
            </h1>
            
            {/* Subtítulo de Impacto (Novo Copy Persuasivo) */}
            <p className="text-lg sm:text-2xl md:text-3xl text-blue-100/90 font-light max-w-3xl mx-auto leading-relaxed px-4">
              Assuma o controle absoluto do seu dinheiro e transforme sua gestão financeira com a plataforma mais inteligente do mercado.
            </p>
          </div>

          {/* Grade de Benefícios (Features Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16 max-w-5xl mx-auto px-4">
            
            {/* Benefício 1 */}
            <div className="group bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)]">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Visão 360º</h3>
              <p className="text-blue-100/80 text-base leading-relaxed">
                Acompanhe cada centavo em tempo real. Categorização inteligente e gráficos detalhados para você saber exatamente para onde seu dinheiro vai.
              </p>
            </div>

            {/* Benefício 2 */}
            <div className="group bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(6,182,212,0.3)]">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Evolução Patrimonial</h3>
              <p className="text-blue-100/80 text-base leading-relaxed">
                Pare de apenas pagar contas. Crie metas reais, acompanhe a evolução do seu patrimônio e construa o futuro que você sempre desejou.
              </p>
            </div>

            {/* Benefício 3 */}
            <div className="group bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] md:col-span-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Privacidade Extrema</h3>
              <p className="text-blue-100/80 text-base leading-relaxed">
                Suas informações financeiras blindadas. Estrutura de ponta para garantir que seus dados sejam apenas seus, com máxima segurança.
              </p>
            </div>
          </div>

          {/* Seção de Botão e Call to Action (CTA) */}
          <div className="mb-12 px-4 flex flex-col items-center">
            <button
              onClick={onGetStarted}
              className="group relative inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xl font-bold px-12 py-5 rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] hover:-translate-y-1 transform ring-4 ring-white/10 hover:ring-white/30"
            >
              <span className="relative z-10 flex items-center">
                Desbloquear Meu Acesso
                <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </span>
            </button>
            
            <p className="text-blue-200/80 text-sm mt-6 font-medium tracking-wide">
              ✨ ACESSO IMEDIATO • RESULTADOS REAIS • 100% SEGURO
            </p>
          </div>

          {/* Indicadores de Confiança ao final da página */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-blue-200/60 text-sm font-medium px-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Dados Criptografados
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Ambiente Privado
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Tecnologia de Ponta
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};