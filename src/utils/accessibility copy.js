/**
 * Accessibility Manager for OrçaMais
 * Handles all accessibility features including keyboard navigation, 
 * screen reader support, and accessibility preferences
 */

class AccessibilityManager {
  constructor() {
    this.settings = this.loadSettings();
    this.speechSynthesis = window.speechSynthesis;
    this.isReading = false;
    this.currentUtterance = null;
    this.init();
  }

  init() {
    this.createAccessibilityButton();
    this.createAccessibilityModal();
    this.applySettings();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.createToastContainer();
    this.addSkipLink();
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem('orcamais:accessibility');
      return stored ? JSON.parse(stored) : {
        highContrast: false,
        darkMode: false,
        largeFont: false
      };
    } catch (error) {
      console.error('Erro ao carregar configurações de acessibilidade:', error);
      return {
        highContrast: false,
        darkMode: false,
        largeFont: false
      };
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('orcamais:accessibility', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Erro ao salvar configurações de acessibilidade:', error);
    }
  }

  addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Pular para o conteúdo principal';
    skipLink.setAttribute('aria-label', 'Pular para o conteúdo principal');
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  createAccessibilityButton() {
    const button = document.createElement('button');
    button.id = 'accessibility-btn';
    button.className = 'accessibility-btn';
    button.setAttribute('aria-label', 'Abrir opções de acessibilidade');
    button.setAttribute('title', 'Opções de Acessibilidade');
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
      </svg>
    `;

    button.addEventListener('click', () => this.toggleAccessibilityModal());
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleAccessibilityModal();
      }
    });

    document.body.appendChild(button);
  }

  createAccessibilityModal() {
    const modal = document.createElement('div');
    modal.id = 'accessibility-modal';
    modal.className = 'accessibility-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'accessibility-title');
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
      <div class="accessibility-modal-content">
        <div class="accessibility-modal-header">
          <h2 id="accessibility-title" class="accessibility-modal-title">Opções de Acessibilidade</h2>
          <button class="accessibility-modal-close" aria-label="Fechar modal de acessibilidade">×</button>
        </div>
        <div class="accessibility-modal-body">
          <div class="accessibility-options">
            <div class="accessibility-option">
              <span class="accessibility-option-label">Alto Contraste</span>
              <button class="accessibility-option-button" data-setting="highContrast" aria-pressed="${this.settings.highContrast}">
                ${this.settings.highContrast ? 'Ativo' : 'Inativo'}
              </button>
            </div>
            <div class="accessibility-option">
              <span class="accessibility-option-label">Modo Escuro</span>
              <button class="accessibility-option-button" data-setting="darkMode" aria-pressed="${this.settings.darkMode}">
                ${this.settings.darkMode ? 'Ativo' : 'Inativo'}
              </button>
            </div>
            <div class="accessibility-option">
              <span class="accessibility-option-label">Fonte Grande</span>
              <button class="accessibility-option-button" data-setting="largeFont" aria-pressed="${this.settings.largeFont}">
                ${this.settings.largeFont ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          
<div class="accessibility-option">
  <span class="accessibility-option-label">Leitura por Voz</span>
  <button class="accessibility-option-button" data-action="voiceReading">${this.isReading ? 'Parar' : 'Iniciar'}</button>
</div>
            <div class="accessibility-option">
              <span class="accessibility-option-label">Redefinir Tudo</span>
              <button class="accessibility-option-button" data-action="reset">Redefinir</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    const closeBtn = modal.querySelector('.accessibility-modal-close');
    closeBtn.addEventListener('click', () => this.closeAccessibilityModal());

    const optionButtons = modal.querySelectorAll('.accessibility-option-button');
    optionButtons.forEach(button => {
      button.addEventListener('click', (e) => this.handleOptionClick(e));
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleOptionClick(e);
        }
      });
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeAccessibilityModal();
      }
    });

    // Close on Escape key
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAccessibilityModal();
      }
    });

    document.body.appendChild(modal);
  }

  toggleAccessibilityModal() {
    const modal = document.getElementById('accessibility-modal');
    const isOpen = modal.classList.contains('active');
    
    if (isOpen) {
      this.closeAccessibilityModal();
    } else {
      this.openAccessibilityModal();
    }
  }

  openAccessibilityModal() {
    const modal = document.getElementById('accessibility-modal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    
    // Focus first focusable element
    const firstFocusable = modal.querySelector('button, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }

    this.announceToScreenReader('Modal de acessibilidade aberto');
  }

  closeAccessibilityModal() {
    const modal = document.getElementById('accessibility-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    
    // Return focus to accessibility button
    const accessibilityBtn = document.getElementById('accessibility-btn');
    if (accessibilityBtn) {
      accessibilityBtn.focus();
    }
    
    this.announceToScreenReader('Modal de acessibilidade fechado');
  }

 handleOptionClick(e) {
  const button = e.target;
  const setting = button.dataset.setting;
  const action = button.dataset.action;

  if (setting) {
    this.toggleSetting(setting);
    this.updateButtonState(button, setting);
  } else if (action === 'voiceReading') {
    if (this.isReading) {
      this.stopVoiceReading();
    } else {
      this.startVoiceReading();
    }
    this.updateVoiceButton();
  } else if (action === 'reset') {
    this.resetAllSettings();
  }
}
  toggleSetting(setting) {
    this.settings[setting] = !this.settings[setting];
    this.saveSettings();
    this.applySettings();
    
    const settingNames = {
      highContrast: 'Alto Contraste',
      darkMode: 'Modo Escuro',
      largeFont: 'Fonte Grande'
    };
    
    const status = this.settings[setting] ? 'ativado' : 'desativado';
    this.showToast(`${settingNames[setting]} ${status}`);
    this.announceToScreenReader(`${settingNames[setting]} ${status}`);
  }

  updateButtonState(button, setting) {
    const isActive = this.settings[setting];
    button.textContent = isActive ? 'Ativo' : 'Inativo';
    button.setAttribute('aria-pressed', isActive);
    button.classList.toggle('active', isActive);
  }

  setDefaultMode() {
    this.settings = {
      highContrast: false,
      darkMode: false,
      largeFont: false
    };
    this.saveSettings();
    this.applySettings();
    this.updateAllButtonStates();
    this.showToast('Modo padrão restaurado');
    this.announceToScreenReader('Modo padrão restaurado');
  }

  resetAllSettings() {
    this.settings = {
      highContrast: false,
      darkMode: false,
      largeFont: false
    };
    this.saveSettings();
    this.applySettings();
    this.updateAllButtonStates();
    this.showToast('Todas as configurações foram redefinidas');
    this.announceToScreenReader('Todas as configurações de acessibilidade foram redefinidas');
  }

  updateAllButtonStates() {
    const modal = document.getElementById('accessibility-modal');
    if (modal) {
      const buttons = modal.querySelectorAll('[data-setting]');
      buttons.forEach(button => {
        const setting = button.dataset.setting;
        this.updateButtonState(button, setting);
      });
    }
  }
  // ...dentro da classe AccessibilityManager...

startVoiceReading() {
  if (this.isReading) return;
  const text = this.extractPageText();
  if (!text) {
    this.showToast('Nada para ler na página', 'error');
    return;
  }
  this.isReading = true;
   this.showToast('Leitura por voz ativada', 'success');
  document.body.classList.add('voice-reading-active');
  this.currentUtterance = new SpeechSynthesisUtterance(text);
  this.currentUtterance.lang = 'pt-BR';
  this.currentUtterance.rate = 1;
  this.currentUtterance.onend = () => {
    this.isReading = false;
    document.body.classList.remove('voice-reading-active');
    this.updateVoiceButton();
  };
  this.currentUtterance.onerror = () => {
    this.isReading = false;
    document.body.classList.remove('voice-reading-active');
    this.updateVoiceButton();
    this.showToast('Erro na leitura por voz', 'error');
  };
  this.speechSynthesis.speak(this.currentUtterance);
  this.updateVoiceButton();
}

stopVoiceReading() {
  if (!this.isReading) return;
  this.speechSynthesis.cancel();
  this.isReading = false;
  document.body.classList.remove('voice-reading-active');
  this.updateVoiceButton();
}

extractPageText() {
  // Pegue o main, se existir, senão o body
  const main = document.querySelector('main') || document.body;
  // Clone para manipular sem afetar o DOM
  const clone = main.cloneNode(true);

  // Remova links e elementos indesejados do clone
  const skipLinks = clone.querySelectorAll('.skip-link, nav, footer, .accessibility-btn, .accessibility-modal');
  skipLinks.forEach(el => el.remove());

  // Retorna só o texto visível
  return clone.innerText || '';
}

updateVoiceButton() {
  const modal = document.getElementById('accessibility-modal');
  if (modal) {
    const btn = modal.querySelector('[data-action="voiceReading"]');
    if (btn) {
      btn.textContent = this.isReading ? 'Parar' : 'Iniciar';
      btn.setAttribute('aria-pressed', this.isReading);
      btn.classList.toggle('active', this.isReading); // <-- Isso deixa verde se já houver CSS para .active
    }
  }
}
  applySettings() {
    // Remove all accessibility classes first
    document.body.classList.remove('high-contrast', 'dark-mode', 'large-font');
    
    // Apply current settings
    if (this.settings.highContrast) {
      document.body.classList.add('high-contrast');
    }
    if (this.settings.darkMode) {
      document.body.classList.add('dark-mode');
    }
    if (this.settings.largeFont) {
      document.body.classList.add('large-font');
    }
  }

  setupKeyboardNavigation() {
    // Global keyboard event handler
    document.addEventListener('keydown', (e) => {
      // Escape key handling
      if (e.key === 'Escape') {
        const modal = document.getElementById('accessibility-modal');
        if (modal && modal.classList.contains('active')) {
          this.closeAccessibilityModal();
        }
      }
    });

    // Ensure all interactive elements are keyboard accessible
    this.enhanceKeyboardNavigation();
  }

  enhanceKeyboardNavigation() {
    // Add keyboard support to elements that might not have it
    const interactiveElements = document.querySelectorAll('button, input, select, textarea, [role="button"], [tabindex]');
    
    interactiveElements.forEach(element => {
      if (!element.hasAttribute('tabindex') && element.tagName !== 'INPUT' && element.tagName !== 'SELECT' && element.tagName !== 'TEXTAREA') {
        element.setAttribute('tabindex', '0');
      }
    });
  }

  setupFocusManagement() {
    // Focus trap for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const modal = document.querySelector('.accessibility-modal.active');
        if (modal) {
          this.trapFocus(e, modal);
        }
      }
    });
  }

  trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.right = '0';
    container.style.zIndex = '1001';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const container = document.getElementById('toast-container');
    if (container) {
      container.appendChild(toast);

      // Show toast
      setTimeout(() => {
        toast.classList.add('show');
      }, 100);

      // Hide and remove toast
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (container.contains(toast)) {
            container.removeChild(toast);
          }
        }, 300);
      }, 3000);
    }
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  // Method to add ARIA labels to existing elements
  enhanceExistingElements() {
    // Add ARIA labels to buttons without visible text
    const iconButtons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    iconButtons.forEach(button => {
      const svg = button.querySelector('svg');
      if (svg && !button.textContent.trim()) {
        // Try to determine button purpose from context
        if (button.classList.contains('delete') || button.innerHTML.includes('trash')) {
          button.setAttribute('aria-label', 'Excluir item');
        } else if (button.innerHTML.includes('edit')) {
          button.setAttribute('aria-label', 'Editar item');
        } else if (button.innerHTML.includes('close') || button.innerHTML.includes('×')) {
          button.setAttribute('aria-label', 'Fechar');
        } else {
          button.setAttribute('aria-label', 'Botão de ação');
        }
      }
    });

    // Add semantic landmarks
    this.addLandmarks();
  }

  addLandmarks() {
    // Add main landmark if not present
    if (!document.querySelector('main')) {
      const mainContent = document.querySelector('.app-container, #app, .main-content');
      if (mainContent) {
        mainContent.setAttribute('role', 'main');
        mainContent.id = 'main-content';
      }
    }
  }

  // Initialize accessibility features for dynamically added content
  initializeForNewContent(container) {
    // Add ARIA labels to new buttons
    const newButtons = container.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    newButtons.forEach(button => {
      if (button.querySelector('svg') && !button.textContent.trim()) {
        button.setAttribute('aria-label', 'Botão de ação');
      }
    });

    // Ensure new interactive elements are keyboard accessible
    const newInteractive = container.querySelectorAll('button, [role="button"]');
    newInteractive.forEach(element => {
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    });
  }
}

// Initialize accessibility manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.accessibilityManager = new AccessibilityManager();
  
  // Enhance existing elements after a short delay to ensure all content is loaded
  setTimeout(() => {
    window.accessibilityManager.enhanceExistingElements();
  }, 500);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityManager;
}