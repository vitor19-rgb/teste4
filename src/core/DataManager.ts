/**
 * DataManager - Gerenciador centralizado de dados do OrçaMais
 * Responsável por toda a persistência de dados no Firebase (Firestore)
 * e gerenciamento de estado da aplicação.
 * VERSÃO COMPLETA E CORRIGIDA PARA FIREBASE
 */

// 1. IMPORTAÇÕES DO FIREBASE E TIPOS
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
import { auth, db } from "../core/firebaseConfig"; // <-- VERIFIQUE SE ESTE CAMINHO ESTÁ CORRETO

// As interfaces permanecem exatamente as mesmas.
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

  // MAPEAMENTO COMPLETO DE PALAVRAS-CHAVE (MANTIDO DO ORIGINAL)
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

  // =================================================================
  // SETUP E AUTENTICAÇÃO
  // =================================================================

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
      // onAuthStateChanged cuidará de carregar os dados.
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
  // MÉTODOS DE ESCRITA (WRITE) - ADAPTADOS PARA SEREM ASSÍNCRONOS
  // =================================================================

  private async _saveData(): Promise<boolean> {
    if (!this.currentUser) return false;
    try {
      await setDoc(doc(this.db, "users", this.currentUser.id), this.currentUser);
      return true;
    } catch (error) {
      console.error("Erro ao salvar dados no Firestore:", error);
      return false;
    }
  }

  async setUserTheme(theme: 'light' | 'dark'): Promise<boolean> {
    if (!this.currentUser) return false;
    this.currentUser.settings.theme = theme;
    this._applyUserTheme(); // Aplica visualmente
    // Usa updateDoc para eficiência
    try {
        await updateDoc(doc(this.db, "users", this.currentUser.id), { 'settings.theme': theme });
        return true;
    } catch (error) {
        console.error("Erro ao salvar tema:", error);
        return false;
    }
  }

  async setMonthlyIncome(yearMonth: string, amount: number): Promise<boolean> {
    if (!this.currentUser) return false;
    this.currentUser.financial.monthlyIncomes[yearMonth] = parseFloat(amount.toString()) || 0;
    // Usa updateDoc para eficiência
    try {
        await updateDoc(doc(this.db, "users", this.currentUser.id), { 
            [`financial.monthlyIncomes.${yearMonth}`]: this.currentUser.financial.monthlyIncomes[yearMonth] 
        });
        return true;
    } catch(error) {
        console.error("Erro ao definir renda mensal:", error);
        return false;
    }
  }

  // Em: src/core/DataManager.ts

async addTransaction(transactionData: any): Promise<Transaction | false> {
  if (!this.currentUser) return false;
  
  const transaction: Transaction = {
    id: this._generateId(),
    ...transactionData,
    amount: parseFloat(transactionData.amount),
    date: transactionData.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  
  this.currentUser.financial.transactions.unshift(transaction);
  this._updateBudgetAlerts();

  try {
    // OTIMIZAÇÃO: Usa updateDoc para salvar APENAS a lista de transações.
    // A operação é leve, rápida e eficiente.
    const userDocRef = doc(this.db, "users", this.currentUser.id);
    await updateDoc(userDocRef, {
      'financial.transactions': this.currentUser.financial.transactions
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
    return false; // Categoria já existia
  }

  // =================================================================
  // MÉTODOS DE LEITURA (READ) E LÓGICA DE NEGÓCIO - SEM ALTERAÇÃO
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
        else if (this._calculateSimilarity(descNormalized, keywordNormalized) > 0.8) score += 1;
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

  getDreams(): Dream[] {
    return this.currentUser ? [...this.currentUser.financial.dreams] : [];
  }

  getActiveAlerts(): Alert[] {
    return this.currentUser ? this.currentUser.financial.alerts.filter(alert => !alert.dismissed) : [];
  }

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

  getAllTransactions(): Transaction[] {
    return this.currentUser ? [...this.currentUser.financial.transactions] : [];
  }

  getFinancialSummary(yearMonth: string): any {
    if (!this.currentUser) return null;
    const transactions = this.getTransactionsByPeriod(yearMonth);
    const monthlyIncome = this.getMonthlyIncome(yearMonth);
    const periodIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = monthlyIncome + periodIncome;
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;
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

  comparePeriods(period1: string, period2: string): any {
    const summary1 = this.getFinancialSummary(period1);
    const summary2 = this.getFinancialSummary(period2);
    if (!summary1 || !summary2) return null;
    return {
      period1: summary1, period2: summary2,
      comparison: {
        incomeChange: summary2.totalIncome - summary1.totalIncome,
        expenseChange: summary2.totalExpenses - summary1.totalExpenses,
        balanceChange: summary2.balance - summary1.balance,
        incomeChangePercent: summary1.totalIncome > 0 ? ((summary2.totalIncome - summary1.totalIncome) / summary1.totalIncome) * 100 : 0,
        expenseChangePercent: summary1.totalExpenses > 0 ? ((summary2.totalExpenses - summary1.totalExpenses) / summary1.totalExpenses) * 100 : 0
      }
    };
  }
  
  getCategories(): string[] {
    return this.currentUser ? this.currentUser.financial.categories : [];
  }

  debugTransactions(): void {
    if (!this.currentUser) { console.log('Nenhum usuário logado'); return; }
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
  
  private _calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    const len1 = str1.length; const len2 = str2.length;
    if (len1 === 0 || len2 === 0) return 0;
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    if (matchWindow < 0) return 0;
    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);
    let matches = 0; let transpositions = 0;
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true; str2Matches[j] = true; matches++; break;
      }
    }
    if (matches === 0) return 0;
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

  private _updateBudgetAlerts(): void {
    if (!this.currentUser) return;
    this.currentUser.financial.alerts = this.currentUser.financial.alerts.filter(alert => alert.type !== 'budget');
    const budgets = this.getCategoryBudgets();
    budgets.forEach(budget => {
      if (budget.status === 'warning' || budget.status === 'exceeded') {
        const alert: Alert = {
          id: this._generateId(), type: 'budget', category: budget.category,
          message: budget.status === 'exceeded' 
            ? `Orçamento de ${budget.category} excedido! Gasto: R$ ${budget.spent.toFixed(2)} / Limite: R$ ${budget.limit.toFixed(2)}`
            : `Atenção: ${budget.percentage.toFixed(0)}% do orçamento de ${budget.category} utilizado`,
          severity: budget.status === 'exceeded' ? 'error' : 'warning',
          createdAt: new Date().toISOString(), dismissed: false
        };
        this.currentUser!.financial.alerts.push(alert);
      }
    });
    // A chamada para _saveData() será feita pelo método público que invocou este.
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
        categories: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Investimentos', 'Outros'], // <-- Adicionado aqui
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
  // A linha que dispara o evento foi REMOVIDA.
}}

// Instância singleton e exportação
const dataManager = new DataManager();
(window as any).dataManager = dataManager;
export default dataManager;