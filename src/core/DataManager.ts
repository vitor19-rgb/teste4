// Em: src/core/DataManager.ts
// (Versão Corrigida: Erro Firebase undefined resolvido + Lógica do Último Dia)

import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../core/firebaseConfig";

// =================================================================
// INTERFACES (TIPAGEM)
// =================================================================

interface UserProfile {
  name: string;
  email: string;
  createdAt: string;
  lastLogin: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  createdAt: string;
  
  // Dados de Investimento (Opcional)
  investmentData?: {
    stockCode: string;
    quantity: number;
    purchasePrice: number;
    logo: string;
  };

  // ▼▼▼ CORREÇÃO: Permitir null ou number para evitar erro "undefined" no Firestore ▼▼▼
  isRecurring?: boolean;         
  recurrenceDay?: number | null;        
  recurrenceLimit?: number | null;      
  recurrenceCurrent?: number | null;    
  
  lastGeneratedMonth?: string | null;   
  originalTransactionId?: string | null;
  
  installmentNumber?: number | null;    
  installmentTotal?: number | null;     
  // ▲▲▲ FIM DA CORREÇÃO NA INTERFACE ▲▲▲
}

interface CategoryBudget {
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
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
    categoryBudgets: Record<string, number>;
    dreams: Dream[];
    alerts: Alert[];
  };
  settings: {
    currency: string;
    theme: string;
    notifications: boolean;
  };
}

class DataManager {
  private auth: Auth;
  private db: Firestore;
  private currentUser: UserData | null = null;
  public isInitialized: boolean = false;

  // MAPEAMENTO DE PALAVRAS-CHAVE
  private categoryKeywords: Record<string, string[]> = {
    'Alimentação': ['supermercado', 'padaria', 'restaurante', 'ifood', 'delivery', 'mercado', 'açougue', 'comida'],
    'Transporte': ['uber', 'taxi', 'ônibus', 'metro', 'combustível', 'gasolina', 'posto', 'estacionamento'],
    'Moradia': ['aluguel', 'condomínio', 'água', 'luz', 'energia', 'internet', 'telefone', 'gás', 'manutenção'],
    'Saúde': ['médico', 'farmácia', 'remédio', 'consulta', 'exame', 'dentista', 'plano', 'academia'],
    'Educação': ['escola', 'faculdade', 'curso', 'livro', 'material', 'mensalidade', 'aula'],
    'Lazer': ['cinema', 'streaming', 'netflix', 'spotify', 'viagem', 'bar', 'jogo', 'ingresso', 'show'],
    'Compras': ['roupa', 'sapato', 'shopping', 'loja', 'presente', 'amazon', 'shopee', 'mercado livre'],
    'Investimentos': ['ação', 'fundo', 'tesouro', 'cdb', 'corretora', 'aporte'],
    'Sonhos': ['sonho', 'meta', 'objetivo', 'reserva', 'guardar']
  };

