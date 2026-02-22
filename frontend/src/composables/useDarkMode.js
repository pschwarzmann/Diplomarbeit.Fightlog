// frontend/src/composables/useDarkMode.js
// Dark Mode Toggle mit Persistierung

export function useDarkMode() {
    const STORAGE_KEY = 'fightlog_dark_mode';
    
    function isDarkMode() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
            return stored === 'true';
        }
        // Fallback: System-Präferenz
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    function setDarkMode(enabled) {
        localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
        if (enabled) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
    }
    
    function toggle() {
        const current = document.documentElement.classList.contains('dark-mode');
        setDarkMode(!current);
    }
    
    // Initialisierung
    if (isDarkMode()) {
        document.documentElement.classList.add('dark-mode');
    }
    
    return {
        isDarkMode,
        setDarkMode,
        toggle
    };
}
