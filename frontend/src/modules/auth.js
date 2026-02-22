/**
 * Authentifizierungs-Funktionen für FightLog
 * Enthält Passkey-Verwaltung und UI-Toggles
 */

// persistLanguage wird nicht mehr direkt importiert (wird über Parameter übergeben)

/**
 * Zeigt Passkey-Verwaltung an
 * @param {Object} ctx - Vue-Kontext
 */
export function showPasskeyManagement(ctx) {
    ctx.showPasskeyModal = true;
}

/**
 * Schließt Passkey-Modal
 * @param {Object} ctx - Vue-Kontext
 */
export function closePasskeyModal(ctx) {
    ctx.showPasskeyModal = false;
}

/**
 * Registriert einen neuen Passkey
 * @param {Object} ctx - Vue-Kontext
 */
export async function registerPasskey(ctx) {
    if (!window.passkeyManager) {
        window.notify.alert('PasskeyManager nicht verfügbar. Bitte laden Sie die Seite neu.');
        return;
    }
    
    try {
        const username = ctx.currentUser.username;
        const result = await window.passkeyManager.registerPasskey(username);
        
        if (result.success) {
            window.notify.alert('Passkey erfolgreich registriert!');
            closePasskeyModal(ctx);
        } else {
            throw new Error('Passkey-Registrierung fehlgeschlagen');
        }
        
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Passkey-Registrierung fehlgeschlagen:', error);
        } else {
            console.error('[FightLog] Passkey-Registrierung fehlgeschlagen:', error);
        }
        window.notify.alert('Passkey-Registrierung fehlgeschlagen: ' + error.message);
    }
}

/**
 * Entfernt einen Passkey
 * @param {Object} ctx - Vue-Kontext
 * @param {string} passkeyId - Passkey-ID
 */
export async function removePasskey(ctx, passkeyId) {
    const ok = await window.notify.confirm('Passkey wirklich entfernen?');
    if (!ok) return;

    try {
        const username = ctx.currentUser.username;
        window.passkeyManager.removePasskey(username);
        window.notify.alert('Passkey erfolgreich entfernt!');
    } catch (error) {
        console.error('Passkey-Entfernung fehlgeschlagen:', error);
        window.notify.alert('Passkey-Entfernung fehlgeschlagen: ' + error.message);
    }
}

/**
 * Gibt verfügbare Passkeys zurück
 * @param {Object} ctx - Vue-Kontext
 * @returns {Array} Liste der Passkeys
 */
export function getAvailablePasskeys(ctx) {
    if (!window.passkeyManager) return [];
    return window.passkeyManager.listPasskeys();
}

/**
 * Togglet die Passwort-Sichtbarkeit
 * @param {Object} ctx - Vue-Kontext
 */
export function togglePassword(ctx) {
    ctx.showPassword = !ctx.showPassword;
}

/**
 * Setzt die Sprache (aktuell nur Deutsch)
 * @param {Object} ctx - Vue-Kontext
 * @param {string} lang - Sprache
 * @param {Function} persistLanguageFn - persistLanguage Funktion (wird von main.js übergeben)
 */
export function setLanguage(ctx, lang, persistLanguageFn) {
    ctx.currentLanguage = 'de'; // Immer Deutsch
    if (persistLanguageFn) {
        persistLanguageFn('de');
    }
}
