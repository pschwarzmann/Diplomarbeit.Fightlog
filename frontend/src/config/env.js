// frontend/src/config/env.js
// Environment-Konfiguration für Production/Development

/**
 * Prüft ob Development-Modus aktiv ist
 * Production: Keine Port-Nummer oder Port 80/443
 */
export function isDevelopment() {
    // Prüfe auf explizite Environment-Variable (für Build-Tools)
    if (typeof window !== 'undefined' && window.FIGHTLOG_ENV === 'development') {
        return true;
    }
    if (typeof window !== 'undefined' && window.FIGHTLOG_ENV === 'production') {
        return false;
    }
    
    // Fallback: Port-basierte Erkennung
    const port = window.location.port;
    return port === '3000' || port === '8080' || port === '';
}

/**
 * Gibt die Base URL für API-Calls zurück
 * 
 * Priorität:
 * 1. window.FIGHTLOG_API_URL (explizite Konfiguration)
 * 2. Relative Pfad (Production-ready)
 * 3. Development-Fallback nur wenn explizit Dev-Modus
 */
export function getApiBaseUrl() {
    // Prüfe auf explizite Konfiguration (höchste Priorität)
    if (typeof window !== 'undefined' && window.FIGHTLOG_API_URL) {
        return window.FIGHTLOG_API_URL;
    }
    
    // Production: Relativer Pfad (funktioniert immer, auch auf Server)
    // Nur wenn explizit Development-Modus UND Port 3000 → localhost Fallback
    if (isDevelopment() && window.location.port === '3000' && window.location.hostname === 'localhost') {
        return 'http://localhost:8080/api';
    }
    
    // Standard: Relativer Pfad (server-ready)
    return '../backend/api';
}

/**
 * Prüft ob Debug-Logs aktiviert sein sollen
 */
export function isDebugMode() {
    return isDevelopment() || (typeof window !== 'undefined' && window.FIGHTLOG_DEBUG === 'true');
}

/**
 * Logger-Utility für Production-ready Logging
 */
export const logger = {
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