  constructor() {
    this.auth = auth;
    this.db = db;
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        await this._loadUserData(user);
        this._applyUserTheme();
      } else {
        this.currentUser = null;
      }
      this.isInitialized = true;
      window.dispatchEvent(new CustomEvent('authChange', { detail: { user: this.currentUser } }));
    });
  }

  // =================================================================
  // AUTENTICAÇÃO E SETUP
  // =================================================================

  private async _loadUserData(firebaseUser: User) {
    const userDocRef = doc(this.db, "users", firebaseUser.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      this.currentUser = docSnap.data() as UserData;
      await this._migrateUserDataIfNeeded();
    } else {
      this.currentUser = this._createUserStructure(firebaseUser.uid, {
        name: firebaseUser.displayName || 'Novo Usuário',
        email: firebaseUser.email!,
      });
      await setDoc(userDocRef, this.currentUser);
    }
  }

  async registerUser(userData: any): Promise<{ success: boolean; user?: UserData; message?: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, userData.email, userData.password);
      const newUser = this._createUserStructure(userCredential.user.uid, userData);
      await setDoc(doc(this.db, 'users', userCredential.user.uid), newUser);
      this.currentUser = newUser;
      return { success: true, user: this.currentUser };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async loginUser(email: string, password: string): Promise<{ success: boolean; user?: UserData; message?: string }> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: this.currentUser! };
    } catch (error: any) {
      return { success: false, message: 'Usuário ou senha inválidos.' };
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  getCurrentUser(): UserData | null {
    return this.currentUser;
  }

  // =================================================================
  // ROBÔ DE RECORRÊNCIA (CORRIGIDO COM LÓGICA DO ÚLTIMO DIA)
  // =================================================================

  async processRecurringTransactions() {
    if (!this.currentUser) return;

    const today = new Date();
    // Monta YYYY-MM manualmente usando horário local
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentDay = today.getDate();
    let updatesMade = false;

    // Filtra apenas as transações MÃE (isRecurring = true)
    const recurringParents = this.currentUser.financial.transactions.filter(t => t.isRecurring === true);

    for (const parent of recurringParents) {
      // 1. Verificação de Limite
      if (parent.recurrenceLimit && (parent.recurrenceCurrent || 0) >= parent.recurrenceLimit) {
        continue;
      }

      // 2. Verificação de Duplicidade
      if (parent.lastGeneratedMonth === currentMonthKey) {
        continue;
      }

      // 3. Verificação do Dia com ajuste para o último dia do mês
      const triggerDay = parent.recurrenceDay || 1;
      
      // 4. Calcular o último dia do mês atual
      // Criamos uma data no dia 0 do PRÓXIMO mês, o que nos retorna o último dia do mês atual
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      
      // 5. Ajustar o dia: se o triggerDay for maior que o último dia do mês, usar o último dia
      const adjustedDay = Math.min(triggerDay, lastDayOfMonth);
      
      if (currentDay >= adjustedDay) {
        // --- DATA MANUAL ---
        const targetDate = new Date(today.getFullYear(), today.getMonth(), adjustedDay);
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        const formattedDate = `${y}-${m}-${d}`;

        const nextInstallmentNumber = (parent.recurrenceCurrent || 0) + 1;

        // Dados da Nova Transação (FILHA)
        const childTransaction: Transaction = {
          id: this._generateId(),
          description: parent.description,
          amount: parent.amount,
          type: parent.type,
          category: parent.category,
          date: formattedDate,
          createdAt: new Date().toISOString(),
          
          isRecurring: false,              
          originalTransactionId: parent.id, 
          
          // Campos Visuais (Badge)
          installmentNumber: nextInstallmentNumber,
          installmentTotal: parent.recurrenceLimit || null // Usa null em vez de undefined
        };

        this.currentUser.financial.transactions.unshift(childTransaction);

        // --- ATUALIZAR A MÃE ---
        parent.lastGeneratedMonth = currentMonthKey;
        parent.recurrenceCurrent = nextInstallmentNumber;
        
        updatesMade = true;
      }
    }

    if (updatesMade) {
        await this._saveData();
        console.log('🔄 Recorrências processadas com sucesso.');
    }
  }
  
  // =================================================================
  // MÉTODOS DE ESCRITA (WRITE) - CORRIGIDO ERRO UNDEFINED
  // =================================================================

  private async _saveData(): Promise<boolean> {
    if (!this.currentUser) return false;
    try {
      // Importante: Firestore não aceita undefined. 
      // Garante que o objeto está limpo (embora a tipagem Transaction agora ajude)
      const userDataClean = JSON.parse(JSON.stringify(this.currentUser));
      await setDoc(doc(this.db, "users", this.currentUser.id), userDataClean);
      return true;
    } catch (error) {
      console.error("Erro ao salvar dados no Firestore:", error);
      return false;
    }
  }

  async addTransaction(transactionData: any): Promise<Transaction | false> {
    if (!this.currentUser) return false;
    
    // TRATAMENTO DE DATA
    let dateStr = transactionData.date;
    if (!dateStr) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        dateStr = `${y}-${m}-${d}`;
    }

    // CORREÇÃO AQUI: Inicializar com NULL em vez de undefined
    let installNum: number | null = null;
    let installTotal: number | null = null;
    let currentCount: number | null = 0;

    if (transactionData.isRecurring) {
        currentCount = 1; 
        installNum = 1;   
        installTotal = transactionData.recurrenceLimit || null;
    }

    const dayFromDate = parseInt(dateStr.split('-')[2]);

    // Sanitiza transactionData para remover undefineds que venham do spread operator
    const cleanData = { ...transactionData };
    Object.keys(cleanData).forEach(key => cleanData[key] === undefined && delete cleanData[key]);

    const transaction: Transaction = {
      id: this._generateId(),
      ...cleanData, // Usa dados limpos
      amount: parseFloat(transactionData.amount),
      date: dateStr,
      createdAt: new Date().toISOString(),
      
      // Lógica de Recorrência (Garante null se não existir)
      isRecurring: transactionData.isRecurring || false,
      recurrenceDay: transactionData.recurrenceDay || dayFromDate, 
      recurrenceLimit: transactionData.recurrenceLimit || null,
      recurrenceCurrent: currentCount,
      lastGeneratedMonth: transactionData.isRecurring ? dateStr.substring(0, 7) : null,
      
      // Visualização (Garante null se não existir)
      installmentNumber: installNum,
      installmentTotal: installTotal
    };
    
    this.currentUser.financial.transactions.unshift(transaction);
    this._updateBudgetAlerts();

    try {
      // Remove campos undefined de todo o array antes de enviar
      // (Isso é uma segurança extra para o Firebase)
      const transactionsClean = this.currentUser.financial.transactions.map(t => {
        const copy: any = { ...t };
        Object.keys(copy).forEach(k => copy[k] === undefined && (copy[k] = null));
        return copy;
      });

      const userDocRef = doc(this.db, "users", this.currentUser.id);
      await updateDoc(userDocRef, {
        'financial.transactions': transactionsClean
      });
      return transaction;
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
      this.currentUser.financial.transactions.shift(); 
      return false;
    }
  }

  async removeTransaction(transactionId: string): Promise<boolean> {
    if (!this.currentUser) return false;
    
    const index = this.currentUser.financial.transactions.findIndex(t => t.id === transactionId);
    if (index === -1) return false;

    this.currentUser.financial.transactions.splice(index, 1);
    this._updateBudgetAlerts();
    return await this._saveData();
  }

  // --- MÉTODOS MANTIDOS (Orçamentos, Sonhos, etc) ---
  // (O resto da classe permanece igual, apenas adicionei os tipos null na interface acima)

  async setCategoryBudget(category: string, limit: number): Promise<boolean> {
    if (!this.currentUser) return false;
    this.currentUser.financial.categoryBudgets[category] = limit;
    this._updateBudgetAlerts();
    return await this._saveData();
  }

  async addDream(dreamData: Omit<Dream, 'id' | 'createdAt' | 'savedAmount'>): Promise<Dream | false> {
    if (!this.currentUser) return false;
    const dream: Dream = {
      id: this._generateId(),
      ...dreamData,
      savedAmount: 0,
      createdAt: new Date().toISOString()
    };
    this.currentUser.financial.dreams.push(dream);
    return (await this._saveData()) ? dream : false;
  }

  async updateDreamSavings(dreamId: string, savedAmount: number): Promise<boolean> {
    if (!this.currentUser) return false;
    const dream = this.currentUser.financial.dreams.find(d => d.id === dreamId);
    if (!dream) return false;
    dream.savedAmount = savedAmount;
    return await this._saveData();
  }

  async removeDream(dreamId: string): Promise<boolean> {
    if (!this.currentUser) return false;
    const index = this.currentUser.financial.dreams.findIndex(d => d.id === dreamId);
    if (index === -1) return false;
    this.currentUser.financial.dreams.splice(index, 1);
    return await this._saveData();
  }

  async dismissAlert(alertId: string): Promise<boolean> {
    if (!this.currentUser) return false;
    const alert = this.currentUser.financial.alerts.find(a => a.id === alertId);
    if (!alert) return false;
    alert.dismissed = true;
    return await this._saveData();
  }

  async addCategory(categoryName: string): Promise<boolean> {
    if (!this.currentUser || !categoryName.trim()) return false;
    const categories = this.currentUser.financial.categories;
    if (!categories.includes(categoryName)) {
      categories.push(categoryName);
      return await this._saveData();
    }
    return false;
  }

  async setUserTheme(theme: 'light' | 'dark'): Promise<boolean> {
    if (!this.currentUser) return false;
    this.currentUser.settings.theme = theme;
    this._applyUserTheme();
    try {
        await updateDoc(doc(this.db, "users", this.currentUser.id), { 'settings.theme': theme });
        return true;
    } catch (error) { return false; }
  }

  async setMonthlyIncome(yearMonth: string, amount: number): Promise<boolean> {
    if (!this.currentUser) return false;
    this.currentUser.financial.monthlyIncomes[yearMonth] = parseFloat(amount.toString()) || 0;
    try {
        await updateDoc(doc(this.db, "users", this.currentUser.id), { 
            [`financial.monthlyIncomes.${yearMonth}`]: this.currentUser.financial.monthlyIncomes[yearMonth] 
        });
        return true;
    } catch(error) { return false; }
  }

  // =================================================================
  // MÉTODOS DE LEITURA (READ)
  // =================================================================

  suggestCategory(description: string): string {
    if (!description || description.length < 2) return 'Outros';
    const descLower = description.toLowerCase().trim();
    const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const descNormalized = removeAccents(descLower);
    const categoryScores: Record<string, number> = {};
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        const keywordNormalized = removeAccents(keyword.toLowerCase());
        if (descNormalized === keywordNormalized) score += 10;
        else if (descNormalized.includes(` ${keywordNormalized} `) || descNormalized.startsWith(`${keywordNormalized} `) || descNormalized.endsWith(` ${keywordNormalized}`)) score += 5;
        else if (descNormalized.includes(keywordNormalized)) score += 2;
      }
      if (score > 0) categoryScores[category] = score;
    }
    if (Object.keys(categoryScores).length > 0) {
      const bestCategory = Object.keys(categoryScores).reduce((a, b) => categoryScores[a] > categoryScores[b] ? a : b);
      if (categoryScores[bestCategory] >= 2) return bestCategory;
    }
    return 'Outros';
  }

  getCategoryBudgets(): CategoryBudget[] {
    if (!this.currentUser) return [];
    const currentPeriod = this._getCurrentPeriod();
    const transactions = this.getTransactionsByPeriod(currentPeriod);
    const budgets: CategoryBudget[] = [];
    for (const [category, limit] of Object.entries(this.currentUser.financial.categoryBudgets)) {
      const spent = transactions.filter(t => t.type === 'expense' && t.category === category).reduce((sum, t) => sum + t.amount, 0);
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      let status: 'ok' | 'warning' | 'exceeded' = 'ok';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';
      budgets.push({ category, limit, spent, percentage, status });
    }
    return budgets;
  }

  getDreams(): Dream[] { return this.currentUser ? [...this.currentUser.financial.dreams] : []; }
  getActiveAlerts(): Alert[] { return this.currentUser ? this.currentUser.financial.alerts.filter(alert => !alert.dismissed) : []; }
  
  getExpensesByCategory(yearMonth: string): Record<string, number> {
    const transactions = this.getTransactionsByPeriod(yearMonth);
    const expenses: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      expenses[t.category] = (expenses[t.category] || 0) + t.amount;
    });
    return expenses;
  }

  getMonthlyComparison(months: number = 6): Array<{ period: string; income: number; expenses: number; balance: number; }> {
    const data = [];
    const currentDate = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const summary = this.getFinancialSummary(period);
      if (summary) data.push({ period, income: summary.totalIncome, expenses: summary.totalExpenses, balance: summary.balance });
    }
    return data;
  }

  getExportData(type: 'current' | 'all' = 'current', period?: string): any {
    if (!this.currentUser) return null;
    const exportData: any = { user: this.currentUser.profile, exportDate: new Date().toISOString(), type };
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

  getMonthlyIncome(yearMonth: string): number {
    if (!this.currentUser) return 0;
    return this.currentUser.financial.monthlyIncomes[yearMonth] || 0;
  }

  getTransactionsByPeriod(yearMonth: string): Transaction[] {
    if (!this.currentUser) return [];
    const targetPeriod = yearMonth.trim();
    return this.currentUser.financial.transactions.filter(transaction => transaction.date.substring(0, 7) === targetPeriod);
  }

  getAllTransactions(): Transaction[] { return this.currentUser ? [...this.currentUser.financial.transactions] : []; }

  getFinancialSummary(yearMonth: string): any {
    if (!this.currentUser) return null;
    const transactions = this.getTransactionsByPeriod(yearMonth);
    const monthlyIncome = this.getMonthlyIncome(yearMonth);
    const periodIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = monthlyIncome + periodIncome;
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    // Calcula despesas por categoria
    const expensesByCategory: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    return {
      period: yearMonth, monthlyIncome, totalIncome, totalExpenses, balance,
      transactionCount: transactions.length, expensesByCategory,
      transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }
  
  getCategories(): string[] { return this.currentUser ? this.currentUser.financial.categories : []; }
  
  comparePeriods(period1: string, period2: string): any { return null; }

  // =================================================================
  // MÉTODOS AUXILIARES (PRIVADOS)
  // =================================================================

  private async _migrateUserDataIfNeeded(): Promise<void> {
    if (!this.currentUser) return;
    let needsUpdate = false;
    if (!this.currentUser.financial.categoryBudgets) { this.currentUser.financial.categoryBudgets = {}; needsUpdate = true; }
    if (!this.currentUser.financial.dreams) { this.currentUser.financial.dreams = []; needsUpdate = true; }
    if (!this.currentUser.financial.alerts) { this.currentUser.financial.alerts = []; needsUpdate = true; }
    if (needsUpdate) await this._saveData();
  }
  
  private _updateBudgetAlerts(): void {
    if (!this.currentUser) return;
    this.currentUser.financial.alerts = this.currentUser.financial.alerts.filter(alert => alert.type !== 'budget');
    const budgets = this.getCategoryBudgets();
    budgets.forEach(budget => {
      if (budget.status === 'warning' || budget.status === 'exceeded') {
        const alert: Alert = {
          id: this._generateId(), type: 'budget', category: budget.category,
          message: budget.status === 'exceeded' 
            ? `Orçamento de ${budget.category} excedido!`
            : `Atenção: ${budget.percentage.toFixed(0)}% do orçamento de ${budget.category} utilizado`,
          severity: budget.status === 'exceeded' ? 'error' : 'warning',
          createdAt: new Date().toISOString(), dismissed: false
        };
        this.currentUser!.financial.alerts.push(alert);
      }
    });
  }

  private _getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private _generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private _createUserStructure(userId: string, userData: any): UserData {
    return {
      id: userId,
      profile: { name: userData.name, email: userData.email, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() },
      financial: {
        monthlyIncomes: {}, transactions: [],
        categories: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Investimentos', 'Sonhos', 'Outros'],
        goals: [], categoryBudgets: {}, dreams: [], alerts: []
      },
      settings: { currency: 'BRL', theme: 'light', notifications: true }
    };
  }

  private _applyUserTheme(): void {
    if (!this.currentUser) return;
    const theme = this.currentUser.settings.theme;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }
}

// Instância singleton e exportação
const dataManager = new DataManager();
(window as any).dataManager = dataManager;
export default dataManager;