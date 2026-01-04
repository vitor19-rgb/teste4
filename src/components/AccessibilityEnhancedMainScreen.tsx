// Em: src/components/AccessibilityEnhancedMainScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';

import dataManager from '../core/DataManager';
import { formatCurrency, getCurrentPeriod, formatPeriod, getPreviousPeriod, getNextPeriod } from '../utils/formatters';

interface MainScreenProps {
  onNavigate: (screen: string) => void;
}

export const AccessibilityEnhancedMainScreen: React.FC<MainScreenProps> = ({ onNavigate }) => {
  const [user, setUser] = useState(dataManager.getCurrentUser());
  const [currentPeriod, setCurrentPeriod] = useState(getCurrentPeriod());
  const [summary, setSummary] = useState<any>(null);
  const [editingIncome, setEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState('');
  
  // Estados do Formulário
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'Outros'
  });

  // ▼▼▼ ESTADOS PARA RECORRÊNCIA ▼▼▼
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDay, setRecurrenceDay] = useState('');
  const [recurrenceLimit, setRecurrenceLimit] = useState('');
  // ▲▲▲▲▲▲

  const [showSpendingAlert, setShowSpendingAlert] = useState(false);

  const categories = dataManager.getCategories();

  // O ROBÔ: Verifica transações automáticas ao iniciar e ao mudar de período
  useEffect(() => {
    if (typeof dataManager.processRecurringTransactions === 'function') {
       dataManager.processRecurringTransactions().then(() => {
         updateSummary();
       });
    }
  }, [currentPeriod]); // Adicionado currentPeriod para re-verificar ao navegar

  const updateSummary = useCallback(() => {
    const newSummary = dataManager.getFinancialSummary(currentPeriod);
    setSummary(newSummary);
    
    if (newSummary && newSummary.monthlyIncome > 0) {
      const spendingPercentage = (newSummary.totalExpenses / newSummary.monthlyIncome) * 100;
      setShowSpendingAlert(spendingPercentage >= 90);
    } else {
      setShowSpendingAlert(false);
    }
  }, [currentPeriod]);

  useEffect(() => {
    if (user) {
      updateSummary();
    }
  }, [currentPeriod, user, updateSummary]);

  useEffect(() => {
    const handleAuthChange = () => {
      const currentUser = dataManager.getCurrentUser();
      setUser(currentUser);
      if (currentUser?.profile?.name) {
        window.localStorage.setItem('userName', currentUser.profile.name);
      }
    };

    const handleThemeChange = () => {
        const themeValue = dataManager.getCurrentUser?.()?.settings?.theme;
        const newTheme = (themeValue === 'dark' || themeValue === 'light') ? themeValue : 'light';
        dataManager.setUserTheme(newTheme);
    };

    const handleDataChange = () => {
      updateSummary();
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('datachanged', handleDataChange);
    
    handleAuthChange();
    handleThemeChange();

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('datachanged', handleDataChange);
    };
  }, [updateSummary]);

  // Função auxiliar para formatar a data visualmente (DD/MM/AAAA)
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Como a data já vem YYYY-MM-DD do DataManager (string local),
      // podemos apenas separar e remontar para evitar conversões de timezone do Date()
      const [year, month, day] = dateString.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  // ▼▼▼ FUNÇÃO PARA RENDERIZAR OS BADGES (∞ ou 1/10) ▼▼▼
  const renderInstallmentBadge = (t: any) => {
    // Caso 1: Assinatura Infinita
    // (É recorrente E sem limite) OU (É filha de uma transação sem limite total)
    const isInfinite = (t.isRecurring && !t.recurrenceLimit) || 
                       (t.originalTransactionId && !t.installmentTotal && !t.isRecurring);

    if (isInfinite) {
        return (
            <span className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 border border-blue-200 dark:border-blue-700" title="Assinatura (Infinito)">
               ∞
            </span>
        );
    }

    // Caso 2: Parcelamento (X/Y)
    if (t.installmentTotal && t.installmentTotal > 0) {
        return (
            <span className="inline-flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 border border-purple-200 dark:border-purple-700">
               {t.installmentNumber}/{t.installmentTotal}
            </span>
        );
    }
    return null;
  };
  // ▲▲▲▲▲▲

  const handleAddTransaction = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;
    
    // --- LÓGICA DE DATA CORRIGIDA (SEM UTC) ---
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    
    // Verifica se estamos visualizando o mês atual. 
    // Se sim, usa o dia de hoje. Se não, usa o dia 01 do mês visualizado (para não sumir da lista).
    const currentMonthKey = `${y}-${m}`;
    const dayToUse = currentPeriod === currentMonthKey ? d : '01';
    
    // Formata YYYY-MM-DD localmente
    const dateToSend = `${currentPeriod}-${dayToUse}`;

    // --- LÓGICA DE RECORRÊNCIA ---
    // Se digitou dia, usa. Se não, usa o dia da data calculada.
    const recDay = isRecurring && recurrenceDay ? parseInt(recurrenceDay) : parseInt(dayToUse);
    // Se digitou limite, usa int. Se vazio, manda null (infinito).
    const limit = isRecurring && recurrenceLimit ? parseInt(recurrenceLimit) : null;

    const transactionData = { 
        ...formData, 
        date: dateToSend, 
        
        // Dados de Recorrência
        isRecurring,
        recurrenceDay: recDay,
        recurrenceLimit: limit,
        // recurrenceCurrent e lastGeneratedMonth são tratados automaticamente no DataManager
        // mas podemos passar explicitamente se necessário. O DataManager novo cuida disso.
    };
    
    const transaction = await dataManager.addTransaction(transactionData);
    
    if (transaction) {
      // Limpa formulário
      setFormData({ description: '', amount: '', type: 'expense', category: 'Outros' });
      setIsRecurring(false);
      setRecurrenceDay('');
      setRecurrenceLimit('');

      updateSummary();
    } else {
      alert('Erro ao adicionar transação.');
    }
  }, [formData, currentPeriod, isRecurring, recurrenceDay, recurrenceLimit, updateSummary]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      const success = await dataManager.removeTransaction(transactionId);
      if (success) {
        updateSummary();
      } else {
        alert('Erro ao excluir transação.');
      }
    }
  }, [updateSummary]);

  const handleIncomeEdit = useCallback(() => {
    setEditingIncome(true);
    setTempIncome(summary?.monthlyIncome?.toString() || '');
  }, [summary]);

  const handleIncomeSave = useCallback(async () => {
    const amount = parseFloat(tempIncome) || 0;
    const success = await dataManager.setMonthlyIncome(currentPeriod, amount);
    
    if (success) {
      setEditingIncome(false);
      updateSummary();
    } else {
      alert('Erro ao salvar a renda mensal.');
    }
  }, [tempIncome, currentPeriod, updateSummary]);

  const handleIncomeCancel = useCallback(() => {
    setEditingIncome(false);
    setTempIncome('');
  }, []);

  const handlePeriodChange = useCallback((newPeriod: string) => {
    setCurrentPeriod(newPeriod);
  }, []);

  const getSpendingPercentage = useCallback(() => {
    if (!summary || summary.monthlyIncome <= 0) return 0;
    return (summary.totalExpenses / summary.monthlyIncome) * 100;
  }, [summary]);

  const getDailyIncome = useCallback(() => {
    if (!summary || summary.monthlyIncome <= 0) return 0;
    return summary.monthlyIncome / 30;
  }, [summary]);

  const getAnnualIncome = useCallback(() => {
    if (!summary || summary.monthlyIncome <= 0) return 0;
    return summary.monthlyIncome * 12;
  }, [summary]);

  if (!user || !summary) return <div className="text-center p-10">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Alerta de Gastos */}
        {showSpendingAlert && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">
                  <strong>Atenção!</strong> Seus gastos atingiram {getSpendingPercentage().toFixed(1)}% da sua renda mensal. 
                  {getSpendingPercentage() >= 100 ? ' Você ultrapassou sua renda!' : ' Cuidado para não ultrapassar o orçamento!'}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowSpendingAlert(false)}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center flex-1 min-w-0">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full mr-3 flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className=" text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px] text-2xl font-bold text-gray-800 truncate">OrçaMais</h1>
                <p className="text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px] text-base text-gray-600 truncate">Olá, {user?.profile?.name}!</p>
              </div>
            </div>
            
            <div className="flex justify-center flex-wrap gap-2 mt-4 sm:mt-0">
              <button
                onClick={() => onNavigate('summary')}
                className="flex items-center justify-center px-4 py-2 min-w-[110px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-md transition"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Relatório</span>
              </button>

              <button
                onClick={() => onNavigate('dreams')}
                className="flex items-center justify-center px-4 py-2 min-w-[110px] bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium shadow-md transition"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span>Sonhos</span>
              </button>

              <button
                onClick={() => onNavigate('investments')}
                className="flex items-center justify-center px-4 py-2 min-w-[110px] bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium shadow-md transition"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                <span>Investimentos</span>
              </button>

              <button
                onClick={() => {
                  dataManager.logout();
                  onNavigate('auth');
                }}
                className="text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px] flex items-center justify-center px-4 py-2 min-w-[110px] text-gray-700 border border-gray-300 hover:border-gray-400 hover:text-black rounded-xl text-sm font-medium shadow-sm transition"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* Period Navigation */}
          <div className="flex items-center justify-center mb-6">
            <button
              onClick={() => handlePeriodChange(getPreviousPeriod(currentPeriod))}
              className="text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px] flex items-center text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg transition-colors"
            >
              <svg className=  "w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <div className="mx-6 text-center">
              <h2 className=" text-blue-900 dark:text-blue-light leading-tight break-words  text-xl font-bold text-gray-800">{formatPeriod(currentPeriod)}</h2>
              <p className="text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px] text-sm text-gray-600 ">
                Período atual
              </p>
            </div>
            
            <button
              onClick={() => handlePeriodChange(getNextPeriod(currentPeriod))}
              className="text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px] flex items-center text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>

        {/* SEÇÃO RENDA MENSAL MANTIDA (MOBILE) */}
        <div
          className="block sm:hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200 shadow-[0_4px_24px_0_rgba(37,99,235,0.10)] px-6 pt-5 pb-4 relative mx-auto flex flex-col gap-0 renda-mensal-mobile-card"
          style={{
            width: '342.4px',
            minWidth: '342.4px',
            height: '234.4px',
            margin: 0,
            marginLeft: '-15px',
            overflow: 'hidden',
            wordBreak: 'break-word',
            fontSize: '16px',
          }}
          tabIndex={0}
          aria-label="Card Minha Renda Mensal"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-[#2563eb] dark:bg-[#1E293B] rounded-xl">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div className="flex flex-col min-w-0 max-w-full">
                <h2 className="text-blue-900 dark:text-blue-light text-lg font-bold leading-tight break-words max-w-[210px]">Minha Renda Mensal</h2>
                <p className="text-xs text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px]">Defina sua renda mensal principal</p>
              </div>
            </div>
            {!editingIncome && (
              <button
                onClick={handleIncomeEdit}
                className=" text-blue-900 dark:text-blue-light leading-tight break-words text-[#2563eb] hover:text-[#1e3a8a] transition-colors flex items-center gap-1 text-base font-medium p-1"
                aria-label="Editar renda mensal"
                style={{ marginRight: '-15px' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
            )}
          </div>

          {editingIncome ? (
            <div className="space-y-4 mt-2">
              <label className="text-blue-900 dark:text-blue-light leading-tight break-words  block text-xs font-semibold text-[#1e3a8a] mb-1 leading-tight">Valor da Renda Mensal</label>
              <div className="w-full">
                <div className="relative w-full">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#2563eb] text-base font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tempIncome}
                    onChange={(e) => setTempIncome(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 bg-white border-2 border-[#d3e3fd] rounded-xl text-lg font-bold text-[#1e3a8a] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
                    placeholder="0,00"
                    autoFocus
                  />
                </div>
              </div>
              <div className="w-full">
                <div className="flex flex-row gap-2 w-full mt-2">
                  <button
                    onClick={handleIncomeSave}
                    className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white rounded-xl font-bold text-sm flex items-center justify-center transition-colors shadow-lg w-full min-w-0 px-3"
                    style={{ minWidth: 0 }}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Salvar
                  </button>
                  <button
                    onClick={handleIncomeCancel}
                    className="flex-1 h-12 bg-white border-2 border-[#d3e3fd] text-[#1e3a8a] rounded-xl font-bold text-sm flex items-center justify-center transition-colors shadow-lg hover:bg-[#eaf2ff] w-full min-w-0 px-3"
                    style={{ minWidth: 0 }}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full">
            <div
          className="text-4xl font-bold text-blue-900 dark:text-blue-light mb-2 text-[30px] sm:text-4xl" style={{ fontSize: '30px' }}
        > 
          {formatCurrency(summary.monthlyIncome || 0)}
             </div>
              <div className="mb-2 text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px]" style={{ fontSize: '14px' }} data-debug="dark-blue-light-label">Sua renda mensal atual</div>
              <hr className="w-full h-[2px] border-[#d3e3fd] -mt-[20px] mb-6" style={{ marginTop: '20px' }} />
              {summary.monthlyIncome > 0 ? (
                <div className="flex flex-row justify-center items-center gap-2 w-full mt-1">
                  <div className="text-center flex-1">
                    <div className="text-base font-bold text-blue-900 dark:text-blue-light leading-tight" style={{ marginTop: '-18px' }}>
                      {formatCurrency(getDailyIncome())}
                    </div>
                    <p className="text-xs text-blue-900 dark:text-blue-light m-0 leading-tight">Por dia</p>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-base font-bold text-blue-900 dark:text-blue-light leading-tight" style={{ marginTop: '-18px' }}>
                      {formatCurrency(getAnnualIncome())}
                    </div>
                    <p className="text-xs text-blue-900 dark:text-blue-light m-0 leading-tight">Por ano</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full mt-1">
            <p className="text-sm text-blue-700 text-center break-words max-w-full -mt-[15px] md:mt-0">
          Clique em "Editar" para definir sua renda mensal
        </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SEÇÃO RENDA MENSAL MANTIDA (DESKTOP) */}
        <div className="hidden sm:block bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 mb-6 border border-blue-100 w-full max-w-[1104px] h-[258.4px] shadow-lg relative mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#2563eb] dark:bg-[#1E293B] rounded-2xl">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-900 dark:text-blue-light">Minha Renda Mensal</h2>
                <p className="text-sm text-blue-900 dark:text-blue-light">Defina sua renda mensal principal</p>
              </div>
            </div>
            {!editingIncome && (
              <button
                onClick={handleIncomeEdit}
                className="text-blue-900 dark:text-blue-light leading-tight break-words  hover:text-[#1e3a8a] transition-colors flex items-center gap-2 text-base font-medium"
                aria-label="Editar renda mensal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Editar
              </button>
            )}
          </div>

          {editingIncome ? (
            <div className="space-y-6">
              <label className="text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px]" style={{ marginBottom: '-5px', marginTop: '-15px' , fontSize: '14px'}}>
                Valor da Renda Mensal
              </label>
              <div className="w-full">
                <div className="relative w-full" style={{ marginTop: '-19px' }}>
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#2563eb] text-lg font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tempIncome}
                    onChange={(e) => setTempIncome(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-white border-2 border-[#d3e3fd] rounded-2xl text-2xl font-bold text-[#1e3a8a] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
                    placeholder="0,00"
                    autoFocus
                  />
                </div>
              </div>
              <div className="w-full" style={{ marginTop: 0, paddingTop: 0 }}>
                <div className="flex flex-row gap-4 w-full" style={{ marginTop: '7px', paddingTop: 0 }}>
                  <button
                    onClick={handleIncomeSave}
                    className="flex-1 h-14 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white rounded-2xl font-bold text-base flex items-center justify-center transition-colors shadow-lg w-full min-w-0 px-[16px]"
                    style={{ minWidth: 0 }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Salvar
                  </button>
                  <button
                    onClick={handleIncomeCancel}
                    className="flex-1 h-14 bg-white border-2 border-[#d3e3fd] text-[#1e3a8a] rounded-2xl font-bold text-base flex items-center justify-center transition-colors shadow-lg hover:bg-[#eaf2ff] w-full min-w-0 px-[16px]"
                    style={{ minWidth: 0 }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-blue-900 dark:text-blue-light mb-2 text-[30px] sm:text-4xl" style={{ fontSize: '30px' }}>
                {formatCurrency(summary.monthlyIncome || 0)}
              </div>
              <div className="mb-2 text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px]" style={{ fontSize: '14px' }} data-debug="dark-blue-light-label">Sua renda mensal atual</div>
              <hr className="w-full h-[2px] border-[#d3e3fd] -mt-[20px] mb-6" style={{ marginTop: '0.15px' }} />
              {summary.monthlyIncome > 0 ? (
                <div className="flex flex-row justify-center items-center gap-2 w-full mt-1">
                  <div className="text-center flex-1">
                    <div className="mb-2 text-blue-900 dark:text-[#1e3a8a] leading-tight break-words max-w-[210px]"style={{ fontSize: '16px',margin: '0', marginLeft: '155px' , fontWeight: 'bold' }}>
                      {formatCurrency(getDailyIncome())}
                    </div>
                    <p className="mb-2 text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px]"style={{ fontSize: '12px',margin: '0', marginLeft: '155px'  }}>Por dia</p>
                  </div>
                  <div className="text-center flex-1">
                    <div className="mb-2 text-blue-900 dark:text-[#1e3a8a] leading-tight break-words max-w-[210px]"style={{ fontSize: '16px',margin: '0', marginLeft: '155px' , fontWeight: 'bold' }}>
                      {formatCurrency(getAnnualIncome())}
                    </div>
                    <p className="mb-2 text-blue-900 dark:text-blue-light leading-tight break-words max-w-[210px]"style={{ fontSize: '12px',margin: '0', marginLeft: '155px'  }}>Por ano</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full mt-1">
              <p className="text-sm text-blue-700 text-center break-words max-w-full">Clique em "Editar" para definir sua renda mensal</p>
                </div>
              )}
            </div>
          )}
        </div>

          {/* Quick Stats */}
          <div className="block sm:hidden w-full" style={{ marginTop: '18px' }}>
            <div style={{ height: '10px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
              <div
                className=" leading-tight break-words max-w-[210px] rounded-2xl shadow flex flex-col items-center justify-center mx-auto w-full md:w-auto bg-green-50 dark:bg-[#064E3B]"
                style={{
                  width: '100%',
                  maxWidth: '357.33px',
                  height: 'auto',
                  minHeight: '110px',
                  padding: '0',
                }}
              >
                <div className="flex flex-col items-center justify-center w-full h-full py-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-green-600 rounded-full mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                  </div>
                  <div className="font-bold text-green-700 text-[1.5rem] leading-tight mb-1" style={{letterSpacing: '-1px'}}>{formatCurrency(summary.totalIncome)}</div>
                  <div className="text-base text-green-700 font-medium leading-tight">Receitas Extras</div>
                </div>
              </div>
              <div
                className="bg-red-50 dark:bg-[#7f1d1d] rounded-2xl shadow flex flex-col items-center justify-center mx-auto w-full"
                style={{
                  maxWidth: '357.33px',
                  minHeight: '110px',
                }}
              >
                <div className="flex flex-col items-center justify-center w-full h-full py-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-red-600 rounded-full mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
                  </div>
                  <div className="font-bold text-red-700 dark:text-red-200 text-[1.5rem] leading-tight mb-1" style={{letterSpacing: '-1px'}}>{formatCurrency(summary.totalExpenses)}</div>
                  <div className="text-base text-red-700 dark:text-red-300 font-medium leading-tight">Gastos</div>
                  {summary.monthlyIncome > 0 && (
                    <div className="text-xs text-red-500 dark:text-red-400 mt-1" style={{ fontWeight: 500 }}>
                      {((summary.totalExpenses / summary.monthlyIncome) * 100).toFixed(1)}% da renda
                    </div>
                  )}
                </div>
              </div>
              <div
                className={
                  `rounded-2xl shadow flex flex-col items-center justify-center mx-auto w-full md:w-auto ` +
                  (summary?.balance >= 0 ? 'bg-blue-50 dark:bg-[#1E3A8A]' : 'bg-red-50 dark:bg-[#7F1D1D]')
                }
                style={{
                  width: '100%',
                  maxWidth: '357.33px',
                  minHeight: '110px',
                  padding: '0',
                }}
              >
                <div className="flex flex-col items-center justify-center w-full h-full py-3">
                  <div className={
                    `inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ` +
                    (summary?.balance >= 0 ? 'bg-blue-600' : 'bg-red-600')
                  }>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>

                  <div
                    className={
                      `font-bold text-[1.5rem] leading-tight mb-1 ` +
                      (summary?.balance >= 0 ? 'text-blue-700 dark:text-blue-200' : 'text-red-700 dark:text-red-200')
                    }
                    style={{ letterSpacing: '-1px' }}
                  >
                    {
                      typeof summary?.balance === 'number'
                        ? (summary.balance >= 0
                          ? formatCurrency(summary.balance)
                          : `R$ - ${formatCurrency(Math.abs(summary.balance)).replace('R$', '').trim()}`)
                        : 'Carregando...'
                    }
                  </div>

                  <div className={
                    `text-base font-medium leading-tight ` +
                    (summary?.balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300')
                  }>
                    Saldo Atual
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-green-50 dark:bg-[#064E3B] rounded-2xl shadow flex flex-col items-center justify-center p-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-600 rounded-full mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <div className="font-bold text-green-700 dark:text-green-200 text-[1.5rem] leading-tight mb-1" style={{letterSpacing: '-1px'}}>{formatCurrency(summary.totalIncome)}</div>
              <div className="text-base text-green-700 dark:text-green-300 font-medium leading-tight">Receitas Extras</div>
            </div>
            <div className="bg-red-50 dark:bg-[#7f1d1d] rounded-2xl shadow flex flex-col items-center justify-center p-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-red-600 rounded-full mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
              </div>
              <div className="font-bold text-red-700 dark:text-red-200 text-[1.5rem] leading-tight mb-1" style={{letterSpacing: '-1px'}}>{formatCurrency(summary.totalExpenses)}</div>
              <div className="text-base text-red-700 dark:text-red-300 font-medium leading-tight">Gastos</div>
              {summary.monthlyIncome > 0 && (
                  <div className="text-xs text-red-500 dark:text-red-400 mt-1" style={{ fontWeight: 500 }}>
                      {((summary.totalExpenses / summary.monthlyIncome) * 100).toFixed(1)}% da renda
                  </div>
              )}
            </div>
            <div className={`
              rounded-2xl shadow flex flex-col items-center justify-center p-3
              ${summary.balance >= 0 ? 'bg-blue-50 dark:bg-[#1E3A8A]' : 'bg-red-50 dark:bg-[#7F1D1D]'}
            `}>
              <div className={`
                inline-flex items-center justify-center w-10 h-10 rounded-full mb-2
                ${summary.balance >= 0 ? 'bg-blue-600' : 'bg-red-600'}
              `}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div className={`
                font-bold text-[1.5rem] leading-tight mb-1
                ${summary.balance >= 0 ? 'text-blue-700 dark:text-blue-200' : 'text-red-700 dark:text-red-200'}
              `} style={{ letterSpacing: '-1px' }}>
                {summary.balance >= 0
                  ? formatCurrency(summary.balance)
                  : `R$ - ${formatCurrency(Math.abs(summary.balance)).replace('R$', '').trim()}`}
              </div>
              <div className={`
                text-base font-medium leading-tight
                ${summary.balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}
              `}>
                Saldo Atual
              </div>
            </div>
          </div>   
          <br/>
          <h5 className="text-blue-500 dark:text-blue-light leading-tight break-words font-bold" style={{fontSize: "20px" ,textAlign: 'center'}}>Nova Transação</h5> 
          <br />

          {/* Transaction Form */}
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: Compra no supermercado"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Receita</option>
                </select>
              </div>
            </div>

{/* ================================================= */}
{/* ▼▼▼ SEÇÃO DE RECORRÊNCIA (CHECKBOX 25px) ▼▼▼ */}
{/* ================================================= */}
<div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
    {/* Checkbox Container - Checkbox 25px */}
    <label className="flex items-center gap-3.5 cursor-pointer flex-wrap">
        {/* Container do checkbox com tamanho FIXO 25px */}
        <div className="relative w-[25px] h-[25px] flex-shrink-0">
            <input 
                type="checkbox" 
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="
                    absolute top-0 left-0
                    w-full h-full
                    m-0 p-0
                    appearance-none
                    cursor-pointer
                    border-2 border-gray-300 rounded-[5px]
                    checked:bg-blue-600 checked:border-blue-600
                    focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                    dark:border-gray-600 dark:bg-gray-700
                    dark:checked:bg-blue-600
                    /* Remove qualquer transformação */
                    transform-none
                    /* Garante o box model correto */
                    box-border
                "
                style={{
                    // Força o tamanho dentro do container
                    width: '100%',
                    height: '100%',
                    // Sobrescreve qualquer CSS externo
                    minWidth: '100%',
                    minHeight: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%'
                }}
            />
            {/* Ícone de check - proporcionalmente maior */}
            <svg 
                className={`
                    absolute top-1/2 left-1/2 
                    -translate-x-1/2 -translate-y-1/2
                    w-[14px] h-[14px]           /* 14px (proporcional ao checkbox de 25px) */
                    text-white 
                    pointer-events-none 
                    transition-opacity 
                    duration-150
                    ${isRecurring ? 'opacity-100' : 'opacity-0'}
                `}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth="3.5"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        
        {/* Texto do checkbox - proporcionalmente maior */}
        <span className="text-[15px] text-gray-700 dark:text-gray-200 font-medium select-none leading-tight">
            Repetir mensalmente?
        </span>
    </label>

    {isRecurring && (
        <div className="mt-3.5 grid grid-cols-1 gap-3.5 animate-fade-in">
            {/* Campo Dia - Proporcionalmente maior */}
            <div className="w-full">
                <label className="block text-[13px] text-gray-500 dark:text-gray-400 mb-2 font-medium">
                    Dia da cobrança (1-31)
                </label>
                <div className="relative">
                    <input
                        type="number"
                        min="1"
                        max="31"
                        value={recurrenceDay}
                        onChange={(e) => setRecurrenceDay(e.target.value)}
                        placeholder={`Ex: ${new Date().getDate()}`}
                        className="
                            w-full 
                            px-4 py-3                /* Aumentado: 16px × 12px */
                            border-2 border-gray-300 
                            rounded-lg 
                            focus:ring-2 focus:ring-blue-500 
                            focus:border-blue-500 
                            outline-none 
                            text-[15px]              /* 15px */
                            dark:bg-gray-800 
                            dark:border-gray-600 
                            dark:text-white 
                            transition-colors
                            h-11                     /* Altura 44px */
                            /* Remove estilos de número nativo */
                            [-moz-appearance:textfield]
                            [&::-webkit-outer-spin-button]:appearance-none
                            [&::-webkit-inner-spin-button]:appearance-none
                        "
                    />
                </div>
            </div>
            
            {/* Campo Duração - Proporcionalmente maior */}
            <div className="w-full">
                <label className="block text-[13px] text-gray-500 dark:text-gray-400 mb-2 font-medium">
                    Duração (Meses)
                </label>
                <div className="relative">
                    <input
                        type="number"
                        min="1"
                        value={recurrenceLimit}
                        onChange={(e) => setRecurrenceLimit(e.target.value)}
                        placeholder="Vazio = Fixo"
                        className="
                            w-full 
                            px-4 py-3                /* Aumentado: 16px × 12px */
                            border-2 border-gray-300 
                            rounded-lg 
                            focus:ring-2 focus:ring-blue-500 
                            focus:border-blue-500 
                            outline-none 
                            text-[15px]              /* 15px */
                            dark:bg-gray-800 
                            dark:border-gray-600 
                            dark:text-white 
                            transition-colors
                            h-11                     /* Altura 44px */
                            /* Remove setinhas do input number */
                            [-moz-appearance:textfield]
                            [&::-webkit-outer-spin-button]:appearance-none
                            [&::-webkit-inner-spin-button]:appearance-none
                        "
                    />
                </div>
            </div>
            
            {/* Texto de ajuda - proporcionalmente maior */}
            <p className="text-[12px] text-gray-400 dark:text-gray-500 italic leading-tight">
                * Deixe a duração vazia para contas fixas (ex: Netflix, Aluguel).
            </p>
        </div>
    )}
</div>
{/* ================================================= */}
{/* ▲▲▲ FIM DA SEÇÃO DE RECORRÊNCIA ▲▲▲ */}
{/* ================================================= */}

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Adicionar
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Transações - {formatPeriod(currentPeriod)}
          </h2>
          
          <div>
            {!summary.transactions || summary.transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <p className="text-base text-gray-600">Nenhuma transação registrada neste período.</p>
                <p className="text-sm text-gray-500 mt-1">Adicione sua primeira transação acima.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.transactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border ${
                      transaction.type === 'income' 
                        ? 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800' 
                        : 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0 w-full">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mr-4 flex-shrink-0 ${
                        transaction.type === 'income' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {transaction.type === 'income' 
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                          }
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800 dark:text-gray-100 break-words">{transaction.description}</p>
                            
                            {/* ▼▼▼ NOVO BADGE (VISUALIZAÇÃO CORRIGIDA) ▼▼▼ */}
                            {renderInstallmentBadge(transaction)}
                            {/* ▲▲▲ FIM DO BADGE ▲▲▲ */}

                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {/* Data formatada localmente */}
                          <span>{formatDateDisplay(transaction.date)}</span>
                          
                          <span className="mx-2">•</span>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800/50 dark:!text-blue-300"
                            style={{ color: '#1666B6' }}
                          >
                            {transaction.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end sm:justify-end gap-4 w-full sm:w-auto mt-3 sm:mt-0">
                      <span className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        {transaction.type === 'income' 
                          ? formatCurrency(transaction.amount).replace('R$', 'R$ +') 
                          : formatCurrency(transaction.amount).replace('R$', 'R$ -')}
                      </span>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-red-500 dark:text-red-400 transition-colors p-2 rounded-lg border-none"
                        title="Excluir transação"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};