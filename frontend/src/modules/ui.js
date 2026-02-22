/**
 * UI-Manipulations-Funktionen für FightLog
 * Enthält Funktionen für UI-Interaktionen, Navigation, Modals
 */

import { useDarkMode } from '../composables/useDarkMode.js';
// persistLanguage wird nicht mehr direkt importiert, sondern über ctx.setLanguage() verwendet

/**
 * Navigation zu einer Seite
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} page - Seitenname
 */
export function navigateTo(ctx, page) {
    ctx.currentPage = page;
    ctx.loadPageData();
}

/**
 * Navigation zum Dashboard
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export function goToDashboard(ctx) {
    ctx.currentPage = 'dashboard';
}

/**
 * Dark Mode umschalten
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export function toggleDarkMode(ctx) {
    const darkMode = useDarkMode();
    darkMode.toggle();
    ctx.darkModeEnabled = darkMode.isDarkMode();
}

/**
 * Passwort-Sichtbarkeit umschalten
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export function togglePassword(ctx) {
    ctx.showPassword = !ctx.showPassword;
}

/**
 * Sprache setzen (nur Deutsch)
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} lang - Sprache (wird ignoriert, immer 'de')
 * @param {Function} persistLanguageFn - persistLanguage Funktion (wird von main.js übergeben)
 */
export function setLanguage(ctx, lang, persistLanguageFn) {
    ctx.currentLanguage = 'de'; // Immer Deutsch
    if (persistLanguageFn) {
        persistLanguageFn('de');
    }
}

/**
 * Passkey-Verwaltung anzeigen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export function showPasskeyManagement(ctx) {
    ctx.showPasskeyModal = true;
}

/**
 * Passkey-Modal schließen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export function closePasskeyModal(ctx) {
    ctx.showPasskeyModal = false;
}

/**
 * Passkey registrieren
 * @param {Object} ctx - Vue-Komponenten-Kontext
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
 * Passkey entfernen
 * @param {Object} ctx - Vue-Komponenten-Kontext
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
 * Verfügbare Passkeys abrufen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @returns {Array} Liste der Passkeys
 */
export function getAvailablePasskeys(ctx) {
    if (!window.passkeyManager) return [];
    return window.passkeyManager.listPasskeys();
}

/**
 * Urkunden-Detail-Modal öffnen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Object} cert - Urkunden-Objekt
 */
export function openCertificateDetail(ctx, cert) {
    ctx.selectedCertificate = cert;
    ctx.showCertificateDetailModal = true;
}

/**
 * Schüler für manuelle Urkunde auswählen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Object} user - User-Objekt
 */
export function selectStudentForManualCertificate(ctx, user) {
    ctx.manualCertificateForm.studentId = user.id;
    ctx.manualCertificateForm.studentName = user.name;
    ctx.manualCertificateForm.studentQuery = '';
}

/**
 * Suchfelder leeren
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} type - Typ ('certificate', 'exam', 'course')
 */
export function clearSearch(ctx, type) {
    if (type === 'certificate') {
        ctx.certificateSearch = '';
    } else if (type === 'exam') {
        ctx.examSearch = '';
    } else if (type === 'course') {
        ctx.courseSearch = '';
    }
}

/**
 * Settings-Tab setzen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} tab - Tab-Name
 */
export function setSettingsTab(ctx, tab) {
    ctx.currentSettingsTab = tab;
    // Optional: Scroll to top on mobile for better UX
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}
}
