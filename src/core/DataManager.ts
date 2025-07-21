/**
 * DataManager - Gerenciador centralizado de dados do OrçaMais
 * Responsável por toda persistência no localStorage e gerenciamento de estado
 * VERSÃO ESTENDIDA COM NOVAS FUNCIONALIDADES
 */

interface UserProfile {
  name: string;
  email: string;
  createdAt: string;
  lastLogin: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  createdAt: string;
}

// NOVA INTERFACE: Orçamento por Categoria
interface CategoryBudget {
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
}

// NOVA INTERFACE: Sonhos/Metas
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

// NOVA INTERFACE: Alertas
interface Alert {
  id: string;
  type: 'budget' | 'dream' | 'general';
  category?: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  createdAt: string;
  dismissed: boolean;
}

interface UserData {
  id: string;
  profile: UserProfile;
  financial: {
    monthlyIncomes: Record<string, number>;
    transactions: Transaction[];
    categories: string[];
    goals: any[];
    // NOVAS PROPRIEDADES
    categoryBudgets: Record<string, number>; // { "Alimentação": 500, "Transporte": 300 }
    dreams: Dream[];
    alerts: Alert[];
  };
  settings: {
    currency: string;
    theme: string;
    notifications: boolean;
  };
}

interface AppData {
  users: Record<string, UserData>;
  currentUserId: string | null;
  version: string;
}

class DataManager {
  /**
   * Altera o tema do usuário e dispara evento para atualizar o modo escuro
   */
  setUserTheme(theme: 'light' | 'dark') {
    if (!this.currentUser) return false;
    this.currentUser.settings.theme = theme;
    this.saveData();
    // Aplica imediatamente a classe no <html>
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    window.dispatchEvent(new Event('themeChanged'));
    return true;
  }
  private STORAGE_KEY = 'orcamais:data';
  private currentUser: UserData | null = null;
  private data: AppData;

  // MAPEAMENTO MELHORADO: Palavras-chave para categorias (mais abrangente)
  private categoryKeywords: Record<string, string[]> = {
    'Alimentação': [
      'supermercado', 'padaria', 'restaurante', 'lanchonete', 'mercado', 'feira', 'açougue', 
      'comida', 'almoço', 'jantar', 'café', 'pizza', 'hambúrguer', 'ifood', 'delivery',
      'mcdonalds', 'burger', 'subway', 'kfc', 'bobs', 'giraffas', 'habib', 'china',
      'japonês', 'sushi', 'churrasco', 'pizzaria', 'sorveteria', 'doceria', 'confeitaria',
      'pão', 'leite', 'carne', 'frango', 'peixe', 'verdura', 'fruta', 'bebida', 'água',
      'refrigerante', 'cerveja', 'vinho', 'cachaça', 'whisky', 'vodka', 'gin'
    ],
    'Transporte': [
      'uber', 'taxi', 'ônibus', 'metro', 'combustível', 'gasolina', 'álcool', 'etanol',
      'estacionamento', 'pedágio', 'transporte', 'viagem', 'passagem', 'avião', 'voo',
      'rodoviária', 'aeroporto', 'carro', 'moto', 'bicicleta', 'patinete', 'scooter',
      'posto', 'shell', 'petrobras', 'ipiranga', 'br', 'ale', 'texaco', 'esso',
      'mecânico', 'oficina', 'pneu', 'óleo', 'revisão', 'seguro', 'ipva', 'licenciamento'
    ],
    'Moradia': [
      'aluguel', 'condomínio', 'água', 'luz', 'energia', 'gás', 'internet', 'telefone',
      'limpeza', 'manutenção', 'reforma', 'casa', 'apartamento', 'imóvel', 'financiamento',
      'prestação', 'iptu', 'taxa', 'administração', 'portaria', 'zelador', 'faxina',
      'material', 'construção', 'tinta', 'cimento', 'tijolo', 'telha', 'porta', 'janela',
      'móvel', 'sofá', 'cama', 'mesa', 'cadeira', 'geladeira', 'fogão', 'micro-ondas'
    ],
    'Saúde': [
      'médico', 'hospital', 'farmácia', 'remédio', 'consulta', 'exame', 'dentista',
      'plano de saúde', 'academia', 'fisioterapia', 'psicólogo', 'nutricionista',
      'laboratório', 'clínica', 'cirurgia', 'internação', 'emergência', 'pronto socorro',
      'medicamento', 'antibiótico', 'vitamina', 'suplemento', 'proteína', 'whey',
      'drogaria', 'drogasil', 'pacheco', 'raia', 'extrafarma', 'nissei', 'panvel',
      'unimed', 'amil', 'bradesco saúde', 'sul américa', 'golden cross', 'hapvida'
    ],
    'Educação': [
      'escola', 'faculdade', 'curso', 'livro', 'material escolar', 'mensalidade',
      'universidade', 'aula', 'professor', 'tutor', 'colégio', 'creche', 'berçário',
      'pós-graduação', 'mestrado', 'doutorado', 'especialização', 'mba', 'técnico',
      'idioma', 'inglês', 'espanhol', 'francês', 'alemão', 'italiano', 'chinês',
      'caderno', 'caneta', 'lápis', 'borracha', 'régua', 'mochila', 'estojo',
      'uniforme', 'sapato', 'tênis', 'merendeira', 'transporte escolar'
    ],
    'Lazer': [
      'cinema', 'teatro', 'parque', 'show', 'festa', 'bar', 'balada', 'viagem',
      'hotel', 'diversão', 'jogo', 'streaming', 'netflix', 'spotify', 'amazon prime',
      'disney', 'globoplay', 'paramount', 'hbo', 'apple tv', 'youtube premium',
      'ingresso', 'evento', 'festival', 'carnaval', 'reveillon', 'aniversário',
      'casamento', 'formatura', 'presente', 'lembrança', 'souvenir', 'turismo',
      'pousada', 'resort', 'cruzeiro', 'excursão', 'passeio', 'museu', 'exposição'
    ],
    'Compras': [
      'roupa', 'sapato', 'shopping', 'loja', 'presente', 'eletrônico', 'celular',
      'computador', 'casa', 'decoração', 'perfume', 'cosmético', 'maquiagem',
      'shampoo', 'condicionador', 'sabonete', 'creme', 'loção', 'desodorante',
      'escova', 'pasta', 'fio dental', 'absorvente', 'papel higiênico', 'detergente',
      'amaciante', 'sabão', 'vassoura', 'rodo', 'pano', 'esponja', 'luva',
      'magazine luiza', 'casas bahia', 'extra', 'ponto frio', 'americanas', 'submarino',
      'mercado livre', 'amazon', 'shopee', 'aliexpress', 'wish', 'olx'
    ]
  };

