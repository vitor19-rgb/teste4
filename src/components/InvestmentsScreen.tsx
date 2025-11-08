// Em: src/components/InvestmentsScreen.tsx
// (Versão 100% atualizada com Modal de Venda Personalizado e correções de bugs)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dataManager from '../core/DataManager';
import { getCurrentPeriod } from '../utils/formatters';

// --- Interfaces ---

interface Stock {
  stock: string;
  name: string;
  close: number;
  logo: string;
}

interface InvestmentsScreenProps {
  onNavigate: (screen: string) => void;
}

interface InvestmentTransaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  investmentData: {
    stockCode: string;
    quantity: number;
    purchasePrice: number;
    logo: string;
  };
}

// =================================================================
// ▼▼▼ SUB-COMPONENTE: Calculadora de Projeção ▼▼▼
// =================================================================
// (Este componente não foi alterado)
interface ProjectionCalculatorProps {
  initialValue: number;
  projectionTitle: string;
  rate: number;
  onRateChange: (newRate: number) => void;
}

const InvestmentProjectionCalculator: React.FC<ProjectionCalculatorProps> = ({
  initialValue,
  projectionTitle,
  rate,
  onRateChange,
}) => {
  const projectionData = useMemo(() => {
    const data: { month: number; value: number }[] = [];
    let currentValue = initialValue;
    const decimalRate = rate / 100;
    if (currentValue > 0 && decimalRate > 0) {
      for (let i = 1; i <= 6; i++) {
        currentValue = currentValue * (1 + decimalRate);
        data.push({ month: i, value: currentValue });
      }
    }
    return data;
  }, [initialValue, rate]);

  return (
    <section className="mt-8 pt-6 border-t border-slate-300">
      <h2 className="text-xl font-semibold text-slate-700 mb-4">
        {projectionTitle}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coluna 1: Input da Taxa */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <label htmlFor="projectionRate" className="block text-sm font-medium text-slate-700">
            Taxa de rendimento mensal esperada (%)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Simular rendimento sobre: R$ {initialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <input
            id="projectionRate"
            type="number"
            step="0.1"
            min="0.1"
            value={rate}
            onChange={e => onRateChange(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
        {/* Coluna 2: Tabela de Projeção */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          {projectionData.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-sm font-semibold text-slate-500 pb-2">Mês</th>
                  <th className="text-right text-sm font-semibold text-slate-500 pb-2">Valor Projetado</th>
                </tr>
              </thead>
              <tbody>
                {projectionData.map(item => (
                  <tr key={item.month} className="border-b border-slate-100">
                    <td className="py-2 text-slate-700">Mês {item.month}</td>
                    <td className="text-right font-semibold text-slate-800">
                      R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-center py-4">
              Insira uma taxa de rendimento positiva para calcular a projeção.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
// =================================================================
// ▲▲▲ FIM DO SUB-COMPONENTE Calculadora ▲▲▲
// =================================================================


// =================================================================
// ▼▼▼ NOVO SUB-COMPONENTE: Modal de Confirmação de Venda ▼▼▼
// =================================================================
interface ConfirmSellModalProps {
  isOpen: boolean;
  isSelling: boolean; // Estado de loading
  onClose: () => void;
  onConfirm: () => void;
  tx: InvestmentTransaction | null;
  profit: number;
  currentValue: number;
}

const ConfirmSellModal: React.FC<ConfirmSellModalProps> = ({
  isOpen,
  isSelling,
  onClose,
  onConfirm,
  tx,
  profit,
  currentValue
}) => {
  if (!isOpen || !tx) return null;

  const { quantity, stockCode } = tx.investmentData;
  const originalCost = tx.amount;
  const isPositive = profit >= 0;

  return (
    // Overlay (fundo escuro)
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 animate-fade-in-scale"
      onClick={onClose} // Fecha ao clicar fora
    >
      {/* Painel do Modal */}
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()} // Impede de fechar ao clicar dentro
      >
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Confirmar Venda da Ação</h2>
        
        <p className="text-sm text-slate-600 mb-2">Deseja 'Vender' este ativo?</p>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
          <p className="text-lg font-bold text-slate-800">{quantity}x {stockCode}</p>
          <p className="text-sm text-slate-600">
            Valor Original: R$ {originalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-slate-600">
            Valor Atual: R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className={`p-3 rounded-lg border ${isPositive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} mb-6`}>
          <p className="text-sm font-semibold text-slate-700">
            {isPositive ? 'Lucro a Realizar:' : 'Prejuízo a Realizar:'}
          </p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            R$ {Math.abs(profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <p className="text-xs text-slate-500 mb-5">
          Ao confirmar, a compra original será removida e uma transação de {isPositive ? 'lucro' : 'prejuízo'} será adicionada ao seu histórico.
        </p>

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={isSelling}
            className="w-full bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isSelling}
            className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-green-700 transition-all
                       disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isSelling ? 'Processando...' : 'Confirmar Venda'}
          </button>
        </div>
      </div>
    </div>
  );
};
// =================================================================
// ▲▲▲ FIM DO SUB-COMPONENTE Modal ▲▲▲
// =================================================================


// =================================================================
// ▼▼▼ COMPONENTE DE HISTÓRICO (Com Lógica de Modal) ▼▼▼
// =================================================================
const MyInvestmentsHistory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<InvestmentTransaction[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [projectionRate, setProjectionRate] = useState(0.8);
  const [projectionTarget, setProjectionTarget] = useState<InvestmentTransaction | null>(null);

  // --- (▼▼▼ ESTADO DO MODAL E LOADING DE VENDA ▼▼▼) ---
  const [isSelling, setIsSelling] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    txToSell: InvestmentTransaction | null;
    profit: number;
    currentValue: number;
  }>({
    isOpen: false,
    txToSell: null,
    profit: 0,
    currentValue: 0,
  });
  // --- (▲▲▲ FIM DO ESTADO DO MODAL ▲▲▲) ---


  useEffect(() => {
    // ... (Lógica de fetch, sem alteração) ...
    const fetchHistoryAndPrices = async () => {
      setLoading(true);
      try {
        const allTransactions = await dataManager.getAllTransactions();
        const investmentTxs = allTransactions.filter(
          (tx): tx is InvestmentTransaction =>
            tx.category === 'Investimentos' && Boolean(tx.investmentData)
        );
        const stockCodes = [...new Set(investmentTxs.map(tx => tx.investmentData.stockCode))];
        if (stockCodes.length > 0) {
          const cacheKey = 'stocksCache';
          const cachedData = sessionStorage.getItem(cacheKey);
          const now = new Date().getTime();
          let prices: Record<string, number> = {};
          if (cachedData) {
            const { timestamp, data } = JSON.parse(cachedData);
            if (now - timestamp < 3600000) {
              (data as Stock[]).forEach(stock => { prices[stock.stock] = stock.close; });
            }
          }
          if (Object.keys(prices).length === 0) {
            const response = await fetch('https://brapi.dev/api/quote/list');
            const data = await response.json();
            if (data && data.stocks) {
              const cachePayload = { timestamp: now, data: data.stocks };
              sessionStorage.setItem(cacheKey, JSON.stringify(cachePayload));
              (data.stocks as Stock[]).forEach(stock => { prices[stock.stock] = stock.close; });
            }
          }
          setCurrentPrices(prices);
        }
        setInvestments(investmentTxs);
      } catch (error) {
        console.error("Erro ao buscar histórico ou preços:", error);
        alert("Não foi possível carregar seu histórico de investimentos.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistoryAndPrices();
  }, []);

  // --- Funções de Cálculo (sem alteração) ---
  const groupedInvestments = useMemo(() => {
    return investments.reduce((acc, tx) => {
      const monthYear = tx.date.substring(0, 7);
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(tx);
      return acc;
    }, {} as Record<string, InvestmentTransaction[]>);
  }, [investments]);

  const sortedMonths = Object.keys(groupedInvestments).sort().reverse();

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const calculateReturn = useCallback((tx: InvestmentTransaction) => {
    const { quantity, purchasePrice, stockCode } = tx.investmentData;
    const currentPrice = currentPrices[stockCode] || purchasePrice; 
    const totalCost = purchasePrice * quantity;
    const currentValue = currentPrice * quantity;
    const profit = currentValue - totalCost;
    const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    return { profit, profitPercent, currentValue };
  }, [currentPrices]);

  // --- LÓGICA DE PROJEÇÃO DINÂMICA (sem alteração) ---
  const totalCurrentValue = useMemo(() => {
    return investments.reduce((total, tx) => {
      const { currentValue } = calculateReturn(tx);
      return total + currentValue;
    }, 0);
  }, [investments, calculateReturn]);

  const { projectionTitle, projectionValue } = useMemo(() => {
    if (projectionTarget) {
      const { currentValue } = calculateReturn(projectionTarget);
      return {
        projectionTitle: `Projeção para ${projectionTarget.investmentData.stockCode}`,
        projectionValue: currentValue,
      };
    } else {
      return {
        projectionTitle: "Projeção da Carteira Total",
        projectionValue: totalCurrentValue,
      };
    }
  }, [projectionTarget, totalCurrentValue, calculateReturn]);


  // --- (▼▼▼ LÓGICA DE VENDA REATORADA PARA O MODAL ▼▼▼) ---

  // 1. Função para ABRIR o modal
  const handleOpenSellModal = useCallback((tx: InvestmentTransaction) => {
    // Calcula os valores ANTES de abrir o modal
    const { profit, currentValue } = calculateReturn(tx);
    setModalState({
      isOpen: true,
      txToSell: tx,
      profit: profit,
      currentValue: currentValue
    });
  }, [calculateReturn]); // Depende de 'calculateReturn'

  // 2. Função para FECHAR o modal
  const handleCloseModal = useCallback(() => {
    if (isSelling) return; // Não deixa fechar enquanto processa
    setModalState({ isOpen: false, txToSell: null, profit: 0, currentValue: 0 });
  }, [isSelling]);

  // 3. Função para CONFIRMAR a venda (a lógica principal)
  const handleConfirmSell = useCallback(async () => {
    const { txToSell, profit } = modalState;
    if (!txToSell) return;

    setIsSelling(true); // Ativa o loading
    
    try {
      // 1. REMOVE a transação de "compra" (despesa) original.
      await dataManager.removeTransaction(txToSell.id);
      
      // 2. ADICIONA *apenas* o lucro/prejuízo como uma nova transação.
      if (profit !== 0) {
        const profitTransactionData = {
          description: profit > 0 
            ? `Lucro na Venda: ${txToSell.investmentData.quantity}x ${txToSell.investmentData.stockCode}` 
            : `Prejuízo na Venda: ${txToSell.investmentData.quantity}x ${txToSell.investmentData.stockCode}`,
          amount: Math.abs(profit),
          type: profit > 0 ? 'income' : 'expense',
          category: 'Investimentos',
          date: new Date().toISOString().split('T')[0],
        };
        await dataManager.addTransaction(profitTransactionData);
      }
      
      // 3. Atualiza o estado local
      setInvestments(prevInvestments => prevInvestments.filter(item => item.id !== txToSell.id));
      
      // 4. Dispara o evento global
      window.dispatchEvent(new CustomEvent('datachanged'));

      // 5. Limpa a projeção se o item vendido estava selecionado
      if (projectionTarget?.id === txToSell.id) {
        setProjectionTarget(null);
      }

      // 6. Fecha o modal e desativa o loading
      handleCloseModal();

    } catch (error) {
      console.error("Erro ao realizar investimento:", error);
      alert("Ocorreu um erro ao tentar realizar o investimento. Tente novamente.");
    } finally {
      setIsSelling(false); // Desativa o loading
    }
  }, [modalState, projectionTarget, handleCloseModal]);
  // --- (▲▲▲ FIM DA LÓGICA DE VENDA REATORADA ▲▲▲) ---


  // --- Renderização do Histórico ---
  if (loading) {
    return <p className="text-slate-500 text-center p-4">Carregando histórico...</p>;
  }
  if (sortedMonths.length === 0) {
     return (
      <div className="bg-white p-6 rounded-xl shadow-sm border-slate-200 text-center">
        <p className="text-slate-600 font-semibold">Nenhuma simulação de compra encontrada.</p>
        <p className="text-sm text-slate-500">Comece a simular na aba "Simular Nova Compra"!</p>
      </div>
    );
  }

  return (
    <> {/* Adiciona Fragment para permitir o Modal no mesmo nível */}
      <div className="space-y-6">
        {/* 1. SEÇÃO DO HISTÓRICO DE COMPRAS (POR MÊS) */}
        {sortedMonths.map(monthYear => (
          <section key={monthYear}>
            <h2 className="text-xl font-semibold text-slate-700 capitalize mb-3 pb-2 border-b border-slate-300">
              {formatMonthYear(monthYear)}
            </h2>
            
            <div className="space-y-4">
              {groupedInvestments[monthYear]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
                .map(tx => {
                  const { profit, profitPercent, currentValue } = calculateReturn(tx);
                  const isPositive = profit >= 0;
                  
                  return (
                    <div 
                      key={tx.id} 
                      onClick={() => setProjectionTarget(tx)}
                      className={`bg-white p-4 rounded-xl shadow-sm border-2 transition-all cursor-pointer
                                  ${projectionTarget?.id === tx.id ? 'border-green-500' : 'border-slate-200 hover:border-green-300'}`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Detalhes da Compra (sem alteração) */}
                        <img src={tx.investmentData.logo} alt="Logo" className="w-10 h-10 rounded-full bg-white border border-slate-200" />
                        <div className="flex-1">
                          <p className="font-bold text-slate-800">{tx.investmentData.quantity}x {tx.investmentData.stockCode}</p>
                          <p className="text-sm text-slate-600">
                            Custo total: R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            <span className="text-xs text-slate-500"> (R$ {tx.investmentData.purchasePrice.toFixed(2)} / ação)</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            Data da Compra: {new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </p>
                        </div>

                        {/* Detalhes do Rendimento (sem alteração) */}
                        <div className="w-full sm:w-auto sm:ml-auto sm:text-right space-y-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                          <p className="text-sm font-semibold text-slate-500">Rendimento Atual</p>
                          <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            ({profitPercent.toFixed(2)}%)
                          </p>
                          <p className="text-xs text-slate-500 pt-1 border-t border-slate-200 mt-1">
                            Valor Atual: R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      
                      {/* (▼▼▼ BOTÃO "VENDER AÇÃO" ATUALIZADO ▼▼▼) */}
                      <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Impede que o clique no botão selecione o card
                            handleOpenSellModal(tx); // Abre o MODAL
                          }}
                          disabled={!currentPrices[tx.investmentData.stockCode]} // Desativa se o preço não carregou
                          className={`font-semibold py-2 px-4 rounded-lg text-sm shadow transition-all
                                    bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-300`}
                        >
                          Vender Ação
                        </button>
                      </div>
                      {/* (▲▲▲ FIM DO BOTÃO "VENDER AÇÃO" ▲▲▲) */}
                    </div>
                  );
              })}
            </div>
          </section>
        ))}

        {/* 2. SEÇÃO DE PROJEÇÃO DINÂMICA (sem alteração) */}
        {totalCurrentValue > 0 && (
          <>
            {projectionTarget && (
              <div className="text-center -mb-2">
                <button 
                  onClick={() => setProjectionTarget(null)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  &larr; Voltar para Projeção da Carteira Total
                </button>
              </div>
            )}
            <InvestmentProjectionCalculator
              projectionTitle={projectionTitle}
              initialValue={projectionValue}
              rate={projectionRate}
              onRateChange={setProjectionRate}
            />
          </>
        )}
      </div>

      {/* (▼▼▼ RENDERIZA O MODAL AQUI ▼▼▼) */}
      <ConfirmSellModal
        isOpen={modalState.isOpen}
        isSelling={isSelling}
        onClose={handleCloseModal}
        onConfirm={handleConfirmSell}
        tx={modalState.txToSell}
        profit={modalState.profit}
        currentValue={modalState.currentValue}
      />
    </>
  );
};
// =================================================================
// ▲▲▲ FIM DO COMPONENTE DE HISTÓRICO ▲▲▲
// =================================================================


// =================================================================
// ▼▼▼ COMPONENTE PRINCIPAL (InvestmentsScreen - Sem Alterações) ▼▼▼
// =================================================================
export const InvestmentsScreen: React.FC<InvestmentsScreenProps> = ({ onNavigate }) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);
  const [activeView, setActiveView] = useState<'simulate' | 'history'>('simulate');

  // --- useEffect (Buscar Saldo) ---
  useEffect(() => {
    const fetchUserBalance = () => {
      const currentPeriod = getCurrentPeriod();
      const summary = dataManager.getFinancialSummary(currentPeriod);
      if (summary && typeof summary.balance === 'number') {
        setUserBalance(summary.balance);
      }
    };
    window.addEventListener('authChange', fetchUserBalance);
    fetchUserBalance();
    return () => window.removeEventListener('authChange', fetchUserBalance);
  }, []);

  // --- useEffect (Buscar Ações da API) ---
  useEffect(() => {
    if (activeView === 'simulate') {
      const fetchStocks = async () => {
        setIsLoading(true);
        const cacheKey = 'stocksCache';
        const cachedData = sessionStorage.getItem(cacheKey);
        const now = new Date().getTime();
        if (cachedData) {
          const { timestamp, data } = JSON.parse(cachedData);
          if (now - timestamp < 3600000) {
            setStocks(data);
            setFilteredStocks(data);
            setIsLoading(false);
            return;
          }
        }
        try {
          const response = await fetch('https://brapi.dev/api/quote/list');
          const data = await response.json();
          if (data && data.stocks) {
            const cachePayload = { timestamp: now, data: data.stocks };
            sessionStorage.setItem(cacheKey, JSON.stringify(cachePayload));
            setStocks(data.stocks);
            setFilteredStocks(data.stocks);
          }
        } catch (error) {
          console.error("Erro ao buscar dados da API da bolsa:", error);
          alert("Não foi possível carregar os dados das ações. Tente novamente mais tarde.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchStocks();
    }
  }, [activeView]);

  // --- useEffect (Filtrar Ações) ---
  useEffect(() => {
    const results = stocks.filter(stock =>
      stock.stock.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStocks(results);
  }, [searchTerm, stocks]);

  // --- Constantes e Handlers (Sem alteração) ---
  const totalCost = selectedStock ? selectedStock.close * purchaseAmount : 0;
  const validPurchaseAmount = Math.floor(purchaseAmount); 
  const isPurchaseDisabled = !selectedStock || totalCost <= 0 || totalCost > userBalance || validPurchaseAmount < 1;

  const handleSelectStock = useCallback((stock: Stock) => {
    setSelectedStock(stock);
    setPurchaseAmount(1);
  }, []); 

  const handleSimulatePurchase = useCallback(() => {
    if (isPurchaseDisabled || !selectedStock) return;
    const transactionData = {
      description: `Compra de ${validPurchaseAmount}x ${selectedStock.stock}`,
      amount: totalCost,
      type: 'expense' as 'expense',
      category: 'Investimentos',
      date: new Date().toISOString().split('T')[0],
      investmentData: {
        stockCode: selectedStock.stock,
        quantity: validPurchaseAmount,
        purchasePrice: selectedStock.close, 
        logo: selectedStock.logo 
      }
    };
    onNavigate('main');
    dataManager.addTransaction(transactionData)
      .then(transaction => {
        if (transaction) {
          window.dispatchEvent(new CustomEvent('datachanged'));
        } else {
          console.error('Falha ao registrar a transação em segundo plano.');
        }
      })
      .catch(error => {
        console.error("Erro ao registrar o investimento em segundo plano:", error);
      });
  }, [isPurchaseDisabled, selectedStock, totalCost, onNavigate, validPurchaseAmount]);

  // --- Renderização (JSX - Sem alteração) ---
  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 order-2 sm:order-1">
          {activeView === 'simulate' ? 'Simular Investimentos' : 'Minhas Compras Simuladas'}
        </h1>
        <div className="flex items-center w-full sm:w-auto order-1 sm:order-2">
          <button style={{ marginRight: '50px' }}
            onClick={() => onNavigate('main')}
            className="flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors px-3 py-2 rounded-xl hover:bg-blue-50 text-sm"
          >
            <svg className="w-4 h-4" style={{ marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Voltar
          </button>
        </div>
      </header>

      <div className="mb-6 flex border-b border-slate-300">
        <button
          onClick={() => setActiveView('simulate')}
          className={`py-2 px-4 text-sm sm:text-base font-semibold ${
            activeView === 'simulate'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Simular Nova Compra
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`py-2 px-4 text-sm sm:text-base font-semibold ${
            activeView === 'history'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Minhas Compras
        </button>
      </div>

      {activeView === 'simulate' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-scale">
          {/* (Vista de Simulação - sem alteração) */}
          <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-800 mb-2">Ações Disponíveis (B3)</h2>
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 mb-4"
            />
            {isLoading ? (
              <p className="text-slate-500 text-center p-4">Carregando ações...</p>
            ) : (
              <div className="space-y-2 h-[55vh] md:h-[60vh] overflow-y-auto">
                {filteredStocks.map(stock => (
                  <div 
                    key={stock.stock} 
                    onClick={() => handleSelectStock(stock)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedStock?.stock === stock.stock ? 'border-green-500 bg-green-50' : 'border-transparent hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={stock.logo} alt={`Logo ${stock.name}`} className="w-10 h-10 rounded-full bg-white border border-slate-200"/>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800">{stock.stock}</p>
                        <p className="text-xs text-slate-600 truncate">{stock.name}</p>
                      </div>
                      <p className="font-semibold text-slate-700">R$ {stock.close.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-500 mb-2">Saldo Atual Disponível</h2>
              <p className="text-3xl font-bold text-blue-600">
                R$ {userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {selectedStock ? (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 mb-4">
                  <img src={selectedStock.logo} alt={`Logo ${selectedStock.name}`} className="w-12 h-12 rounded-full bg-white border border-slate-200"/>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedStock.name} ({selectedStock.stock})</h3>
                    <p className="text-lg font-semibold text-slate-600">Preço atual: R$ {selectedStock.close.toFixed(2)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor='purchaseAmount' className="block text-sm font-medium text-slate-700">Quantidade a comprar</label>
                    <input
                      id='purchaseAmount'
                      type="number"
                      min="1"
                      step="1"
                      value={purchaseAmount}
                      onChange={e => setPurchaseAmount(Number(e.target.value))}
                      onBlur={e => {
                        const validAmount = Math.max(1, Math.floor(Number(e.target.value)));
                        setPurchaseAmount(validAmount);
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm font-semibold text-slate-500">Custo Total da Simulação:</p>
                    <p className={`text-2xl font-bold ${totalCost > userBalance ? 'text-red-600' : 'text-slate-800'}`}>
                      R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {totalCost > userBalance && (
                      <p className="text-xs text-red-600 mt-1">Saldo insuficiente para esta operação.</p>
                    )}
                  </div>
                  <button 
                    onClick={handleSimulatePurchase}
                    disabled={isPurchaseDisabled}
                    className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl text-lg transition-all shadow-md
                               enabled:hover:bg-green-700 enabled:hover:shadow-lg 
                               disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Simular Compra
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center h-64 flex flex-col justify-center items-center">
                <p className="text-slate-600 font-semibold">Selecione uma ação na lista ao lado</p>
                <p className="text-sm text-slate-500">para iniciar uma simulação de compra.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in-scale">
          <MyInvestmentsHistory />
        </div>
      )}
    </div>
  );
};