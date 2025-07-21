/**
 * DreamsScreen - Tela de Simulador de Sonhos
 * Design profissional corporativo com WCAG 2.1 compliance
 * NOVA FUNCIONALIDADE
 * CORREÇÃO: Responsividade aprimorada para novos elementos
 */

import React, { useState, useEffect } from 'react';
import dataManager from '../core/DataManager';
import { formatCurrency } from '../utils/formatters';

interface DreamsScreenProps {
  onNavigate: (screen: string) => void;
}

export const DreamsScreen: React.FC<DreamsScreenProps> = ({ onNavigate }) => {
  const [dreams, setDreams] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalValue: '',
    calculationType: 'date',
    targetDate: '',
    monthlyAmount: ''
  });
  const [calculationResult, setCalculationResult] = useState<any>(null);

  useEffect(() => {
    updateDreams();
  }, []);

  const updateDreams = () => {
    const userDreams = dataManager.getDreams();
    setDreams(userDreams);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.totalValue) return;

    const totalValue = parseFloat(formData.totalValue);
    if (totalValue <= 0) return;

    let dreamData: any = {
      name: formData.name,
      totalValue,
      calculationType: formData.calculationType
    };

    if (formData.calculationType === 'date' && formData.targetDate) {
      dreamData.targetDate = formData.targetDate;
      
      // Calcular valor mensal necessário
      const targetDate = new Date(formData.targetDate);
      const currentDate = new Date();
      const monthsDiff = (targetDate.getFullYear() - currentDate.getFullYear()) * 12 + 
                        (targetDate.getMonth() - currentDate.getMonth());
      
      if (monthsDiff > 0) {
        dreamData.monthlyAmount = totalValue / monthsDiff;
      }
    } else if (formData.calculationType === 'monthly' && formData.monthlyAmount) {
      const monthlyAmount = parseFloat(formData.monthlyAmount);
      if (monthlyAmount > 0) {
        dreamData.monthlyAmount = monthlyAmount;
        
        // Calcular data estimada
        const monthsNeeded = Math.ceil(totalValue / monthlyAmount);
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + monthsNeeded);
        dreamData.targetDate = targetDate.toISOString().split('T')[0];
      }
    }

    const result = dataManager.addDream(dreamData);
    if (result) {
      updateDreams();
      setFormData({
        name: '',
        totalValue: '',
        calculationType: 'date',
        targetDate: '',
        monthlyAmount: ''
      });
      setCalculationResult(null);
      setShowAddModal(false);
    }
  };

  const calculatePreview = () => {
    if (!formData.totalValue) return;

    const totalValue = parseFloat(formData.totalValue);
    if (totalValue <= 0) return;

    let result: any = { totalValue };

    if (formData.calculationType === 'date' && formData.targetDate) {
      const targetDate = new Date(formData.targetDate);
      const currentDate = new Date();
      const monthsDiff = (targetDate.getFullYear() - currentDate.getFullYear()) * 12 + 
                        (targetDate.getMonth() - currentDate.getMonth());
      
      if (monthsDiff > 0) {
        result.monthsNeeded = monthsDiff;
        result.monthlyAmount = totalValue / monthsDiff;
        result.message = `Você precisará economizar ${formatCurrency(result.monthlyAmount)} por mês para alcançar "${formData.name}" (${formatCurrency(totalValue)}) até ${new Date(formData.targetDate).toLocaleDateString('pt-BR')}.`;
      } else {
        result.message = 'A data alvo deve ser no futuro.';
      }
    } else if (formData.calculationType === 'monthly' && formData.monthlyAmount) {
      const monthlyAmount = parseFloat(formData.monthlyAmount);
      if (monthlyAmount > 0) {
        result.monthsNeeded = Math.ceil(totalValue / monthlyAmount);
        result.monthlyAmount = monthlyAmount;
        
        const years = Math.floor(result.monthsNeeded / 12);
        const months = result.monthsNeeded % 12;
        
        let timeText = '';
        if (years > 0) {
          timeText = `${years} ano${years > 1 ? 's' : ''}`;
          if (months > 0) {
            timeText += ` e ${months} mês${months > 1 ? 'es' : ''}`;
          }
        } else {
          timeText = `${months} mês${months > 1 ? 'es' : ''}`;
        }
        
        result.message = `Você alcançará "${formData.name}" (${formatCurrency(totalValue)}) em aproximadamente ${timeText}, economizando ${formatCurrency(monthlyAmount)} por mês.`;
      }
    }

    setCalculationResult(result);
  };

  useEffect(() => {
    calculatePreview();
  }, [formData.totalValue, formData.targetDate, formData.monthlyAmount, formData.calculationType, formData.name]);

  const updateSavings = (dreamId: string, newAmount: number) => {
    dataManager.updateDreamSavings(dreamId, newAmount);
    updateDreams();
  };

  const deleteDream = (dreamId: string, dreamName: string) => {
    if (confirm(`Tem certeza que deseja excluir o sonho "${dreamName}"?`)) {
      dataManager.removeDream(dreamId);
      updateDreams();
    }
  };

  const getProgressPercentage = (saved: number, total: number) => {
    return Math.min((saved / total) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRemainingTime = (dream: any) => {
    if (!dream.targetDate) return null;
    
    const targetDate = new Date(dream.targetDate);
    const currentDate = new Date();
    const monthsDiff = (targetDate.getFullYear() - currentDate.getFullYear()) * 12 + 
                      (targetDate.getMonth() - currentDate.getMonth());
    
    if (monthsDiff <= 0) return 'Meta atingida!';
    
    const years = Math.floor(monthsDiff / 12);
    const months = monthsDiff % 12;
    
    if (years > 0) {
      return `${years} ano${years > 1 ? 's' : ''} ${months > 0 ? `e ${months} mês${months > 1 ? 'es' : ''}` : ''}`;
    }
    return `${months} mês${months > 1 ? 'es' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header com responsividade melhorada */}
        <header className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-6 border border-blue-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 flex items-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 mr-2 sm:mr-3 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
              <span className="hidden sm:inline">Simulador de Sonhos</span>
              <span className="sm:hidden">Meus Sonhos</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform text-sm min-w-0 flex-shrink-0"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span className="hidden sm:inline">Novo Sonho</span>
                <span className="sm:hidden">Novo</span>
              </button>

              <button
                onClick={() => onNavigate('main')}
                className="flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors px-3 sm:px-4 py-2 rounded-xl hover:bg-blue-50 text-sm min-w-0 flex-shrink-0"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Voltar
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
              Transforme seus sonhos em metas alcançáveis com planejamento financeiro inteligente
            </p>
          </div>
        </header>

        {/* Lista de Sonhos com responsividade melhorada */}
        <main>
          {dreams.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 border border-blue-100 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">Seus sonhos começam aqui!</h2>
              <p className="text-slate-600 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                Defina seus objetivos financeiros e descubra exatamente quanto precisa economizar para realizá-los. 
                Transforme sonhos em planos concretos.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Criar Meu Primeiro Sonho
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {dreams.map((dream) => {
                const progressPercentage = getProgressPercentage(dream.savedAmount, dream.totalValue);
                const remainingAmount = dream.totalValue - dream.savedAmount;
                const remainingTime = getRemainingTime(dream);
                
                return (
                  <div key={dream.id} className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-6 border border-blue-100 hover:shadow-3xl transition-all duration-300">
                    {/* Header do Card */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{dream.name}</h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1">
                          Meta: {formatCurrency(dream.totalValue)}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteDream(dream.id, dream.name)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-xl ml-2 flex-shrink-0"
                        aria-label={`Excluir sonho: ${dream.name}`}
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-700">Progresso</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800">{progressPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3">
                        <div 
                          className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${getProgressColor(progressPercentage)}`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Informações Financeiras */}
                    <div className="space-y-2 sm:space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-slate-600">Economizado:</span>
                        <span className="font-semibold text-green-700 text-xs sm:text-sm">{formatCurrency(dream.savedAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-slate-600">Restante:</span>
                        <span className="font-semibold text-red-700 text-xs sm:text-sm">{formatCurrency(remainingAmount)}</span>
                      </div>
                      {dream.monthlyAmount && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-slate-600">Por mês:</span>
                          <span className="font-semibold text-blue-700 text-xs sm:text-sm">{formatCurrency(dream.monthlyAmount)}</span>
                        </div>
                      )}
                      {remainingTime && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-slate-600">Tempo restante:</span>
                          <span className="font-semibold text-purple-700 text-xs sm:text-sm">{remainingTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Atualizar Valor Economizado */}
                    <div className="border-t border-slate-200 pt-4">
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                        Atualizar valor economizado
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs sm:text-sm">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={dream.savedAmount}
                            onBlur={(e) => {
                              const newAmount = parseFloat(e.target.value) || 0;
                              if (newAmount !== dream.savedAmount && newAmount >= 0) {
                                updateSavings(dream.id, newAmount);
                              }
                            }}
                            className="w-full pl-6 sm:pl-8 pr-2 sm:pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4 flex justify-center">
                      {progressPercentage >= 100 ? (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          Sonho Realizado!
                        </span>
                      ) : progressPercentage >= 75 ? (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                          🎯 Quase lá!
                        </span>
                      ) : progressPercentage >= 50 ? (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800">
                          💪 No caminho certo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-800">
                          🚀 Começando a jornada
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Modal Adicionar Sonho com responsividade melhorada */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">✨ Criar Novo Sonho</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Nome do Sonho */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nome do Sonho
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Ex: Viagem para Europa, Carro novo, Casa própria..."
                    required
                    maxLength={50}
                  />
                </div>

                {/* Valor Total */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Valor Total Necessário
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalValue}
                      onChange={(e) => setFormData({ ...formData, totalValue: e.target.value })}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                {/* Tipo de Cálculo */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Como você quer planejar?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <label className={`flex items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      formData.calculationType === 'date' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        value="date"
                        checked={formData.calculationType === 'date'}
                        onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-sm sm:text-base">📅 Por Data Alvo</div>
                        <div className="text-xs sm:text-sm text-slate-600">Defina quando quer alcançar</div>
                      </div>
                    </label>

                    <label className={`flex items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      formData.calculationType === 'monthly' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        value="monthly"
                        checked={formData.calculationType === 'monthly'}
                        onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-sm sm:text-base">💰 Por Valor Mensal</div>
                        <div className="text-xs sm:text-sm text-slate-600">Defina quanto pode guardar</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Campos Condicionais */}
                {formData.calculationType === 'date' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Data Alvo
                    </label>
                    <input
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                )}

                {formData.calculationType === 'monthly' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Valor que Pode Guardar por Mês
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.monthlyAmount}
                        onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Preview do Cálculo */}
                {calculationResult && calculationResult.message && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 sm:p-6">
                    <h4 className="font-bold text-purple-800 mb-2 flex items-center text-sm sm:text-base">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Seu Plano Financeiro
                    </h4>
                    <p className="text-purple-700 text-xs sm:text-sm leading-relaxed">
                      {calculationResult.message}
                    </p>
                  </div>
                )}

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-xl hover:from-purple-700 hover:to-pink-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
                    disabled={!calculationResult || !calculationResult.message}
                  >
                    Criar Sonho
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};