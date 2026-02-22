// frontend/src/utils/keyboardShortcuts.js
// Keyboard Shortcuts Manager

class KeyboardShortcutsManager {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.init();
    }

    init() {
        if (typeof document === 'undefined') return;
        
        // Performance: Event Listener nur einmal registrieren (verhindert Memory Leaks)
        if (this._listenerAttached) return;
        
        this._keydownHandler = (e) => {
            if (!this.enabled) return;
            
            // Ignore if typing in input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }
            
            const key = this.getKeyString(e);
            const handler = this.shortcuts.get(key);
            
            if (handler) {
                e.preventDefault();
                handler(e);
            }
        };
        
        document.addEventListener('keydown', this._keydownHandler);
        this._listenerAttached = true;
    }
    
    /**
     * Cleanup: Entfernt Event Listener (verhindert Memory Leaks)
     */
    destroy() {
        if (this._listenerAttached && this._keydownHandler) {
            document.removeEventListener('keydown', this._keydownHandler);
            this._listenerAttached = false;
            this._keydownHandler = null;
        }
        this.shortcuts.clear();
    }

    getKeyString(e) {
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }

    register(key, handler) {
        this.shortcuts.set(key, handler);
    }

    unregister(key) {
        this.shortcuts.delete(key);
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}

export const keyboardShortcuts = new KeyboardShortcutsManager();

// Standard-Shortcuts registrieren
if (typeof window !== 'undefined') {
    keyboardShortcuts.register('ctrl+k', (e) => {
        // Cmd/Ctrl+K für Suche (kann später erweitert werden)
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Suche"]');
        if (searchInput) {
            searchInput.focus();
        }
    });
    
    keyboardShortcuts.register('escape', (e) => {
        // ESC zum Schließen von Modals
        const modals = document.querySelectorAll('.modal-overlay, .modal-content');
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('[data-close], .close-btn');
            if (closeBtn) {
                closeBtn.click();
            }
        });
    });
}
