/**
 * SummaryScreen - Tela de resumo e comparações
 * Design profissional corporativo com WCAG 2.1 compliance
 * VERSÃO CORRIGIDA COM GRÁFICOS FUNCIONAIS E EXPORTAÇÃO DE DADOS
 * CORREÇÃO: Responsividade aprimorada e posicionamento correto da legenda dos gráficos
 */

import React, { useState, useEffect, useRef } from 'react';
import dataManager from '../core/DataManager';
import { 
  formatCurrency, 
  formatPeriod, 
  getCurrentPeriod, 
  getPreviousPeriod,
  getNextPeriod,
  formatPercentage,
  getCategoryColor
} from '../utils/formatters';

interface SummaryScreenProps {
  onNavigate: (screen: string) => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ onNavigate }) => {
  const [currentPeriod, setCurrentPeriod] = useState(getCurrentPeriod());
  const [currentSummary, setCurrentSummary] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: '', limit: '' });
  const [categoryBudgets, setCategoryBudgets] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    updateSummaryData();
    updateBudgets();
  }, [currentPeriod]);

  useEffect(() => {
    if (currentSummary) {
      // Aguardar um pouco para garantir que os canvas estejam renderizados
      setTimeout(() => {
        renderPieChart();
        renderBarChart();
      }, 100);
    }
  }, [currentSummary]);

  const updateSummaryData = () => {
    const summary = dataManager.getFinancialSummary(currentPeriod);
    const comparisonPeriod = getPreviousPeriod(currentPeriod);
    const comp = dataManager.comparePeriods(comparisonPeriod, currentPeriod);
    
    setCurrentSummary(summary);
    setComparison(comp);
  };

  const updateBudgets = () => {
    const budgets = dataManager.getCategoryBudgets();
    setCategoryBudgets(budgets);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setCurrentPeriod(newPeriod);
  };

  // CORREÇÃO: Renderização do Gráfico de Pizza com legenda posicionada corretamente
  const renderPieChart = () => {
    const canvas = pieChartRef.current;
    if (!canvas || !currentSummary) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamanho do canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const expenses = currentSummary.expensesByCategory || {};
    const categories = Object.keys(expenses);
    const values = Object.values(expenses) as number[];
    const total = values.reduce((sum, val) => sum + val, 0);

    // Limpar canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (total === 0 || categories.length === 0) {
      // Exibir mensagem quando não há dados
      ctx.fillStyle = '#64748b';
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Nenhum gasto registrado', rect.width / 2, rect.height / 2);
      return;
    }

    // CORREÇÃO: Calcular espaço para legenda e ajustar posicionamento do gráfico
    const legendHeight = Math.ceil(categories.length / 2) * 25 + 20; // Altura necessária para legenda
    const availableHeight = rect.height - legendHeight - 40; // Altura disponível para o gráfico
    const centerX = rect.width / 2;
    const centerY = (availableHeight / 2) + 20; // Centralizar no espaço disponível
    const radius = Math.min(centerX - 40, availableHeight / 2 - 20);

    // Cores para as fatias
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
      '#f97316', '#6366f1', '#14b8a6', '#f43f5e'
    ];

    let currentAngle = -Math.PI / 2; // Começar do topo

    // Desenhar fatias
    categories.forEach((category, index) => {
      const value = values[index];
      const percentage = (value / total) * 100;
      const sliceAngle = (value / total) * 2 * Math.PI;

      // Desenhar fatia
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // Desenhar borda
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Desenhar label se a fatia for grande o suficiente
      if (percentage >= 8) {
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage.toFixed(0)}%`, labelX, labelY);
      }

      currentAngle += sliceAngle;
    });

    // CORREÇÃO: Desenhar legenda abaixo do gráfico, fora da área de plotagem
    const legendStartY = centerY + radius + 30;
    const legendItemHeight = 22;
    const legendCols = 2;
    const legendColWidth = rect.width / legendCols;

    categories.forEach((category, index) => {
      const col = index % legendCols;
      const row = Math.floor(index / legendCols);
      const x = col * legendColWidth + 20;
      const y = legendStartY + row * legendItemHeight;

      // Desenhar quadrado colorido
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, 14, 14);

      // Desenhar texto da categoria
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // Truncar texto se for muito longo
      const maxWidth = legendColWidth - 40;
      let text = category;
      if (ctx.measureText(text).width > maxWidth) {
        while (ctx.measureText(text + '...').width > maxWidth && text.length > 0) {
          text = text.slice(0, -1);
        }
        text += '...';
      }
      
      ctx.fillText(text, x + 20, y);
    });
  };

  // CORREÇÃO: Renderização do Gráfico de Barras com legenda posicionada corretamente
  const renderBarChart = () => {
    const canvas = barChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamanho do canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Obter dados dos últimos 6 meses
    const monthlyData = dataManager.getMonthlyComparison(6);
    
    // Limpar canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (monthlyData.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Dados insuficientes', rect.width / 2, rect.height / 2);
      return;
    }

    // CORREÇÃO: Reservar espaço para legenda no topo
    const legendHeight = 30;
    const padding = 50;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2 - legendHeight;
    const barWidth = chartWidth / (monthlyData.length * 2.5);

    // Encontrar valor máximo para escala
    const maxValue = Math.max(...monthlyData.flatMap(d => [d.income, d.expenses]));
    const scale = maxValue > 0 ? chartHeight / (maxValue * 1.1) : 1;

    // CORREÇÃO: Desenhar legenda no topo, fora da área do gráfico
    const legendY = 15;
    
    // Receitas
    ctx.fillStyle = '#10b981';
    ctx.fillRect(padding, legendY, 12, 12);
    ctx.fillStyle = '#374151';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Receitas', padding + 18, legendY);

    // Gastos
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(padding + 80, legendY, 12, 12);
    ctx.fillText('Gastos', padding + 98, legendY);

    // Ajustar posição do gráfico para baixo da legenda
    const chartStartY = legendHeight + padding;

    // Desenhar eixos
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Eixo Y
    ctx.moveTo(padding, chartStartY);
    ctx.lineTo(padding, rect.height - padding);
    // Eixo X
    ctx.lineTo(rect.width - padding, rect.height - padding);
    ctx.stroke();

    // Desenhar linhas de grade horizontais
    const gridLines = 5;
    for (let i = 1; i <= gridLines; i++) {
      const y = rect.height - padding - (chartHeight / gridLines) * i;
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();

      // Labels do eixo Y
      const value = (maxValue / gridLines) * i;
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatCurrency(value), padding - 5, y);
    }

    // Desenhar barras
    monthlyData.forEach((data, index) => {
      const x = padding + index * (barWidth * 2.5);
      const baseY = rect.height - padding;

      // Barra de receitas (verde)
      const incomeHeight = data.income * scale;
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x, baseY - incomeHeight, barWidth, incomeHeight);

      // Barra de gastos (vermelha)
      const expenseHeight = data.expenses * scale;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + barWidth + 5, baseY - expenseHeight, barWidth, expenseHeight);

      // Labels dos meses
      ctx.fillStyle = '#374151';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const monthLabel = new Date(data.period + '-01').toLocaleDateString('pt-BR', { month: 'short' });
      ctx.fillText(monthLabel, x + barWidth + 2.5, baseY + 5);
    });
  };

  // Gerenciar orçamentos
  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!budgetForm.category || !budgetForm.limit) return;

    const limit = parseFloat(budgetForm.limit);
    if (limit <= 0) return;

    dataManager.setCategoryBudget(budgetForm.category, limit);
    updateBudgets();
    setBudgetForm({ category: '', limit: '' });
    setShowBudgetModal(false);
  };

  // NOVA FUNCIONALIDADE: Exportar dados
  const handleExport = (format: 'pdf' | 'csv') => {
    const exportData = dataManager.getExportData('current', currentPeriod);
    
    if (format === 'csv') {
      exportToCSV(exportData);
    } else {
      exportToPDF(exportData);
    }
    
    setShowExportModal(false);
  };

  const exportToCSV = (data: any) => {
    if (!data.transactions || data.transactions.length === 0) {
      alert('Não há transações para exportar neste período.');
      return;
    }

    // Obter nome do usuário do localStorage ou fallback
    let userName = '';
    if (window && window.localStorage && window.localStorage.getItem('userName')) {
      userName = window.localStorage.getItem('userName') || '';
    }
    if (!userName) {
      // @ts-ignore
      userName = (window.navigator && window.navigator.userName) || '';
    }
    if (!userName) {
      userName = 'usuário';
    }

    // Saudação personalizada
    const saudacao = `Olá, ${userName}! Seu relatório detalhado do mês ${formatPeriod(data.period)} está pronto.`;

    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    const rows = data.transactions.map((t: any) => [
      t.date,
      `"${t.description}"`,
      `"${t.category}"`,
      t.type === 'income' ? 'Receita' : 'Gasto',
      t.amount.toFixed(2).replace('.', ',')
    ]);

    // Adiciona a saudação como primeira linha, depois o cabeçalho e os dados
    const csvContent = [saudacao, headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');

    // Adicionar BOM para UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orcamais-${data.period}.csv`;
    link.click();
  };

  const exportToPDF = async (data: any) => {
    try {
      // Importar dinamicamente as bibliotecas
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      // Obter nome do usuário do navegador ou de um campo, fallback para 'usuário'
      let userName = '';
      if (window && window.localStorage && window.localStorage.getItem('userName')) {
        userName = window.localStorage.getItem('userName') || '';
      }
      if (!userName) {
        // Tenta pegar do sistema operacional (apenas navegadores que suportam)
        // @ts-ignore
        userName = (window.navigator && window.navigator.userName) || '';
      }
      if (!userName) {
        userName = 'usuário';
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Saudação personalizada
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Olá, ${userName}!`, 20, 18);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Seu relatório detalhado do mês ${formatPeriod(data.period)} está pronto.`, 20, 26);

      // Título
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OrçaMais - Relatório Financeiro', pageWidth / 2, 38, { align: 'center' });

      // Período
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Período: ${formatPeriod(data.period)}`, pageWidth / 2, 48, { align: 'center' });

      let yPosition = 63;

      // Resumo Financeiro
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo Financeiro', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Renda Mensal: ${formatCurrency(data.summary.monthlyIncome)}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Total de Receitas: ${formatCurrency(data.summary.totalIncome)}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Total de Gastos: ${formatCurrency(data.summary.totalExpenses)}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Saldo: ${formatCurrency(data.summary.balance)}`, 20, yPosition);
      yPosition += 15;

      // Transações
      if (data.transactions && data.transactions.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Transações', 20, yPosition);
        yPosition += 10;

        // Cabeçalho da tabela
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Data', 20, yPosition);
        pdf.text('Descrição', 40, yPosition);
        pdf.text('Categoria', 100, yPosition);
        pdf.text('Tipo', 140, yPosition);
        pdf.text('Valor', 170, yPosition);
        yPosition += 5;

        // Linha separadora
        pdf.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 5;

        // Dados das transações
        pdf.setFont('helvetica', 'normal');
        data.transactions.slice(0, 30).forEach((t: any) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.text(t.date, 20, yPosition);
          pdf.text(t.description.substring(0, 25), 40, yPosition);
          pdf.text(t.category, 100, yPosition);
          pdf.text(t.type === 'income' ? 'Receita' : 'Gasto', 140, yPosition);
          pdf.text(formatCurrency(t.amount), 170, yPosition);
          yPosition += 5;
        });

        if (data.transactions.length > 30) {
          yPosition += 5;
          pdf.setFont('helvetica', 'italic');
          pdf.text(`... e mais ${data.transactions.length - 30} transações`, 20, yPosition);
        }
      }

      // Rodapé
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 
                pageWidth / 2, pageHeight - 10, { align: 'center' });

      pdf.save(`orcamais-${data.period}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  if (!currentSummary) return <div>Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header com responsividade melhorada */}
        <header className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-6 border border-blue-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 flex items-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <span className="hidden sm:inline">Relatório Detalhado</span>
              <span className="sm:hidden">Relatório</span>
            </h1>
               <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-end">
                  <button
                onClick={() => setShowBudgetModal(true)}
                className="flex items-center bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform text-sm min-w-0 flex-shrink-0"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span className="hidden sm:inline">Definir Orçamentos</span>
                <span className="sm:hidden">Orçamentos</span>
              </button>

              
           

              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform text-sm min-w-0 flex-shrink-0"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden" style={{fontSize: '12.5px'}} >Exportar</span>
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

          {/* Period Navigation */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <button
              onClick={() => handlePeriodChange(getPreviousPeriod(currentPeriod))}
              className="flex items-center text-slate-600 hover:text-slate-800 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-slate-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <div className="mx-4 sm:mx-6 text-center">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">{formatPeriod(currentPeriod)}</h2>
              <p className="text-xs sm:text-sm text-slate-600">Análise detalhada do período</p>
            </div>
            
            <button
              onClick={() => handlePeriodChange(getNextPeriod(currentPeriod))}
              className="flex items-center text-slate-600 hover:text-slate-800 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-slate-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </header>

        {/* Main Stats com responsividade melhorada */}
        <div className="mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {/* Renda Mensal */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 text-center border border-blue-100 hover:shadow-2xl transition-all duration-300">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl mb-2 sm:mb-3 lg:mb-4 shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-blue-800 mb-1 sm:mb-2">Renda Mensal</h3>
              <p className="text-sm sm:text-lg lg:text-2xl font-bold text-blue-900">{formatCurrency(currentSummary.monthlyIncome)}</p>
            </div>

            {/* Total de Receitas */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 text-center border border-emerald-100 hover:shadow-2xl transition-all duration-300">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl mb-2 sm:mb-3 lg:mb-4 shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-emerald-800 mb-1 sm:mb-2">Total de Receitas</h3>
              <p className="text-sm sm:text-lg lg:text-2xl font-bold text-emerald-900">{formatCurrency(currentSummary.totalIncome)}</p>
              {comparison && (
                <p className={`text-xs sm:text-sm mt-1 ${comparison.comparison.incomeChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPercentage(comparison.comparison.incomeChangePercent)} vs anterior
                </p>
              )}
            </div>

            {/* Total de Gastos */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 text-center border border-red-100 hover:shadow-2xl transition-all duration-300">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-red-600 to-pink-700 rounded-xl mb-2 sm:mb-3 lg:mb-4 shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-red-800 mb-1 sm:mb-2">Total de Gastos</h3>
              <p className="text-sm sm:text-lg lg:text-2xl font-bold text-red-900">{formatCurrency(currentSummary.totalExpenses)}</p>
              {comparison && (
                <p className={`text-xs sm:text-sm mt-1 ${comparison.comparison.expenseChange <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPercentage(comparison.comparison.expenseChangePercent)} vs anterior
                </p>
              )}
            </div>

            {/* Saldo */}
            <div className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 text-center border hover:shadow-2xl transition-all duration-300 ${
              currentSummary.balance >= 0 ? 'border-blue-100' : 'border-red-100'
            }`}>
              <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl mb-2 sm:mb-3 lg:mb-4 shadow-lg ${
                currentSummary.balance >= 0 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700' 
                  : 'bg-gradient-to-br from-red-600 to-pink-700'
              }`}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h3 className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${
                currentSummary.balance >= 0 ? 'text-blue-800' : 'text-red-800'
              }`}>Saldo</h3>
           <p className={`text-sm sm:text-lg lg:text-2xl font-bold ${
  currentSummary.balance >= 0 ? 'text-blue-900' : 'text-red-900'
}`}>
  {`R$ ${currentSummary.balance < 0 ? '-' : ''}${formatCurrency(Math.abs(currentSummary.balance)).replace('R$', '').trim()}`}
</p>

              {comparison && (
                <p className={`text-xs sm:text-sm mt-1 ${comparison.comparison.balanceChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {comparison.comparison.balanceChange >= 0 ? '+' : ''}{formatCurrency(comparison.comparison.balanceChange)} vs anterior
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SEÇÃO CORRIGIDA: Gráficos Interativos com legendas posicionadas corretamente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Gráfico de Pizza - Gastos por Categoria */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-6 border border-blue-100">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
              </svg>
              Gastos por Categoria
            </h3>
            <div className="relative">
              <canvas 
                ref={pieChartRef} 
                className="w-full h-64 sm:h-80 cursor-pointer"
                style={{ maxHeight: '320px' }}
                aria-label="Gráfico de pizza mostrando distribuição de gastos por categoria"
              ></canvas>
            </div>
          </div>

          {/* Gráfico de Barras - Receitas x Gastos */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-6 border border-blue-100">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <span className="hidden sm:inline">Receitas x Gastos (Últimos 6 Meses)</span>
              <span className="sm:hidden">Receitas x Gastos</span>
            </h3>
            <div className="relative">
              <canvas 
                ref={barChartRef} 
                className="w-full h-64 sm:h-80 cursor-pointer"
                style={{ maxHeight: '320px' }}
                aria-label="Gráfico de barras comparando receitas e gastos dos últimos 6 meses"
              ></canvas>
            </div>
          </div>
        </div>

        {/* Transaction Summary com responsividade melhorada */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-blue-100">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <span className="hidden sm:inline">Resumo de Transações - {formatPeriod(currentPeriod)}</span>
            <span className="sm:hidden">Transações - {formatPeriod(currentPeriod)}</span>
          </h2>
          
          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-blue-700 mb-1 sm:mb-2">{currentSummary.transactionCount}</div>
              <div className="text-xs sm:text-sm text-blue-600 font-semibold">Total de Transações</div>
            </div>

            <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl border border-emerald-200">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-emerald-700 mb-1 sm:mb-2">
                {currentSummary.transactions.filter((t: any) => t.type === 'income').length}
              </div>
              <div className="text-xs sm:text-sm text-emerald-600 font-semibold">Receitas</div>
            </div>

            <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-red-50 to-pink-100 rounded-2xl border border-red-200">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-red-700 mb-1 sm:mb-2">
                {currentSummary.transactions.filter((t: any) => t.type === 'expense').length}
              </div>
              <div className="text-xs sm:text-sm text-red-600 font-semibold">Gastos</div>
            </div>
          </div>

          {currentSummary.transactions.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-800 mb-4 text-sm sm:text-base lg:text-lg">💎 Maiores Transações do Período</h3>
              <div className="space-y-3">
                {currentSummary.transactions
                  .sort((a: any, b: any) => b.amount - a.amount)
                  .slice(0, 5)
                  .map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 sm:p-4 lg:p-5 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-3 sm:mr-4 flex-shrink-0 ${
                          transaction.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-800 text-xs sm:text-sm lg:text-base truncate">{transaction.description}</div>
                          <div className="text-xs sm:text-sm text-slate-600 truncate">{transaction.category}</div>
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className={`font-bold text-xs sm:text-sm lg:text-base ${
                          transaction.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500">{transaction.date}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {currentSummary.transactions.length === 0 && (
            <div className="text-center py-8 sm:py-12 lg:py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-2">Nenhuma transação registrada</h3>
              <p className="text-sm sm:text-base text-slate-500">Nenhuma transação foi registrada em {formatPeriod(currentPeriod)}.</p>
              <p className="text-sm sm:text-base text-slate-500 mt-1">Volte para a tela principal para adicionar transações.</p>
            </div>
          )}
        </div>

        {/* Modal de Orçamentos com responsividade melhorada */}
        {showBudgetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">Definir Orçamentos</h3>
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleBudgetSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={budgetForm.category}
                    onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {dataManager.getCategories().map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Limite Mensal
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={budgetForm.limit}
                      onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBudgetModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm sm:text-base font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 text-sm sm:text-base font-medium"
                  >
                    Definir Orçamento
                  </button>
                </div>
              </form>

              {/* Lista de orçamentos existentes */}
              {categoryBudgets.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-3 text-sm sm:text-base">Orçamentos Definidos</h4>
                  <div className="space-y-2">
                    {categoryBudgets.map((budget) => (
                      <div key={budget.category} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <span className="font-medium text-sm sm:text-base">{budget.category}</span>
                        <span className="text-xs sm:text-sm text-slate-600">{formatCurrency(budget.limit)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Exportação com responsividade melhorada */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">Exportar Dados</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 text-sm sm:text-base">
                  Exportar dados do período: <strong>{formatPeriod(currentPeriod)}</strong>
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex flex-col items-center p-3 sm:p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span className="font-semibold text-sm sm:text-base">Excel/CSV</span>
                    <span className="text-xs text-slate-500">Planilha</span>
                  </button>

                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex flex-col items-center p-3 sm:p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span className="font-semibold text-sm sm:text-base">PDF</span>
                    <span className="text-xs text-slate-500">Documento</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors mt-4 text-sm sm:text-base font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};