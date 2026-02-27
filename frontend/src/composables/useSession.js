// frontend/src/composables/useSession.js
// Session-Timeout-Logik als Composable

import { apiService } from '../services/api.service.js';
import { logger } from '../config/env.js';

export function useSession(ctx) {
    return {
        startSessionTimeoutCheck() {
            // Prüfe ob Token vorhanden ist (Session-Check braucht Token)
            const token = localStorage.getItem('auth_token');
            if (!token) {
                // Kein Token vorhanden - Session-Check nicht starten
                return;
            }
            
            if (ctx.sessionCheckInterval) {
                clearInterval(ctx.sessionCheckInterval);
            }
            ctx.sessionCheckInterval = setInterval(async () => {
                await ctx.checkSessionTimeout();
            }, 30000);
            
            // Erste Prüfung verzögern (gibt Apache/PHP Zeit den Header zu verarbeiten)
            setTimeout(() => {
                ctx.checkSessionTimeout();
            }, 2000);
        },
        
        stopSessionTimeoutCheck() {
            if (ctx.sessionCheckInterval) {
                clearInterval(ctx.sessionCheckInterval);
                ctx.sessionCheckInterval = null;
            }
        },
        
        async checkSessionTimeout() {
            // Prüfe ob User eingeloggt ist UND Token vorhanden ist
            if (!ctx.isLoggedIn) {
                ctx.stopSessionTimeoutCheck();
                return;
            }
            
            const token = localStorage.getItem('auth_token');
            if (!token) {
                // Kein Token - Session-Check nicht durchführen
                ctx.stopSessionTimeoutCheck();
                return;
            }
            
            try {
                const result = await apiService.getSessionStatus();
                if (result.success) {
                    const remainingSeconds = result.remaining_seconds || 0;
                    ctx.sessionRemainingSeconds = remainingSeconds;
                    if (remainingSeconds <= 60 && remainingSeconds > 0 && !ctx.sessionTimeoutWarning) {
                        ctx.sessionTimeoutWarning = true;
                    }
                    if (remainingSeconds <= 0 || result.expired) {
                        ctx.sessionExpired = true;
                        ctx.stopSessionTimeoutCheck();
                        await window.notify.alert('Ihre Session ist abgelaufen. Sie werden abgemeldet.');
                        await ctx.logout();
                    }
                } else if (result.expired) {
                    // Nur Logout wenn User wirklich eingeloggt war UND Token noch vorhanden ist
                    // UND result.expired explizit true ist (nicht nur success: false)
                    const currentToken = localStorage.getItem('auth_token');
                    if (ctx.isLoggedIn && currentToken && result.expired === true) {
                        ctx.sessionExpired = true;
                        ctx.stopSessionTimeoutCheck();
                        await window.notify.alert('Ihre Session ist abgelaufen. Sie werden abgemeldet.');
                        await ctx.logout();
                    } else {
                        // Kein Token mehr oder nicht eingeloggt oder expired nicht explizit true - einfach stoppen, kein Logout
                        ctx.stopSessionTimeoutCheck();
                    }
                } else {
                    // success: false aber kein expired flag - einfach stoppen, kein Logout
                    ctx.stopSessionTimeoutCheck();
                }
            } catch (error) {
                // 401 Unauthorized: nur behandeln wenn Token vorhanden war UND User eingeloggt ist
                // Wenn kein Token vorhanden ist, dann war User nie richtig eingeloggt - kein Logout
                if (error.message && error.message.includes('401')) {
                    const currentToken = localStorage.getItem('auth_token');
                    if (currentToken && ctx.isLoggedIn) {
                        // Token war vorhanden aber Session abgelaufen - Logout
                        ctx.sessionExpired = true;
                        ctx.stopSessionTimeoutCheck();
                        await window.notify.alert('Ihre Session ist abgelaufen. Sie werden abgemeldet.');
                        await ctx.logout();
                    } else {
                        // Kein Token oder nicht eingeloggt - einfach Session-Check stoppen, kein Logout
                        ctx.stopSessionTimeoutCheck();
                    }
                    return;
                }
                // Andere Fehler nur in Development loggen
                if (window.FIGHTLOG_DEBUG === 'true') {
                    console.warn('Session check failed:', error);
                }
            }
        },
        
        async extendSession() {
            try {
                const result = await apiService.extendSession();
                if (result.success) {
                    ctx.sessionTimeoutWarning = false;
                    ctx.sessionRemainingSeconds = result.remaining_seconds;
                    await window.notify.alert('Session erfolgreich verlängert.');
                } else {
                    await window.notify.alert('Session konnte nicht verlängert werden: ' + (result.error || 'Unbekannt'));
                }
            } catch (error) {
                logger.error('Extend session error:', error);
                await window.notify.alert('Fehler beim Verlängern der Session.');
            }
        }
    };
}
