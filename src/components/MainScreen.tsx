/**
 * MainScreen - Tela principal do OrçaMais
 */

import React, { useState, useEffect } from 'react';
import dataManager from '../core/DataManager';
import { formatCurrency, getCurrentPeriod, formatPeriod, getPreviousPeriod, getNextPeriod } from '../utils/formatters';

interface MainScreenProps {
  onNavigate: (screen: string) => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onNavigate }) => {
  const [currentPeriod, setCurrentPeriod] = useState(getCurrentPeriod());
  const [summary, setSummary] = useState<any>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'Outros'
  });
  const [showSpendingAlert, setShowSpendingAlert] = useState(false);

  const user = dataManager.getCurrentUser();
  const categories = dataManager.getCategories();

  useEffect(() => {
    updateSummary();
  }, [currentPeriod]);

  const updateSummary = () => {
    const newSummary = dataManager.getFinancialSummary(currentPeriod);
    setSummary(newSummary);
    
    // Verificar se os gastos atingiram 90% da renda
    if (newSummary && newSummary.monthlyIncome > 0) {
      const spendingPercentage = (newSummary.totalExpenses / newSummary.monthlyIncome) * 100;
      setShowSpendingAlert(spendingPercentage >= 90);
    } else {
      setShowSpendingAlert(false);
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) return;

    const transactionData = {
      ...formData,
      date: currentPeriod + '-01'
    };

    const transaction = dataManager.addTransaction(transactionData);
    
    if (transaction) {
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        category: 'Outros'
      });
      updateSummary();
    }
  };

  const deleteTransaction = (transactionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      if (dataManager.removeTransaction(transactionId)) {
        updateSummary();
      }
    }
  };

  const handleMonthlyIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    dataManager.setMonthlyIncome(currentPeriod, amount);
    updateSummary();
  };

  const handlePeriodChange = (newPeriod: string) => {
    setCurrentPeriod(newPeriod);
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-gray-100 text-gray-800'
    ];
    
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getSpendingPercentage = () => {
    if (!summary || summary.monthlyIncome <= 0) return 0;
    return (summary.totalExpenses / summary.monthlyIncome) * 100;
  };

  if (!summary) return <div>Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Alerta de Gastos */}
        {showSpendingAlert && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 mb-4 sm:mb-6 rounded-r-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-xs sm:text-sm text-red-700">
                  <strong>Atenção!</strong> Seus gastos atingiram {getSpendingPercentage().toFixed(1)}% da sua renda mensal. 
                  {getSpendingPercentage() >= 100 ? ' Você ultrapassou sua renda!' : ' Cuidado para não ultrapassar o orçamento!'}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowSpendingAlert(false)}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center flex-1 min-w-0">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-10 sm:h-10 bg-blue-600 rounded-full mr-3 sm:mr-3 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">OrçaMais</h1>
                <p className="text-sm sm:text-base text-gray-600 truncate">Olá, {user?.profile?.name}!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <button
                onClick={() => onNavigate('summary')}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 sm:py-2 rounded-lg sm:rounded-xl font-medium transition-colors text-sm sm:text-sm"
              >
                <svg className="w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <span className="hidden xs:inline sm:inline">Resumo</span>
              </button>
              
              <button
                onClick={() => {
                  dataManager.logout();
                  onNavigate('auth');
                }}
                className="flex items-center text-gray-600 hover:text-gray-800 px-3 sm:px-3 py-2 sm:py-2 rounded-lg sm:rounded-xl font-medium transition-colors text-sm sm:text-sm border border-gray-300 hover:border-gray-400"
              >
                <svg className="w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span className="hidden xs:inline sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Period Navigation */}
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <button
              onClick={() => handlePeriodChange(getPreviousPeriod(currentPeriod))}
              className="flex items-center text-gray-600 hover:text-gray-800 px-2 sm:px-3 py-1 sm:py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <div className="mx-4 sm:mx-6 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">{formatPeriod(currentPeriod)}</h2>
              <p className="text-xs sm:text-sm text-gray-600">Período atual</p>
            </div>
            
            <button
              onClick={() => handlePeriodChange(getNextPeriod(currentPeriod))}
              className="flex items-center text-gray-600 hover:text-gray-800 px-2 sm:px-3 py-1 sm:py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>

          {/* Quick Stats - Layout Ajustado */}
          <div className="mb-4 sm:mb-6">
            {/* Primeira linha - Receitas e Gastos */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full mb-2 sm:mb-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-green-700 mb-1">{formatCurrency(summary.totalIncome)}</div>
                <div className="text-xs sm:text-sm text-green-600 font-medium">Receitas</div>
              </div>
              
              <div className="bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-full mb-2 sm:mb-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                  </svg>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-red-700 mb-1">{formatCurrency(summary.totalExpenses)}</div>
                <div className="text-xs sm:text-sm text-red-600 font-medium">Gastos</div>
                {summary.monthlyIncome > 0 && (
                  <div className="text-xs text-red-500 mt-1 font-medium">
                    {getSpendingPercentage().toFixed(1)}% da renda
                  </div>
                )}
              </div>
            </div>

            {/* Segunda linha - Saldo centralizado com mesmo tamanho */}
            <div className="flex justify-center">
              <div className={`bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center w-full max-w-[calc(50%-0.375rem)] sm:max-w-[calc(50%-0.5rem)] ${
                summary.balance < 0 ? 'bg-red-50' : 'bg-blue-50'
              }`}>
                <div className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full mb-2 sm:mb-3 ${
                  summary.balance >= 0 ? 'bg-blue-600' : 'bg-red-600'
                }`}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <div className={`text-lg sm:text-2xl font-bold mb-1 ${
                  summary.balance >= 0 ? 'text-blue-700' : 'text-red-700'
                }`}>
                  {formatCurrency(summary.balance)}
                </div>
                <div className={`text-xs sm:text-sm font-medium ${
                  summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  Saldo
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Income */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Renda Mensal - {formatPeriod(currentPeriod)}
            </label>
            <div className="relative">
              <span className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm sm:text-base">R$</span>
              <input
                type="number"
                step="0.01"
                value={summary.monthlyIncome || ''}
                onChange={handleMonthlyIncomeChange}
                className="w-full pl-8 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Transaction Form */}
          <form onSubmit={handleAddTransaction} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  placeholder="Ex: Compra no supermercado"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm sm:text-base">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Receita</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto justify-center text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Adicionar
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
            Transações - {formatPeriod(currentPeriod)}
          </h2>
          
          <div>
            {!summary.transactions || summary.transactions.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-gray-600">Nenhuma transação registrada neste período.</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Adicione sua primeira transação acima.</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {summary.transactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
                      transaction.type === 'income' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 sm:mr-4 flex-shrink-0 ${
                        transaction.type === 'income' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {transaction.type === 'income' 
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                          }
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{transaction.description}</p>
                        <div className="flex items-center text-xs sm:text-sm text-gray-600 mt-1">
                          <span>{transaction.date}</span>
                          <span className="mx-2">•</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(transaction.category)} truncate`}>
                            {transaction.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center ml-2 flex-shrink-0">
                      <span className={`text-sm sm:text-lg font-bold mr-2 sm:mr-4 ${
                        transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1 sm:p-2 hover:bg-red-50 rounded-lg"
                        title="Excluir transação"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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