/**
 * Formatadores e utilitários para o OrçaMais
 */

/**
 * Formata valor monetário para Real Brasileiro
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
};

/**
 * Formata data para exibição
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

/**
 * Formata período (YYYY-MM) para exibição
 */
export const formatPeriod = (yearMonth) => {
  const [year, month] = yearMonth.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

/**
 * Obtém período atual (YYYY-MM)
 */
export const getCurrentPeriod = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Obtém período anterior
 */
export const getPreviousPeriod = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
};

/**
 * Obtém próximo período
 */
export const getNextPeriod = (yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + 1);
  
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
};

/**
 * Valida email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida senha (mínimo 6 caracteres)
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Calcula porcentagem de mudança
 */
export const calculatePercentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Formata porcentagem
 */
export const formatPercentage = (percentage) => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
};

/**
 * Gera cores para categorias
 */
export const getCategoryColor = (category, index = 0) => {
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
  
  // Hash simples baseado no nome da categoria
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Debounce para otimizar performance
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};