  constructor() {
    this.data = this.loadData();
    if (this.data.currentUserId && this.data.users[this.data.currentUserId]) {
      this.currentUser = this.data.users[this.data.currentUserId];
      this.migrateUserData(); // Migrar dados para nova estrutura
    }
  }

  /**
   * Migra dados do usuário para nova estrutura (compatibilidade)
   */
  private migrateUserData(): void {
    if (!this.currentUser) return;

    // Adicionar propriedades se não existirem
    if (!this.currentUser.financial.categoryBudgets) {
      this.currentUser.financial.categoryBudgets = {};
    }
    if (!this.currentUser.financial.dreams) {
      this.currentUser.financial.dreams = [];
    }
    if (!this.currentUser.financial.alerts) {
      this.currentUser.financial.alerts = [];
    }

    this.saveData();
  }

  /**
   * FUNCIONALIDADE MELHORADA: Sugestão automática de categoria
   * Agora com algoritmo mais inteligente e palavras-chave expandidas
   */
  suggestCategory(description: string): string {
    if (!description || description.length < 2) return 'Outros';
    
    const descLower = description.toLowerCase().trim();
    
    // Remover acentos para melhor matching
    const removeAccents = (str: string) => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };
    
    const descNormalized = removeAccents(descLower);
    
    // Pontuação para cada categoria baseada na relevância das palavras encontradas
    const categoryScores: Record<string, number> = {};
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      
      for (const keyword of keywords) {
        const keywordNormalized = removeAccents(keyword.toLowerCase());
        
        // Pontuação maior para match exato
        if (descNormalized === keywordNormalized) {
          score += 10;
        }
        // Pontuação alta para palavra completa
        else if (descNormalized.includes(` ${keywordNormalized} `) || 
                 descNormalized.startsWith(`${keywordNormalized} `) ||
                 descNormalized.endsWith(` ${keywordNormalized}`) ||
                 descNormalized === keywordNormalized) {
          score += 5;
        }
        // Pontuação média para substring
        else if (descNormalized.includes(keywordNormalized)) {
          score += 2;
        }
        // Pontuação baixa para palavras similares (distância de edição)
        else if (this.calculateSimilarity(descNormalized, keywordNormalized) > 0.8) {
          score += 1;
        }
      }
      
