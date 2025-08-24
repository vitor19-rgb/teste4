// Em: src/components/InvestmentsScreen.tsx (Versão final com layout responsivo corrigido)

import React, { useState, useEffect } from 'react';
import dataManager from '../core/DataManager';
import { getCurrentPeriod } from '../utils/formatters';

interface Stock {
  stock: string;
  name: string;
  close: number;
  logo: string;
}

interface InvestmentsScreenProps {
  onNavigate: (screen: string) => void;
}

export const InvestmentsScreen: React.FC<InvestmentsScreenProps> = ({ onNavigate }) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);

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

  useEffect(() => {
    const fetchStocks = async () => {
      setIsLoading(true);
      const cacheKey = 'stocksCache';
      const cachedData = sessionStorage.getItem(cacheKey);
      const now = new Date().getTime();

      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        // Usar cache se tiver menos de 1 hora (3600000 ms)
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
          const cachePayload = {
            timestamp: now,
            data: data.stocks
          };
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
  }, []);

  useEffect(() => {
    const results = stocks.filter(stock =>
      stock.stock.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStocks(results);
  }, [searchTerm, stocks]);

  const totalCost = selectedStock ? selectedStock.close * purchaseAmount : 0;
  const isPurchaseDisabled = !selectedStock || totalCost <= 0 || totalCost > userBalance;

  const handleSelectStock = React.useCallback((stock: Stock) => {
    setSelectedStock(stock);
    setPurchaseAmount(1);
  }, []);

  const handleSimulatePurchase = React.useCallback(() => {
    if (isPurchaseDisabled || !selectedStock) return;

    const transactionData = {
      description: `Compra de Ações: ${selectedStock.stock}`,
      amount: totalCost,
      type: 'expense' as 'expense',
      category: 'Investimentos',
      date: new Date().toISOString().split('T')[0]
    };

    // 1. Navega imediatamente para a tela principal. Essa é a resposta visual primária.
    onNavigate('main');

    // 2. A operação de banco de dados é despachada para ocorrer em segundo plano,
    // sem nenhum alerta para não bloquear ou atrasar a renderização no mobile.
    dataManager.addTransaction(transactionData)
      .then(transaction => {
        if (transaction) {
          // 3. Quando a transação for concluída, dispara o evento para atualizar os dados.
          // A tela principal, que já está visível, irá refletir a mudança.
          window.dispatchEvent(new CustomEvent('datachanged'));
        } else {
          console.error('Falha ao registrar a transação em segundo plano.');
        }
      })
      .catch(error => {
        console.error("Erro ao registrar o investimento em segundo plano:", error);
      });
  }, [isPurchaseDisabled, selectedStock, totalCost, onNavigate]);

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      {/* ▼▼▼ CABEÇALHO ATUALIZADO E CORRIGIDO ▼▼▼ */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 order-2 sm:order-1">
          Simular Investimentos
        </h1>
        {/* Este div agora só contém o botão Voltar, resolvendo o problema de alinhamento */}
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
      {/* ▲▲▲ FIM DO CABEÇALHO ATUALIZADO ▲▲▲ */}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna da Esquerda (Lista de Ações) */}
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

        {/* Coluna da Direita (Painel de Simulação) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-500 mb-2">Saldo Atual Disponível</h2>
            <p className="text-3xl font-bold text-blue-600">
              R$ {userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          {selectedStock ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in-scale">
              <div className="flex items-center gap-4 mb-4">
                <img src={selectedStock.logo} alt={`Logo ${selectedStock.name}`} className="w-12 h-12 rounded-full bg-white border border-slate-200"/>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedStock.name} ({selectedStock.stock})</h3>
                  <p className="text-lg font-semibold text-slate-600">Preço atual: R$ {selectedStock.close.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Quantidade a comprar</label>
                  <input
                    type="number"
                    min="1"
                    value={purchaseAmount}
                    onChange={e => setPurchaseAmount(Number(e.target.value))}
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
    </div>
  );
};