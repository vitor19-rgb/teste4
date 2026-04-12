import React, { useState, useEffect, useMemo } from 'react';
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
  targetCurrency?: string;
}

// DICIONÁRIO DE BANDEIRAS E TRADUÇÕES
const POPULAR_CURRENCIES_INFO: Record<string, { flag: string, popular: boolean, ptName?: string }> = {
  'USD': { flag: '🇺🇸', popular: true, ptName: 'Dólar Americano' },
  'EUR': { flag: '🇪🇺', popular: true, ptName: 'Euro' },
  'GBP': { flag: '🇬🇧', popular: true, ptName: 'Libra Esterlina' },
  'JPY': { flag: '🇯🇵', popular: true, ptName: 'Iene Japonês' },
  'BRL': { flag: '🇧🇷', popular: true, ptName: 'Real Brasileiro' },
  'CAD': { flag: '🇨🇦', popular: false, ptName: 'Dólar Canadiano' },
  'AUD': { flag: '🇦🇺', popular: false, ptName: 'Dólar Australiano' },
  'CHF': { flag: '🇨🇭', popular: false, ptName: 'Franco Suíço' },
  'CNY': { flag: '🇨🇳', popular: false, ptName: 'Yuan Chinês' },
  'ARS': { flag: '🇦🇷', popular: false, ptName: 'Peso Argentino' },
  'CLP': { flag: '🇨🇱', popular: false, ptName: 'Peso Chileno' },
  'MXN': { flag: '🇲🇽', popular: false, ptName: 'Peso Mexicano' },
  'RUB': { flag: '🇷🇺', popular: false, ptName: 'Rublo Russo' },
  'INR': { flag: '🇮🇳', popular: false, ptName: 'Rupia Indiana' },
};