      if (score > 0) {
        categoryScores[category] = score;
      }
    }
    
    // Retornar a categoria com maior pontuação
    if (Object.keys(categoryScores).length > 0) {
      const bestCategory = Object.keys(categoryScores).reduce((a, b) => 
        categoryScores[a] > categoryScores[b] ? a : b
      );
      
      // Só sugerir se a pontuação for significativa
      if (categoryScores[bestCategory] >= 2) {
        return bestCategory;
      }
    }
    
    return 'Outros';
  }

  /**
   * Calcula similaridade entre duas strings (algoritmo de Jaro-Winkler simplificado)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    if (matchWindow < 0) return 0;
    
    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Identificar matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    // Calcular transposições
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    
    return jaro;
  }

  /**
   * NOVA FUNCIONALIDADE: Gerenciar orçamentos por categoria
   */
  setCategoryBudget(category: string, limit: number): boolean {
    if (!this.currentUser) return false;
    
    this.currentUser.financial.categoryBudgets[category] = limit;
    this.updateBudgetAlerts();
    return this.saveData();
  }

  getCategoryBudgets(): CategoryBudget[] {
    if (!this.currentUser) return [];

    const currentPeriod = this.getCurrentPeriod();
    const transactions = this.getTransactionsByPeriod(currentPeriod);
    const budgets: CategoryBudget[] = [];

    for (const [category, limit] of Object.entries(this.currentUser.financial.categoryBudgets)) {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);

      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      let status: 'ok' | 'warning' | 'exceeded' = 'ok';
      
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      budgets.push({
        category,
        limit,
        spent,
        percentage,
        status
      });
    }

    return budgets;
  }

  /**
   * NOVA FUNCIONALIDADE: Gerenciar sonhos/metas
   */
  addDream(dreamData: Omit<Dream, 'id' | 'createdAt' | 'savedAmount'>): Dream | false {
    if (!this.currentUser) return false;

    const dream: Dream = {
      id: this.generateId(),
      ...dreamData,
      savedAmount: 0,
      createdAt: new Date().toISOString()
    };

    this.currentUser.financial.dreams.push(dream);
    return this.saveData() ? dream : false;
  }

  updateDreamSavings(dreamId: string, savedAmount: number): boolean {
    if (!this.currentUser) return false;

    const dream = this.currentUser.financial.dreams.find(d => d.id === dreamId);
    if (!dream) return false;

    dream.savedAmount = savedAmount;
    return this.saveData();
  }

  getDreams(): Dream[] {
    if (!this.currentUser) return [];
    return [...this.currentUser.financial.dreams];
  }

  removeDream(dreamId: string): boolean {
    if (!this.currentUser) return false;

    const index = this.currentUser.financial.dreams.findIndex(d => d.id === dreamId);
    if (index === -1) return false;

    this.currentUser.financial.dreams.splice(index, 1);
    return this.saveData();
  }

  /**
   * NOVA FUNCIONALIDADE: Sistema de alertas
   */
  private updateBudgetAlerts(): void {
    if (!this.currentUser) return;

    // Limpar alertas antigos de orçamento
    this.currentUser.financial.alerts = this.currentUser.financial.alerts.filter(
      alert => alert.type !== 'budget'
    );

    const budgets = this.getCategoryBudgets();
    
    budgets.forEach(budget => {
      if (budget.status === 'warning' || budget.status === 'exceeded') {
        const alert: Alert = {
          id: this.generateId(),
          type: 'budget',
          category: budget.category,
          message: budget.status === 'exceeded' 
            ? `Orçamento de ${budget.category} excedido! Gasto: R$ ${budget.spent.toFixed(2)} / Limite: R$ ${budget.limit.toFixed(2)}`
            : `Atenção: ${budget.percentage.toFixed(0)}% do orçamento de ${budget.category} utilizado`,
          severity: budget.status === 'exceeded' ? 'error' : 'warning',
          createdAt: new Date().toISOString(),
          dismissed: false
        };

        this.currentUser.financial.alerts.push(alert);
      }
    });

    this.saveData();
  }

  getActiveAlerts(): Alert[] {
    if (!this.currentUser) return [];
    return this.currentUser.financial.alerts.filter(alert => !alert.dismissed);
  }

  dismissAlert(alertId: string): boolean {
    if (!this.currentUser) return false;

    const alert = this.currentUser.financial.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.dismissed = true;
    return this.saveData();
  }

  /**
   * NOVA FUNCIONALIDADE: Dados para gráficos
   */
  getExpensesByCategory(yearMonth: string): Record<string, number> {
    const transactions = this.getTransactionsByPeriod(yearMonth);
    const expenses: Record<string, number> = {};

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expenses[t.category] = (expenses[t.category] || 0) + t.amount;
      });

    return expenses;
  }

  getMonthlyComparison(months: number = 6): Array<{
    period: string;
    income: number;
    expenses: number;
    balance: number;
  }> {
    const data = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const summary = this.getFinancialSummary(period);

      if (summary) {
        data.push({
          period,
          income: summary.totalIncome,
          expenses: summary.totalExpenses,
          balance: summary.balance
        });
      }
    }

    return data;
  }

  /**
   * NOVA FUNCIONALIDADE: Exportar dados
   */
  getExportData(type: 'current' | 'all' = 'current', period?: string): any {
    if (!this.currentUser) return null;

    const exportData: any = {
      user: this.currentUser.profile,
      exportDate: new Date().toISOString(),
      type
    };

    if (type === 'current' && period) {
      const summary = this.getFinancialSummary(period);
      exportData.period = period;
      exportData.summary = summary;
      exportData.transactions = summary?.transactions || [];
    } else {
      exportData.transactions = this.getAllTransactions();
      exportData.monthlyIncomes = this.currentUser.financial.monthlyIncomes;
      exportData.categoryBudgets = this.currentUser.financial.categoryBudgets;
      exportData.dreams = this.currentUser.financial.dreams;
    }

    return exportData;
  }

  // Métodos auxiliares existentes mantidos...
  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Carrega dados do localStorage
   */
  private loadData(): AppData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        users: {},
        currentUserId: null,
        version: '2.0.0'
      };
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      return { users: {}, currentUserId: null, version: '2.0.0' };
    }
  }

  /**
   * Salva dados no localStorage
   */
  private saveData(): boolean {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      return false;
    }
  }

  /**
   * Cria estrutura padrão para novo usuário
   */
  private createUserStructure(userId: string, userData: any): UserData {
    return {
      id: userId,
      profile: {
        name: userData.name,
        email: userData.email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      },
      financial: {
        monthlyIncomes: {},
        transactions: [],
        categories: [
          'Alimentação', 'Transporte', 'Moradia', 'Saúde', 
          'Educação', 'Lazer', 'Compras', 'Outros'
        ],
        goals: [],
        // NOVAS PROPRIEDADES
        categoryBudgets: {},
        dreams: [],
        alerts: []
      },
      settings: {
        currency: 'BRL',
        theme: 'light',
        notifications: true
      }
    };
  }

  /**
   * Registra novo usuário
   */
  registerUser(userData: any): { success: boolean; user?: UserData; message?: string } {
    const userId = this.generateUserId(userData.email);
    
    if (this.data.users[userId]) {
      return { success: false, message: 'Usuário já existe' };
    }

    this.data.users[userId] = this.createUserStructure(userId, userData);
    this.data.currentUserId = userId;
    this.currentUser = this.data.users[userId];
    
    if (this.saveData()) {
      return { success: true, user: this.currentUser };
    }
    
    return { success: false, message: 'Erro ao salvar dados' };
  }

  /**
   * Autentica usuário
   */
  loginUser(email: string, password: string): { success: boolean; user?: UserData; message?: string } {
    const userId = this.generateUserId(email);
    const user = this.data.users[userId];

    if (!user) {
      return { success: false, message: 'Usuário não encontrado' };
    }

    user.profile.lastLogin = new Date().toISOString();
    this.data.currentUserId = userId;
    this.currentUser = user;
    this.migrateUserData(); // Migrar dados se necessário
    
    this.saveData();
    return { success: true, user: this.currentUser };
  }

  /**
   * Logout do usuário atual
   */
  logout(): void {
    this.currentUser = null;
    this.data.currentUserId = null;
    this.saveData();
  }

  /**
   * Gera ID único baseado no email
   */
  private generateUserId(email: string): string {
    return btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Gera ID único para transação
   */
  private generateTransactionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Obtém renda mensal para período específico
   */
  getMonthlyIncome(yearMonth: string): number {
    if (!this.currentUser) return 0;
    return this.currentUser.financial.monthlyIncomes[yearMonth] || 0;
  }

  /**
   * ✅ MÉTODO CORRIGIDO: Define renda mensal para período específico
   * Esta é a implementação principal solicitada na tarefa
   */
  setMonthlyIncome(yearMonth: string, amount: number): boolean {
    if (!this.currentUser) return false;
    
    // Garantir que monthlyIncomes existe
    if (!this.currentUser.financial.monthlyIncomes) {
      this.currentUser.financial.monthlyIncomes = {};
    }
    
    this.currentUser.financial.monthlyIncomes[yearMonth] = parseFloat(amount.toString()) || 0;
    return this.saveData();
  }

  /**
   * Adiciona nova transação
   */
  addTransaction(transactionData: any): Transaction | false {
    if (!this.currentUser) return false;

    const transaction: Transaction = {
      id: this.generateTransactionId(),
      description: transactionData.description,
      amount: parseFloat(transactionData.amount),
      type: transactionData.type,
      category: transactionData.category || 'Outros',
      date: transactionData.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    this.currentUser.financial.transactions.unshift(transaction);
    
    // Atualizar alertas de orçamento após nova transação
    this.updateBudgetAlerts();
    
    return this.saveData() ? transaction : false;
  }

  /**
   * Remove transação
   */
  removeTransaction(transactionId: string): boolean {
    if (!this.currentUser) return false;

    const index = this.currentUser.financial.transactions.findIndex(t => t.id === transactionId);
    if (index === -1) return false;

    this.currentUser.financial.transactions.splice(index, 1);
    
    // Atualizar alertas de orçamento após remoção
    this.updateBudgetAlerts();
    
    return this.saveData();
  }

  /**
   * Obtém transações filtradas por período
   */
  getTransactionsByPeriod(yearMonth: string): Transaction[] {
    if (!this.currentUser) return [];
    
    const targetPeriod = yearMonth.trim();
    
    const filteredTransactions = this.currentUser.financial.transactions.filter(transaction => {
      const transactionPeriod = transaction.date.substring(0, 7);
      return transactionPeriod === targetPeriod;
    });
    
    return filteredTransactions;
  }

  /**
   * Obtém todas as transações do usuário atual
   */
  getAllTransactions(): Transaction[] {
    if (!this.currentUser) return [];
    return [...this.currentUser.financial.transactions];
  }

  /**
   * Calcula resumo financeiro para período específico
   */
  getFinancialSummary(yearMonth: string): any {
    if (!this.currentUser) return null;

    const transactions = this.getTransactionsByPeriod(yearMonth);
    const monthlyIncome = this.getMonthlyIncome(yearMonth);

    const periodIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = monthlyIncome + periodIncome;

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    const expensesByCategory: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      });

    const summary = {
      period: yearMonth,
      monthlyIncome,
      totalIncome,
      totalExpenses,
      balance,
      transactionCount: transactions.length,
      expensesByCategory,
      transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };

    return summary;
  }

  /**
   * Compara dois períodos financeiros
   */
  comparePeriods(period1: string, period2: string): any {
    const summary1 = this.getFinancialSummary(period1);
    const summary2 = this.getFinancialSummary(period2);

    if (!summary1 || !summary2) return null;

    return {
      period1: summary1,
      period2: summary2,
      comparison: {
        incomeChange: summary2.totalIncome - summary1.totalIncome,
        expenseChange: summary2.totalExpenses - summary1.totalExpenses,
        balanceChange: summary2.balance - summary1.balance,
        incomeChangePercent: summary1.totalIncome > 0 ? 
          ((summary2.totalIncome - summary1.totalIncome) / summary1.totalIncome) * 100 : 0,
        expenseChangePercent: summary1.totalExpenses > 0 ? 
          ((summary2.totalExpenses - summary1.totalExpenses) / summary1.totalExpenses) * 100 : 0
      }
    };
  }

  /**
   * Obtém usuário atual
   */
  getCurrentUser(): UserData | null {
    return this.currentUser;
  }

  /**
   * Verifica se usuário está logado
   */
  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Obtém categorias do usuário
   */
  getCategories(): string[] {
    if (!this.currentUser) return [];
    return this.currentUser.financial.categories;
  }

  /**
   * Adiciona nova categoria
   */
  addCategory(categoryName: string): boolean {
    if (!this.currentUser || !categoryName.trim()) return false;
    
    const categories = this.currentUser.financial.categories;
    if (!categories.includes(categoryName)) {
      categories.push(categoryName);
      return this.saveData();
    }
    return false;
  }

  /**
   * Método para debug - listar todas as transações com suas datas
   */
  debugTransactions(): void {
    if (!this.currentUser) {
      console.log('Nenhum usuário logado');
      return;
    }

    console.log('=== DEBUG TRANSAÇÕES ===');
    console.log('Total de transações:', this.currentUser.financial.transactions.length);
    
    this.currentUser.financial.transactions.forEach((t, index) => {
      console.log(`${index + 1}. ${t.description} - ${t.date} - R$ ${t.amount} (${t.type})`);
    });

    console.log('=== RENDAS MENSAIS ===');
    Object.entries(this.currentUser.financial.monthlyIncomes).forEach(([period, income]) => {
      console.log(`${period}: R$ ${income}`);
    });
  }
}

// Instância singleton
const dataManager = new DataManager();



export default dataManager;
// Expondo dataManager globalmente para facilitar a depuração no console
(window as any).dataManager = dataManager;