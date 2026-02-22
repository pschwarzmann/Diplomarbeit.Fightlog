// frontend/src/utils/logger.js
// Zentraler Logger für Production-ready Logging
// Wird von main.js verwendet (da main.js kein ES6 Module ist)

(function() {
    'use strict';
    
    // Prüfe ob Debug-Modus aktiv ist
    function isDebugMode() {
        return window.location.port === '3000' || 
               window.location.port === '8080' ||
               window.FIGHTLOG_DEBUG === 'true';
    }
    
    // Logger-Utility
    window.FightLogLogger = {
        log(...args) {
            if (isDebugMode()) {
                console.log('[FightLog]', ...args);
            }
        },
        warn(...args) {
            if (isDebugMode()) {
                console.warn('[FightLog]', ...args);
            }
        },
        error(...args) {
            // Errors immer loggen (auch in Production für Monitoring)
            console.error('[FightLog]', ...args);
        },
        debug(...args) {
            if (isDebugMode()) {
                console.debug('[FightLog]', ...args);
            }
        }
    };
})();
