// Em: src/components/DreamsScreen.tsx
// (Versão 100% atualizada com correções de "Layout do Botão" e "Visibilidade da Barra")

import React, { useState, useEffect } from 'react';
import dataManager from '../core/DataManager';
import { formatCurrency, getCurrentPeriod } from '../utils/formatters';

interface DreamsScreenProps {
  onNavigate: (screen: string) => void;
}

interface Dream {
  id: string;
  name: string;
  totalValue: number;
  savedAmount: number;
  targetDate?: string;
  monthlyAmount?: number;
  calculationType: 'date' | 'monthly';
  createdAt: string;
}

export const DreamsScreen: React.FC<DreamsScreenProps> = ({ onNavigate }) => {
  const [dreams, setDreams] = useState<Dream[]>([]); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalValue: '',
    calculationType: 'date',
    targetDate: '',
    monthlyAmount: ''
  });
  const [calculationResult, setCalculationResult] = useState<any>(null);

  // --- Estados para o Modal de Contribuição ---
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    updateDreams();
  }, []);

  const updateDreams = () => {
    const userDreams = dataManager.getDreams();
    setDreams(userDreams);
  };

  // Esta função já inclui a correção para o bug de salvar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.totalValue) return;
    
    const dreamData: any = {
      name: formData.name,
      totalValue: parseFloat(formData.totalValue),
      calculationType: formData.calculationType as 'date' | 'monthly',
    };

    if (formData.targetDate) {
      dreamData.targetDate = formData.targetDate;
    }
    if (formData.monthlyAmount) {
      dreamData.monthlyAmount = parseFloat(formData.monthlyAmount);
    }

    const newDream = await dataManager.addDream(dreamData);

    if (newDream) {
      updateDreams();
      setShowAddModal(false);
      resetFormData();
    } else {
      alert('Erro ao salvar o sonho. Tente novamente.');
    }
  };


  // Esta função já inclui a correção para devolver o dinheiro
  const handleDelete = async (e: React.MouseEvent, dreamId: string) => {
    e.stopPropagation(); 

    const dreamToCancel = dreams.find(d => d.id === dreamId);
    if (!dreamToCancel) return; 

    if (window.confirm(`Tem certeza que deseja apagar o sonho "${dreamToCancel.name}"?`)) {
      
      const savedAmount = dreamToCancel.savedAmount; 
      const dreamName = dreamToCancel.name; 

      const success = await dataManager.removeDream(dreamId);
      
      if (success) {
        if (savedAmount > 0) {
          try {
            await dataManager.addTransaction({
              description: `Valor devolvido (sonho cancelado): ${dreamName}`,
              amount: savedAmount,
              type: 'income',
              category: 'Sonhos', 
              date: new Date().toISOString().split('T')[0],
            });
          } catch (error) {
            console.error("Erro ao devolver o dinheiro do sonho:", error);
            alert("O sonho foi apagado, mas ocorreu um erro ao devolver o dinheiro ao seu saldo.");
          }
        }
        
        updateDreams();
        window.dispatchEvent(new CustomEvent('datachanged')); 

      } else {
        alert('Erro ao apagar o sonho.');
      }
    }
  };


  const resetFormData = () => {
    setFormData({
      name: '',
      totalValue: '',
      calculationType: 'date',
      targetDate: '',
      monthlyAmount: ''
    });
    setCalculationResult(null);
  };

  useEffect(() => {
    // ... (A lógica de cálculo de datas e valores permanece a mesma) ...
    const total = parseFloat(formData.totalValue);
    const date = formData.targetDate;
    const monthly = parseFloat(formData.monthlyAmount);

    if (formData.calculationType === 'date' && date && total > 0) {
      const today = new Date();
      const target = new Date(date);
      target.setUTCHours(0, 0, 0, 0); 
      today.setUTCHours(0, 0, 0, 0);

      const diffTime = target.getTime() - today.getTime();
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); 

      if (diffMonths > 0) {
        const amountPerMonth = total / diffMonths;
        setCalculationResult({
          message: `Você precisa guardar ${formatCurrency(amountPerMonth)} por mês para atingir ${formatCurrency(total)} em ${diffMonths} mes(es).`
        });
      } else {
        setCalculationResult({
          message: 'A data alvo deve ser no futuro.'
        });
      }
    }
    else if (formData.calculationType === 'monthly' && monthly > 0 && total > 0) {
      const monthsNeeded = Math.ceil(total / monthly);
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + monthsNeeded);
      setCalculationResult({
        message: `Você atingirá ${formatCurrency(total)} em ${monthsNeeded} mes(es) (em ${targetDate.toLocaleDateString('pt-BR')}), guardando ${formatCurrency(monthly)} por mês.`
      });
    }
    else {
      setCalculationResult(null);
    }
  }, [formData]);

  
  // --- Funções de Contribuição (sem alteração) ---

  const openContributionModal = (dream: Dream) => {
    setSelectedDream(dream);
    setIsContributionModalOpen(true);
    setContributionAmount('');
  };

  const closeContributionModal = () => {
    setIsContributionModalOpen(false);
    setSelectedDream(null);
    setContributionAmount('');
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedDream) return;
    
    const amount = parseFloat(contributionAmount);
    if (amount <= 0 || !amount) {
      alert("Por favor, insira um valor positivo.");
      return;
    }
    
    const currentPeriod = getCurrentPeriod();
    const summary = dataManager.getFinancialSummary(currentPeriod);
    if (summary.balance < amount) {
      alert("Saldo insuficiente para esta contribuição.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await dataManager.addTransaction({
        description: `Contribuição Sonho: ${selectedDream.name}`,
        amount: amount,
        type: 'expense',
        category: 'Sonhos',
        date: new Date().toISOString().split('T')[0],
      });
      
      const newSavedAmount = selectedDream.savedAmount + amount;
      await dataManager.updateDreamSavings(selectedDream.id, newSavedAmount);

      window.dispatchEvent(new CustomEvent('datachanged'));
      updateDreams(); 
      
      closeContributionModal();

    } catch (error) {
      console.error("Erro ao adicionar contribuição:", error);
      alert("Não foi possível adicionar a contribuição.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // O padding 'p-5' (20px) foi mantido
  return (
    <div className="min-h-screen bg-slate-100 p-5">
      
      {/* Header (sem alteração) */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 order-2 sm:order-1">
          Simulador de Sonhos
        </h1>
        <div className="flex items-center w-full sm:w-auto order-1 sm:order-2">
    <button 
  onClick={() => onNavigate('main')}
  className="flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors px-3 py-2 rounded-xl hover:bg-blue-50 text-sm sm:-translate-x-[45px]"
>
  <svg 
    className="w-4 h-4" 
    style={{ marginRight: '4px' }} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="M15 19l-7-7 7-7"
    />
  </svg>
  Voltar
</button>


          
      <button
  onClick={() => {
    resetFormData();
    setShowAddModal(true);
  }}
  className="flex-1 sm:flex-none ml-auto bg-gradient-to-r from-purple-600 to-pink-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg hover:from-purple-700 hover:to-pink-800 transition-all duration-300 sm:-translate-x-[45px]"
>
  + Simular Novo Sonho
</button>


        </div>
      </header>
      
      {/* Lista de Sonhos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dreams.length === 0 && !showAddModal && (
          <div className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border-slate-200 text-center">
            <p className="text-slate-600 font-semibold">Nenhum sonho simulado ainda.</p>
            <p className="text-sm text-slate-500">Clique em "Simular Novo Sonho" para começar a planejar!</p>
          </div>
        )}

        {dreams.map((dream) => {
          const percentage = (dream.savedAmount / dream.totalValue) * 100;
          
          return (
            <div 
              key={dream.id} 
              className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-purple-300 transition-all relative group"
            >
             <button 
  onClick={(e) => handleDelete(e, dream.id)}
  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center 
             opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-200"
  aria-label={`Apagar sonho ${dream.name}`}
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
  </svg>
</button>


              <h3 className="text-lg font-bold text-purple-900 mb-2 truncate">{dream.name}</h3>
              <p className="text-sm text-slate-600">
                Objetivo: <span className="font-semibold text-purple-700">{formatCurrency(dream.totalValue)}</span>
              </p>
              <p className="text-sm text-slate-600">
                Guardado: <span className="font-semibold text-green-600">{formatCurrency(dream.savedAmount)}</span>
              </p>

              {/* (▼▼▼ CORREÇÃO BUG 2: Barra de Progresso ▼▼▼) */}
              {/* Trocamos 'bg-slate-200' (claro) por 'bg-slate-300' (mais aparente) */}
              <div className="w-full bg-slate-300 rounded-full h-4 mt-4 mb-2 overflow-hidden border border-purple-200">
              {/* (▲▲▲ FIM DA CORREÇÃO BUG 2 ▲▲▲) */}
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-right text-sm font-semibold text-purple-800">{percentage.toFixed(1)}%</p>

              <button
                onClick={() => openContributionModal(dream)}
                className="mt-5 w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow
                           hover:bg-purple-700 transition-all text-sm
                           disabled:bg-slate-300"
                disabled={dream.savedAmount >= dream.totalValue}
              >
                {dream.savedAmount >= dream.totalValue ? 'Sonho Atingido!' : '+ Adicionar Valor'}
              </button>
            </div>
          );
        })}
      </div>


      {/* Modal de Adicionar Sonho (Com o Bug 1 corrigido) */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-scale"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Simular Novo Sonho</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* (Campos do formulário - sem alteração) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dreamName" className="block text-sm font-medium text-slate-700 mb-1">Nome do Sonho</label>
                  <input type="text" id="dreamName" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-xl" placeholder="Ex: Viagem ao Japão" required />
                </div>
                <div>
                  <label htmlFor="totalValue" className="block text-sm font-medium text-slate-700 mb-1">Valor Total (R$)</label>
                  <input type="number" id="totalValue" value={formData.totalValue} onChange={(e) => setFormData({...formData, totalValue: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-xl" placeholder="Ex: 20000" required />
                </div>
              </div>
              <fieldset>
                <legend className="block text-sm font-medium text-slate-700 mb-2">Como deseja calcular?</legend>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input type="radio" id="calcTypeDate" name="calculationType" value="date" checked={formData.calculationType === 'date'} onChange={(e) => setFormData({...formData, calculationType: e.target.value})} className="h-4 w-4 text-purple-600" />
                    <label htmlFor="calcTypeDate" className="ml-2 text-sm text-slate-600">Por Data Alvo</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="calcTypeMonthly" name="calculationType" value="monthly" checked={formData.calculationType === 'monthly'} onChange={(e) => setFormData({...formData, calculationType: e.target.value})} className="h-4 w-4 text-purple-600" />
                    <label htmlFor="calcTypeMonthly" className="ml-2 text-sm text-slate-600">Por Valor Mensal</label>
                  </div>
                </div>
              </fieldset>
              {formData.calculationType === 'date' ? (
                <div>
                  <label htmlFor="targetDate" className="block text-sm font-medium text-slate-700 mb-1">Data Alvo</label>
                  <input type="date" id="targetDate" value={formData.targetDate} onChange={(e) => setFormData({...formData, targetDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
                </div>
              ) : (
                <div>
                  <label htmlFor="monthlyAmount" className="block text-sm font-medium text-slate-700 mb-1">Valor Mensal (R$)</label>
                  <input type="number" id="monthlyAmount" value={formData.monthlyAmount} onChange={(e) => setFormData({...formData, monthlyAmount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-xl" placeholder="Ex: 500" />
                </div>
              )}
              {calculationResult && (
                <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg">
                  <h4 className="flex items-center text-base font-semibold text-purple-800 mb-1">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Seu Plano Financeiro
                  </h4>
                  <p className="text-purple-700 text-xs sm:text-sm leading-relaxed">
                    {calculationResult.message}
                  </p>
                </div>
              )}

              {/* (▼▼▼ CORREÇÃO BUG 1: Layout dos Botões do Modal ▼▼▼) */}
              {/* Trocamos 'justify-end' (direita) por 'justify-start' (esquerda) */}
              <div className="flex justify-start gap-3 pt-4">
              {/* (▲▲▲ FIM DA CORREÇÃO BUG 1 ▲▲▲) */}
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  // O padding 'px-6 py-3' foi mantido
                  className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-xl hover:from-purple-700 hover:to-pink-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
                  disabled={!calculationResult || !calculationResult.message.includes('Você')}
                >
                  Salvar Sonho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      

      {/* Modal de Contribuição (sem alteração) */}
      {isContributionModalOpen && selectedDream && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in-scale"
          onClick={closeContributionModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Adicionar Valor</h2>
            <p className="text-sm text-slate-600 mb-4">
              Para o sonho: <span className="font-semibold text-purple-700">{selectedDream.name}</span>
            </p>
            
            <form onSubmit={handleContributionSubmit} className="space-y-4">
              <div>
                <label htmlFor="contributionAmount" className="block text-sm font-medium text-slate-700 mb-1">Valor a adicionar (R$)</label>
                <input 
                  type="number" 
                  id="contributionAmount" 
                  value={contributionAmount} 
                  onChange={(e) => setContributionAmount(e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl" 
                  placeholder="Ex: 50,00" 
                  required 
                  step="0.01"
                  min="0.01"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">Este valor sairá do seu saldo principal.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeContributionModal}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm sm:text-base"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-xl hover:from-purple-700 hover:to-pink-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base
                             disabled:bg-slate-300 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar Adição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};