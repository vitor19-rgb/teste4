import React, { useState, useEffect } from 'react';
import dataManager from '../core/DataManager';
import { formatCurrency, getCurrentPeriod, formatPeriod, getPreviousPeriod, getNextPeriod } from '../utils/formatters';
import { Bold, Weight } from 'lucide-react';

interface MainScreenProps {
  onNavigate: (screen: string) => void;
}

export const AccessibilityEnhancedMainScreen: React.FC<MainScreenProps> = ({ onNavigate }) => {
  const [isLargeFont, setIsLargeFont] = React.useState(false);
  React.useEffect(() => {
    const checkLargeFont = () => {
      setIsLargeFont(document.body.classList.contains('large-font'));
    };
    checkLargeFont();
    const observer = new MutationObserver(checkLargeFont);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      const newTheme = dataManager.getCurrentUser?.()?.settings?.theme || 'light';
      dataManager.setUserTheme(newTheme);
    };
    handleThemeChange();
    window.addEventListener('themeChanged', handleThemeChange);
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // ▼▼▼ ADICIONE ESTE NOVO BLOCO DE CÓDIGO ▼▼▼
  useEffect(() => {
    const handleDataChange = () => {
      console.log('Dados atualizados, recarregando resumo...');
      updateSummary();
    };
    
    window.addEventListener('datachanged', handleDataChange);

    return () => {
      window.removeEventListener('datachanged', handleDataChange);
    };
  }, []); // O array vazio garante que isso só rode uma vez

  const [currentPeriod, setCurrentPeriod] = useState(getCurrentPeriod());
  const [summary, setSummary] = useState<any>(null);
  const [editingIncome, setEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'Outros'
  });
  const [showSpendingAlert, setShowSpendingAlert] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
   // Estado mais organizado
const [user, setUser] = useState(dataManager.getCurrentUser());
const [currentPeriod, setCurrentPeriod] = useState(getCurrentPeriod());
const [summary, setSummary] = useState<any>(null);
const [editingIncome, setEditingIncome] = useState(false);
const [tempIncome, setTempIncome] = useState('');
const [formData, setFormData] = useState({
  description: '',
  amount: '',
  type: 'expense',
  category: 'Outros'
});

// Novo listener de login mais seguro
useEffect(() => {
  const handleAuthChange = () => {
    setUser(dataManager.getCurrentUser());
  };
  window.addEventListener('authChange', handleAuthChange);
  if (dataManager.isInitialized && !user) {
      handleAuthChange();
  }
  return () => window.removeEventListener('authChange', handleAuthChange);
}, []);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const categories = dataManager.getCategories();

  useEffect(() => {
    if (user) {
      updateSummary();
    }
  }, [currentPeriod, user]);

  const updateSummary = () => {
    const newSummary = dataManager.getFinancialSummary(currentPeriod);
    setSummary(newSummary);
    
    if (newSummary && newSummary.monthlyIncome > 0) {
      const spendingPercentage = (newSummary.totalExpenses / newSummary.monthlyIncome) * 100;
      setShowSpendingAlert(spendingPercentage >= 90);
    } else {
      setShowSpendingAlert(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;
    
    const transaction = await dataManager.addTransaction({ ...formData, date: currentPeriod + '-01' });
    
    if (transaction) {
      setFormData({ description: '', amount: '', type: 'expense', category: 'Outros' });
      updateSummary();
    } else {
      alert('Erro ao adicionar transação.');
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      const success = await dataManager.removeTransaction(transactionId);
      if (success) {
        updateSummary();
      } else {
        alert('Erro ao excluir transação.');
      }
    }
  };

  const handleIncomeEdit = () => {
    setEditingIncome(true);
    setTempIncome(summary?.monthlyIncome?.toString() || '');
  };

  const handleIncomeSave = async () => {
    const amount = parseFloat(tempIncome) || 0;
    const success = await dataManager.setMonthlyIncome(currentPeriod, amount);
    
    if (success) {
      setEditingIncome(false);
      updateSummary();
    } else {
      alert('Erro ao salvar a renda mensal.');
    }
  };

  const handleIncomeCancel = () => {
    setEditingIncome(false);
    setTempIncome('');
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

  const getDailyIncome = () => {
    if (!summary || summary.monthlyIncome <= 0) return 0;
    return summary.monthlyIncome / 30;
  };
  
  const getAnnualIncome = () => {
    if (!summary || summary.monthlyIncome <= 0) return 0;
    return summary.monthlyIncome * 12;
  };

  const handleComprehensiveExport = (format: 'pdf' | 'csv', dataType: string) => {
    let exportData;
    
    switch (dataType) {
      case 'all-transactions':
        exportData = {
          type: 'all-transactions',
          transactions: dataManager.getAllTransactions(),
          user: dataManager.getCurrentUser()?.profile
        };
        break;
      case 'budgets':
        exportData = {
          type: 'budgets',
          budgets: dataManager.getCategoryBudgets(),
          user: dataManager.getCurrentUser()?.profile
        };
        break;
      case 'dreams':
        exportData = {
          type: 'dreams',
          dreams: dataManager.getDreams(),
          user: dataManager.getCurrentUser()?.profile
        };
        break;
      case 'complete':
        exportData = dataManager.getExportData('all');
        break;
      default:
        return;
    }

    if (format === 'csv') {
      exportComprehensiveToCSV(exportData, dataType);
    } else {
      exportComprehensiveToPDF(exportData, dataType);
    }
    
    setShowExportModal(false);
  };

  const exportComprehensiveToCSV = (data: any, dataType: string) => {
    let csvContent = '';
    let filename = '';

    switch (dataType) {
      case 'all-transactions':
        if (!data.transactions || data.transactions.length === 0) {
          alert('Não há transações para exportar.');
          return;
        }
        const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
        const rows = data.transactions.map((t: any) => [
          t.date,
          `"${t.description}"`,
          `"${t.category}"`,
          t.type === 'income' ? 'Receita' : 'Gasto',
          t.amount.toFixed(2).replace('.', ',')
        ]);
        csvContent = [headers.join(';'), ...rows.map((row: any) => row.join(';'))].join('\n');
        filename = 'orcamais-todas-transacoes.csv';
        break;

      case 'budgets':
        if (!data.budgets || data.budgets.length === 0) {
          alert('Não há orçamentos definidos para exportar.');
          return;
        }
        const budgetHeaders = ['Categoria', 'Limite', 'Gasto', 'Porcentagem', 'Status'];
        const budgetRows = data.budgets.map((b: any) => [
          `"${b.category}"`,
          b.limit.toFixed(2).replace('.', ','),
          b.spent.toFixed(2).replace('.', ','),
          b.percentage.toFixed(1).replace('.', ',') + '%',
          b.status === 'ok' ? 'OK' : b.status === 'warning' ? 'Atenção' : 'Excedido'
        ]);
        csvContent = [budgetHeaders.join(';'), ...budgetRows.map((row: any) => row.join(';'))].join('\n');
        filename = 'orcamais-orcamentos.csv';
        break;

      case 'dreams':
        if (!data.dreams || data.dreams.length === 0) {
          alert('Não há sonhos cadastrados para exportar.');
          return;
        }
        const dreamHeaders = ['Nome', 'Valor Total', 'Valor Economizado', 'Data Alvo', 'Valor Mensal'];
        const dreamRows = data.dreams.map((d: any) => [
          `"${d.name}"`,
          d.totalValue.toFixed(2).replace('.', ','),
          d.savedAmount.toFixed(2).replace('.', ','),
          d.targetDate || 'Não definida',
          d.monthlyAmount ? d.monthlyAmount.toFixed(2).replace('.', ',') : 'Não definido'
        ]);
        csvContent = [dreamHeaders.join(';'), ...dreamRows.map((row: any) => row.join(';'))].join('\n');
        filename = 'orcamais-sonhos.csv';
        break;

      case 'complete':
        csvContent = 'ORCAMAIS - BACKUP COMPLETO\n\n';
        
        csvContent += 'TRANSAÇÕES\n';
        csvContent += 'Data;Descrição;Categoria;Tipo;Valor\n';
        if (data.transactions) {
          data.transactions.forEach((t: any) => {
            csvContent += `${t.date};"${t.description}";"${t.category}";${t.type === 'income' ? 'Receita' : 'Gasto'};${t.amount.toFixed(2).replace('.', ',')}\n`;
          });
        }
        
        csvContent += '\n\nORÇAMENTOS\n';
        csvContent += 'Categoria;Limite\n';
        if (data.categoryBudgets) {
          Object.entries(data.categoryBudgets).forEach(([category, limit]: [string, any]) => {
            csvContent += `"${category}";${limit.toFixed(2).replace('.', ',')}\n`;
          });
        }
        
        csvContent += '\n\nSONHOS\n';
        csvContent += 'Nome;Valor Total;Valor Economizado;Data Alvo;Valor Mensal\n';
        if (data.dreams) {
          data.dreams.forEach((d: any) => {
            csvContent += `"${d.name}";${d.totalValue.toFixed(2).replace('.', ',')};${d.savedAmount.toFixed(2).replace('.', ',')};${d.targetDate || 'Não definida'};${d.monthlyAmount ? d.monthlyAmount.toFixed(2).replace('.', ',') : 'Não definido'}\n`;
          });
        }
        
        filename = 'orcamais-backup-completo.csv';
        break;
    }

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportComprehensiveToPDF = async (data: any, dataType: string) => {
    try {
      const jsPDF = (await import('jspdf')).default;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OrçaMais - Exportação de Dados', pageWidth / 2, 20, { align: 'center' });
      
      let yPosition = 35;
      
      switch (dataType) {
        case 'all-transactions':
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Todas as Transações', 20, yPosition);
          yPosition += 10;
          
          if (data.transactions && data.transactions.length > 0) {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Data', 20, yPosition);
            pdf.text('Descrição', 40, yPosition);
            pdf.text('Categoria', 100, yPosition);
            pdf.text('Tipo', 140, yPosition);
            pdf.text('Valor', 170, yPosition);
            yPosition += 5;
            
            pdf.line(20, yPosition, pageWidth - 20, yPosition);
            yPosition += 5;
            
            pdf.setFont('helvetica', 'normal');
            data.transactions.forEach((t: any) => {
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
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.text('Nenhuma transação encontrada.', 20, yPosition);
          }
          break;

        case 'budgets':
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Orçamentos Definidos', 20, yPosition);
          yPosition += 10;
          
          if (data.budgets && data.budgets.length > 0) {
            data.budgets.forEach((budget: any) => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              
              pdf.setFont('helvetica', 'bold');
              pdf.text(`${budget.category}:`, 20, yPosition);
              pdf.setFont('helvetica', 'normal');
              pdf.text(`Limite: ${formatCurrency(budget.limit)}`, 30, yPosition + 5);
              pdf.text(`Gasto: ${formatCurrency(budget.spent)} (${budget.percentage.toFixed(1)}%)`, 30, yPosition + 10);
              pdf.text(`Status: ${budget.status === 'ok' ? 'OK' : budget.status === 'warning' ? 'Atenção' : 'Excedido'}`, 30, yPosition + 15);
              yPosition += 25;
            });
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.text('Nenhum orçamento definido.', 20, yPosition);
          }
          break;

        case 'dreams':
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Sonhos Cadastrados', 20, yPosition);
          yPosition += 10;
          
          if (data.dreams && data.dreams.length > 0) {
            data.dreams.forEach((dream: any) => {
              if (yPosition > pageHeight - 30) {
                pdf.addPage();
                yPosition = 20;
              }
              
              pdf.setFont('helvetica', 'bold');
              pdf.text(`${dream.name}:`, 20, yPosition);
              pdf.setFont('helvetica', 'normal');
              pdf.text(`Valor Total: ${formatCurrency(dream.totalValue)}`, 30, yPosition + 5);
              pdf.text(`Economizado: ${formatCurrency(dream.savedAmount)}`, 30, yPosition + 10);
              if (dream.targetDate) {
                pdf.text(`Data Alvo: ${new Date(dream.targetDate).toLocaleDateString('pt-BR')}`, 30, yPosition + 15);
              }
              if (dream.monthlyAmount) {
                pdf.text(`Valor Mensal: ${formatCurrency(dream.monthlyAmount)}`, 30, yPosition + 20);
              }
              yPosition += 30;
            });
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.text('Nenhum sonho cadastrado.', 20, yPosition);
          }
          break;
      }
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 
                pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      const filename = dataType === 'all-transactions' ? 'orcamais-todas-transacoes.pdf' :
                      dataType === 'budgets' ? 'orcamais-orcamentos.pdf' :
                      dataType === 'dreams' ? 'orcamais-sonhos.pdf' :
                      'orcamais-backup-completo.pdf';
      
      pdf.save(filename);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  if (!user || !summary) return <div className="text-center p-10">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
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
                <span>Resumo</span>
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
                onClick={() => setShowExportModal(true)}
                className="flex items-center justify-center px-4 py-2 min-w-[110px] bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium shadow-md transition"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Exportar</span>
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
            <div
              className="bg-green-50 dark:bg-[#064E3B] rounded-2xl shadow flex flex-col items-center justify-center mx-auto w-full md:w-auto"
              style={{
                width: '100%',
                maxWidth: '357.33px',
                height: 'auto',
                minHeight: '110px',
                padding: '0',
                marginBottom: '16px',
              }}
            >
              <div className="flex flex-col items-center justify-center w-full h-full py-3">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-green-600 rounded-full mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
                <div className="font-bold text-green-700 dark:text-green-200 text-[1.5rem] leading-tight mb-1" style={{letterSpacing: '-1px'}}>{formatCurrency(summary.totalIncome)}</div>
                <div className="text-base text-green-700 dark:text-green-300 font-medium leading-tight">Receitas Extras</div>
              </div>
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
          <h5 className="text-blue-500 dark:text-blue-light leading-tight break-words font-bold" style={{fontSize: "20px" ,textAlign: 'center'}}>Histórico de Transações</h5> 
          <br />

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
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      transaction.type === 'income' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
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
                        <p className="font-medium text-gray-800 truncate">{transaction.description}</p>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <span>{transaction.date}</span>
                          <span className="mx-2">•</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(transaction.category)} truncate`}>
                            {transaction.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center ml-2 flex-shrink-0">
                      <span className={`text-lg font-bold mr-4 ${
                        transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {transaction.type === 'income' 
                          ? formatCurrency(transaction.amount).replace('R$', 'R$ +') 
                          : formatCurrency(transaction.amount).replace('R$', 'R$ -')}
                      </span>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
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

        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Exportar Dados</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <p className="text-slate-600">
                  Selecione o tipo de dados que deseja exportar:
                </p>

                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800 mb-2">📊 Todas as Transações</h4>
                  <p className="text-sm text-slate-600 mb-3">Exportar todo o histórico de transações</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleComprehensiveExport('csv', 'all-transactions')}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleComprehensiveExport('pdf', 'all-transactions')}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      PDF
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800 mb-2">💰 Orçamentos Definidos</h4>
                  <p className="text-sm text-slate-600 mb-3">Exportar limites e status dos orçamentos</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleComprehensiveExport('csv', 'budgets')}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleComprehensiveExport('pdf', 'budgets')}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      PDF
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800 mb-2">⭐ Sonhos Cadastrados</h4>
                  <p className="text-sm text-slate-600 mb-3">Exportar metas e progresso dos sonhos</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleComprehensiveExport('csv', 'dreams')}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleComprehensiveExport('pdf', 'dreams')}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      PDF
                    </button>
                  </div>
                </div>

                <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                  <h4 className="font-semibold text-blue-800 mb-2">🔄 Backup Completo</h4>
                  <p className="text-sm text-blue-700 mb-3">Exportar todos os dados em um único arquivo</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleComprehensiveExport('csv', 'complete')}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      CSV Completo
                    </button>
                    <button
                      onClick={() => handleComprehensiveExport('pdf', 'complete')}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      PDF Completo
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
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