export const DreamsScreen: React.FC<DreamsScreenProps> = ({ onNavigate }) => {
  const [dreams, setDreams] = useState<Dream[]>([]); 
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [apiCurrencies, setApiCurrencies] = useState<Array<{code: string, name: string, flag: string, popular: boolean}>>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    totalValue: '',
    calculationType: 'date',
    targetDate: '',
    monthlyAmount: '',
    isInternational: false,
    targetCurrency: 'USD'
  });
  
  const [currencySearch, setCurrencySearch] = useState('');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoDream, setInfoDream] = useState<Dream | null>(null);
  const [infoProjection, setInfoProjection] = useState<any>(null);
  
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  useEffect(() => { 
    updateDreams(); 
    fetchSupportedCurrencies(); 
  }, []);

  const updateDreams = () => {
    const userDreams = dataManager.getDreams();
    setDreams(userDreams);
  };

  const fetchSupportedCurrencies = async () => {
    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/e62a26d919249617b1335821/codes`);
      const data = await response.json();
      
      if (data.result === 'success') {
        const formatted = data.supported_codes.map(([code, apiName]: [string, string]) => {
          const info = POPULAR_CURRENCIES_INFO[code];
          return {
            code,
            name: info?.ptName || apiName, 
            flag: info?.flag || '$',
            popular: info?.popular || false
          };
        });
        setApiCurrencies(formatted);
      }
    } catch (error) {
      console.error("Erro ao carregar as moedas da API:", error);
    } finally {
      setIsLoadingCurrencies(false);
    }
  };

  const filteredCurrencies = useMemo(() => {
    const search = currencySearch.toLowerCase();
    return apiCurrencies.filter(c => 
      c.code.toLowerCase().includes(search) || 
      c.name.toLowerCase().includes(search)
    );
  }, [currencySearch, apiCurrencies]);

  const popularCurrencies = apiCurrencies.filter(c => c.popular);

  const calculateDreamProjection = (dream: Dream) => {
    const remaining = dream.totalValue - dream.savedAmount;
    if (remaining <= 0) return { type: 'completed' };
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (dream.calculationType === 'date' && dream.targetDate) {
      const target = new Date(dream.targetDate);
      target.setUTCHours(0, 0, 0, 0);
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const diffMonths = Math.max(1, Math.ceil(diffDays / 30.44));
      if (diffDays <= 0) return { type: 'expired', daysLate: Math.abs(diffDays) };
      return { type: 'date', remaining, months: diffMonths, days: diffDays, monthlyRequired: remaining / diffMonths, targetDate: target };
    } else if (dream.calculationType === 'monthly' && dream.monthlyAmount) {
      const monthsNeeded = Math.ceil(remaining / dream.monthlyAmount);
      const estimatedDate = new Date(today);
      estimatedDate.setMonth(today.getMonth() + monthsNeeded);
      return { type: 'monthly', remaining, monthsNeeded, estimatedDate, monthlyAmount: dream.monthlyAmount };
    }
    return null;
  };

  const formatForeignCurrency = (value: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currencyCode }).format(value);
    } catch {
      return `${currencyCode} ${value.toFixed(2)}`;
    }
  };

  const openInfoModal = async (e: React.MouseEvent, dream: Dream) => {
    e.stopPropagation();
    const projection = calculateDreamProjection(dream);
    setInfoDream(dream);
    setInfoProjection(projection);
    setIsInfoModalOpen(true);
    setExchangeRate(null);

    if (dream.targetCurrency) {
      setIsFetchingRate(true);
      try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/e62a26d919249617b1335821/latest/BRL`);
        const data = await response.json();
        if (data.result === 'success' && data.conversion_rates[dream.targetCurrency]) {
          setExchangeRate(data.conversion_rates[dream.targetCurrency]);
        }
      } catch (error) {
        console.error("Erro na API:", error);
      } finally {
        setIsFetchingRate(false);
      }
    }
  };

  const closeInfoModal = () => { setIsInfoModalOpen(false); setInfoDream(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.totalValue) return;

    const dreamData: any = {
      name: formData.name,
      totalValue: parseFloat(formData.totalValue),
      calculationType: formData.calculationType as 'date' | 'monthly',
      targetDate: formData.targetDate || undefined,
      monthlyAmount: formData.monthlyAmount ? parseFloat(formData.monthlyAmount) : undefined,
      targetCurrency: formData.isInternational ? formData.targetCurrency : undefined
    };

    const newDream = await dataManager.addDream(dreamData);
    if (newDream) {
      updateDreams();
      setShowAddModal(false);
      resetFormData();
    } else {
      alert('Erro ao salvar o sonho.');
    }
  };

  const handleDelete = async (e: React.MouseEvent, dreamId: string) => {
    e.stopPropagation(); 
    const dreamToCancel = dreams.find(d => d.id === dreamId);
    if (!dreamToCancel) return; 

    if (window.confirm(`Tem certeza que deseja apagar o sonho "${dreamToCancel.name}"?`)) {
      const savedAmount = dreamToCancel.savedAmount; 
      const success = await dataManager.removeDream(dreamId);
      if (success) {
        if (savedAmount > 0) {
          try {
            await dataManager.addTransaction({
              description: `Valor devolvido (sonho cancelado): ${dreamToCancel.name}`, amount: savedAmount, type: 'income', category: 'Sonhos', date: new Date().toISOString().split('T')[0],
            });
          } catch (error) {}
        }
        updateDreams();
        window.dispatchEvent(new CustomEvent('datachanged')); 
      }
    }
  };

  const resetFormData = () => {
    setFormData({ name: '', totalValue: '', calculationType: 'date', targetDate: '', monthlyAmount: '', isInternational: false, targetCurrency: 'USD' });
    setCurrencySearch('');
    setCalculationResult(null);
    setIsCurrencyDropdownOpen(false);
  };

  useEffect(() => {
    const total = parseFloat(formData.totalValue);
    if (total > 0) {
       if (formData.calculationType === 'date' && formData.targetDate) {
          const diffMonths = Math.ceil((new Date(formData.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30.44));
          if (diffMonths > 0) setCalculationResult({ message: `Você precisa guardar ${formatCurrency(total / diffMonths)} por mês para atingir o objetivo.` });
          else setCalculationResult({ message: 'A data alvo deve ser no futuro.' });
       } else if (formData.calculationType === 'monthly' && formData.monthlyAmount) {
          const months = Math.ceil(total / parseFloat(formData.monthlyAmount));
          setCalculationResult({ message: `Você atingirá seu objetivo em aproximadamente ${months} meses.` });
       }
    } else {
      setCalculationResult(null);
    }
  }, [formData]);

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDream || isSubmitting) return;
    const amount = parseFloat(contributionAmount);
    const summary = dataManager.getFinancialSummary(getCurrentPeriod());
    if (summary.balance < amount) { alert("Saldo insuficiente."); return; }

    setIsSubmitting(true);
    try {
      await dataManager.addTransaction({ description: `Contribuição Sonho: ${selectedDream.name}`, amount, type: 'expense', category: 'Sonhos', date: new Date().toISOString().split('T')[0] });
      await dataManager.updateDreamSavings(selectedDream.id, selectedDream.savedAmount + amount);
      updateDreams();
      window.dispatchEvent(new CustomEvent('datachanged'));
      setIsContributionModalOpen(false);
      setContributionAmount('');
    } finally { setIsSubmitting(false); }
  };

  const getSelectedCurrencyInfo = (code: string) => {
    return apiCurrencies.find(c => c.code === code) || { name: code, flag: '$' };
  };

  return (
    <div className="min-h-screen bg-slate-100 p-5">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 order-2 sm:order-1">Simulador de Sonhos</h1>
        <div className="flex items-center w-full sm:w-auto order-1 sm:order-2">
          <button onClick={() => onNavigate('main')} className="flex items-center text-blue-600 hover:text-blue-700 font-semibold px-3 py-2 rounded-xl hover:bg-blue-50 text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Voltar
          </button>
          {/* Botão sem o efeito de hover */}
          <button onClick={() => { resetFormData(); setShowAddModal(true); }} className="flex-1 sm:flex-none ml-auto bg-gradient-to-r from-purple-600 to-pink-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition-all text-sm">
            + Simular Novo Sonho
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dreams.length === 0 && !showAddModal && (
          <div className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border-slate-200 text-center">
            <p className="text-slate-600 font-semibold">Nenhum sonho simulado ainda.</p>
          </div>
        )}

        {dreams.map(dream => {
          const percentage = (dream.savedAmount / dream.totalValue) * 100;
          return (
            <div key={dream.id} className="bg-white p-6 rounded-2xl shadow-sm relative border-2 border-transparent hover:border-purple-300 transition-all group">
               <div className="absolute top-3 right-3 flex gap-2">
                 <button onClick={(e) => openInfoModal(e, dream)} className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 hover:scale-110 transition-all" title="Ver detalhes"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                 <button onClick={(e) => handleDelete(e, dream.id)} className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 hover:scale-110 transition-all" title="Excluir"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
               </div>

               <h3 className="font-bold text-lg text-purple-900 mb-2 pr-16 truncate">
                 {dream.targetCurrency && <span className="mr-1 text-slate-500">{getSelectedCurrencyInfo(dream.targetCurrency).flag}</span>}
                 {dream.name}
               </h3>
               <p className="text-sm text-slate-600">Objetivo: <span className="font-bold text-purple-700">{formatCurrency(dream.totalValue)}</span></p>
               <p className="text-sm text-slate-600">Guardado: <span className="font-bold text-green-600">{formatCurrency(dream.savedAmount)}</span></p>
               
               <div className="w-full bg-slate-300 rounded-full h-4 mt-4 mb-2 overflow-hidden border border-purple-200">
                 <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
               </div>
               <p className="text-right text-sm font-semibold text-purple-800">{percentage.toFixed(1)}%</p>
               
               <button onClick={() => { setSelectedDream(dream); setIsContributionModalOpen(true); }} className="mt-5 w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-purple-700 transition-all text-sm disabled:bg-slate-300" disabled={dream.savedAmount >= dream.totalValue}>
                 {dream.savedAmount >= dream.totalValue ? 'Sonho Atingido!' : '+ Adicionar Valor'}
               </button>
            </div>
          );
        })}
      </div>

      {/* --- MODAL DE INFORMAÇÕES --- */}
      {isInfoModalOpen && infoDream && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closeInfoModal}>
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full animate-fade-in-scale relative" onClick={e => e.stopPropagation()}>
            <button onClick={closeInfoModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <h3 className="text-xl font-bold text-slate-800 mb-1 pr-6">{infoDream.name}</h3>
            <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-4">Detalhes do Planejamento</p>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between mb-1 text-sm"><span className="text-slate-500">Já guardado</span><span className="font-bold text-green-600">{formatCurrency(infoDream.savedAmount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Falta</span><span className="font-bold text-purple-600">{formatCurrency(infoDream.totalValue - infoDream.savedAmount)}</span></div>
              </div>

              {infoDream.targetCurrency && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <h4 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-1">
                    <span className="text-lg">{getSelectedCurrencyInfo(infoDream.targetCurrency).flag}</span> Câmbio ({infoDream.targetCurrency})
                  </h4>
                  {isFetchingRate ? <p className="text-sm text-yellow-600 animate-pulse">A procurar cotação...</p> : exchangeRate ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-yellow-700">Guardado:</span><span className="font-bold text-green-700">{formatForeignCurrency(infoDream.savedAmount * exchangeRate, infoDream.targetCurrency)}</span></div>
                      <div className="flex justify-between"><span className="text-yellow-700">Objetivo:</span><span className="font-bold text-purple-700">{formatForeignCurrency(infoDream.totalValue * exchangeRate, infoDream.targetCurrency)}</span></div>
                      <p className="text-[10px] text-yellow-600 mt-2 italic">*1 BRL = {exchangeRate.toFixed(4)} {infoDream.targetCurrency}</p>
                    </div>
                  ) : <p className="text-sm text-red-500">Falha ao carregar cotação.</p>}
                </div>
              )}

              {infoProjection && infoProjection.type === 'date' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                   <p className="text-blue-800 font-semibold mb-2 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Meta: {infoProjection.targetDate.toLocaleDateString('pt-BR')}</p>
                   <p className="text-xs text-blue-500">Para atingir a meta, guarde:</p>
                   <p className="text-xl font-bold text-blue-700">{formatCurrency(infoProjection.monthlyRequired)} <span className="text-xs font-normal">/mês</span></p>
                </div>
              )}
            </div>
            <button onClick={closeInfoModal} className="w-full mt-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Fechar</button>
          </div>
        </div>
      )}

      {/* --- MODAL DE ADICIONAR SONHO --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Simular Novo Sonho</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Nome do Sonho</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-xl" placeholder="Ex: Viagem ao Japão" required /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Valor Total (R$)</label><input type="number" value={formData.totalValue} onChange={e => setFormData({...formData, totalValue: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-xl" placeholder="Ex: 20000" required /></div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="flex items-center cursor-pointer">
                  {/* ALTERADO AQUI: Checkbox garantidamente mais pequeno no telemóvel e maior em desktop */}
                <input type="checkbox" checked={formData.isInternational} onChange={e => setFormData({...formData, isInternational: e.target.checked})} className="!w-5 !h-5 md:!w-5 transform scale-[0.6] md:scale-100 lg:scale-125 origin-left text-purple-600 rounded border-slate-300 cursor-pointer"  />
                  <span className="ml-2 md:ml-3 text-xs md:text-sm font-bold text-slate-700">Viagem internacional?</span>
                </label>
                
                {formData.isInternational && (
                  <div className="mt-4 relative">
                    <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wider">MOEDA DE DESTINO</label>
                    <button type="button" onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)} className="w-full p-3 border border-slate-300 rounded-xl bg-white text-left flex justify-between items-center shadow-sm hover:border-purple-400" disabled={isLoadingCurrencies}>
                      {isLoadingCurrencies ? (
                        <span className="text-slate-500 animate-pulse">A carregar todas as moedas...</span>
                      ) : (
                        <span className="flex items-center text-slate-700">
                          <span className="text-xl mr-2 text-slate-500 font-bold">{getSelectedCurrencyInfo(formData.targetCurrency).flag}</span>
                          {getSelectedCurrencyInfo(formData.targetCurrency).name} ({formData.targetCurrency})
                        </span>
                      )}
                      <svg className={`w-5 h-5 text-slate-500 transition-transform ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </button>

                    {isCurrencyDropdownOpen && !isLoadingCurrencies && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 max-h-72 flex flex-col">
                        <div className="relative mb-3">
                          <svg className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                          <input autoFocus type="text" placeholder="Procurar (ex: Peso, USD)..." className="w-full pl-10 pr-3 py-2.5 bg-slate-100 border-none rounded-xl text-sm outline-none" value={currencySearch} onChange={e => setCurrencySearch(e.target.value)} />
                        </div>
                        
                        <div className="overflow-y-auto pr-1">
                          {currencySearch === '' && (
                            <div className="mb-2">
                              <p className="text-[11px] font-bold text-slate-400 px-2 mb-2 uppercase">Populares</p>
                              {popularCurrencies.map(c => (
                                <button key={c.code} type="button" onClick={() => { setFormData({...formData, targetCurrency: c.code}); setIsCurrencyDropdownOpen(false); }} className="w-full text-left p-2.5 hover:bg-purple-50 rounded-xl text-sm flex justify-between items-center transition-colors">
                                  <span><span className="mr-2 text-lg text-slate-600 font-bold">{c.flag}</span>{c.name}</span> <span className="font-mono font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">{c.code}</span>
                                </button>
                              ))}
                              <div className="h-px bg-slate-200 my-3 mx-2"></div>
                            </div>
                          )}
                          
                          <p className="text-[11px] font-bold text-slate-400 px-2 mb-2 uppercase">Todas as {apiCurrencies.length} Moedas</p>
                          {filteredCurrencies.length > 0 ? filteredCurrencies.map(c => (
                            <button key={c.code} type="button" onClick={() => { setFormData({...formData, targetCurrency: c.code}); setIsCurrencyDropdownOpen(false); }} className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl text-sm flex justify-between items-center transition-colors">
                              <span><span className="mr-2 text-lg text-slate-400 font-bold">{c.flag}</span>{c.name}</span> <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{c.code}</span>
                            </button>
                          )) : <p className="p-4 text-center text-sm text-slate-500">Moeda não encontrada.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <fieldset>
                <legend className="block text-sm font-medium text-slate-700 mb-2">Como deseja calcular?</legend>
                <div className="flex gap-4">
                  <div className="flex items-center"><input type="radio" id="calcDate" value="date" checked={formData.calculationType === 'date'} onChange={e => setFormData({...formData, calculationType: e.target.value})} className="h-4 w-4 text-purple-600" /><label htmlFor="calcDate" className="ml-2 text-sm text-slate-600">Por Data Alvo</label></div>
                  <div className="flex items-center"><input type="radio" id="calcMonthly" value="monthly" checked={formData.calculationType === 'monthly'} onChange={e => setFormData({...formData, calculationType: e.target.value})} className="h-4 w-4 text-purple-600" /><label htmlFor="calcMonthly" className="ml-2 text-sm text-slate-600">Por Valor Mensal</label></div>
                </div>
              </fieldset>

              {formData.calculationType === 'date' ? (
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Data Alvo</label><input type="date" value={formData.targetDate} onChange={e => setFormData({...formData, targetDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-xl" /></div>
              ) : (
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Valor Mensal (R$)</label><input type="number" value={formData.monthlyAmount} onChange={e => setFormData({...formData, monthlyAmount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-xl" placeholder="Ex: 500" /></div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-semibold">Cancelar</button>
                {/* ALTERADO AQUI: Removida a classe hover:from-purple-700 do botão Salvar Sonho */}
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-xl transition-all font-semibold shadow-lg">Salvar Sonho</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE CONTRIBUIÇÃO --- */}
      {isContributionModalOpen && selectedDream && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setIsContributionModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Adicionar Valor</h2>
            <form onSubmit={handleContributionSubmit} className="space-y-4">
              <div><input type="number" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl" placeholder="Ex: 50,00" required step="0.01" min="0.01" autoFocus /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsContributionModalOpen(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold shadow-lg">Confirmar Adição</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
