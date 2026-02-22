// frontend/src/services/loading.service.js
// Globaler Loading-State-Manager für API-Calls

class LoadingService {
    constructor() {
        this.loadingStates = new Map();
        this.globalLoading = false;
        this.loadingOverlay = null;
        this.initOverlay();
    }

    initOverlay() {
        if (typeof document === 'undefined') return;
        
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.id = 'global-loading-overlay';
        this.loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(4px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9998;
            pointer-events: none;
        `;
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div style="
                width: 48px;
                height: 48px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top-color: #0a84ff;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            "></div>
        `;
        
        // Add spin animation if not exists
        if (!document.getElementById('loading-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-style';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        this.loadingOverlay.appendChild(spinner);
        document.body.appendChild(this.loadingOverlay);
    }

    setLoading(key, isLoading) {
        if (isLoading) {
            this.loadingStates.set(key, true);
        } else {
            this.loadingStates.delete(key);
        }
        this.updateGlobalLoading();
    }

    isLoading(key) {
        return this.loadingStates.has(key);
    }

    updateGlobalLoading() {
        const wasLoading = this.globalLoading;
        this.globalLoading = this.loadingStates.size > 0;
        
        if (this.loadingOverlay) {
            if (this.globalLoading && !wasLoading) {
                this.loadingOverlay.style.display = 'flex';
            } else if (!this.globalLoading && wasLoading) {
                this.loadingOverlay.style.display = 'none';
            }
        }
    }

    clearAll() {
        this.loadingStates.clear();
        this.updateGlobalLoading();
    }
}

export const loadingService = new LoadingService();
