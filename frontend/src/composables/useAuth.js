// frontend/src/composables/useAuth.js
// Auth-Logik als Composable (ctx-Parameter Pattern)

import { apiService } from '../services/api.service.js';
import { persistAuthState, clearAuthState, cacheUsername, clearUsernameCache } from '../store/session-store.js';
import { logger } from '../config/env.js';

export function useAuth(ctx) {
    return {
        async handleLogin() {
            try {
                const response = await apiService.login({
                    identifier: ctx.authForm.username,
                    password: ctx.authForm.password
                });
                
                if (response.success && response.user) {
                    ctx.isLoggedIn = true;
                    ctx.currentUser = response.user;
                    persistAuthState(true, response.user);
                    cacheUsername(response.user.username);
                    
                    if (response.token) {
                        // Token in localStorage speichern für API-Calls
                        localStorage.setItem('auth_token', response.token);
                    }
                    
                    await ctx.loadPageData();
                    
                    // Session-Check NACH Token-Speicherung starten
                    if (response.token && ctx.startSessionTimeoutCheck) {
                        ctx.startSessionTimeoutCheck();
                    }
                    
                    ctx.authForm = {
                        username: '',
                        email: '',
                        password: '',
                        role: 'schueler',
                        stayLoggedIn: false,
                        phone: ''
                    };
                } else {
                    const errorMessage = response.error || 'Login fehlgeschlagen. Bitte überprüfe deine Anmeldedaten.';
                    await window.notify.alert(errorMessage);
                }
            } catch (error) {
                console.error('Login error:', error);
                await window.notify.alert('Verbindungsfehler. Bitte versuche es später erneut.');
            }
        },
        
        async handleRegister() {
            try {
                if (!ctx.validateEmail() || !ctx.validatePhone()) {
                    await window.notify.alert(ctx.validateEmail() ? ctx.t('phoneInvalid') : ctx.t('emailInvalid'));
                    return;
                }
                const payload = { ...ctx.authForm, role: 'schueler' };
                const response = await apiService.register(payload);
                if (response.success) {
                    await window.notify.alert('Registrierung erfolgreich! Sie können sich jetzt anmelden.');
                    ctx.showRegister = false;
                    ctx.authForm = {
                        username: '',
                        email: '',
                        password: '',
                        role: 'schueler',
                        stayLoggedIn: false,
                        phone: '',
                        firstName: '',
                        lastName: ''
                    };
                }
            } catch (error) {
                logger.error('Register error:', error);
                await window.notify.alert('Registrierung fehlgeschlagen');
            }
        },
        
        async logout() {
            ctx.stopSessionTimeoutCheck();
            try {
                await apiService.logout();
            } catch (e) {
                logger.warn('Logout API error:', e);
            }
            // Token entfernen
            localStorage.removeItem('auth_token');
            clearUsernameCache();
            clearAuthState();
            if (typeof window.navigateWithTransition === 'function') {
                window.navigateWithTransition('simple.html');
            } else {
                const overlay = document.createElement('div');
                overlay.id = 'page-transition';
                overlay.className = 'page-transition show';
                document.body.appendChild(overlay);
                setTimeout(()=> { window.location.href = 'simple.html'; }, 280);
            }
        }
    };
}
