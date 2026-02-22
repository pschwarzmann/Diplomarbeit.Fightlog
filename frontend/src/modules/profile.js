/**
 * Profile & Settings Module
 * Enthält alle Funktionen für Profil- und Einstellungsverwaltung
 */

import { apiService } from '../services/api.service.js';
import { persistAuthState } from '../store/session-store.js';

/**
 * Profil speichern
 */
export async function saveProfile(ctx) {
    try {
        const res = await apiService.updateProfile(ctx.profileForm);
        if (res.success) {
            // Lokale User-Daten aktualisieren
            ctx.currentUser = {
                ...ctx.currentUser,
                ...ctx.profileForm
            };
            // LocalStorage aktualisieren
            persistAuthState(ctx.currentUser);
            await window.notify.alert('Profil erfolgreich gespeichert!');
        } else {
            await window.notify.alert('Fehler: ' + (res.error || 'Profil konnte nicht gespeichert werden'));
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Save profile error:', e);
        } else {
            console.error('[FightLog] Save profile error:', e);
        }
        await window.notify.alert('Fehler beim Speichern des Profils');
    }
}

/**
 * Eigenes Passwort ändern
 */
export async function changePassword(ctx) {
    if (ctx.passwordForm.newPassword !== ctx.passwordForm.confirmPassword) {
        await window.notify.alert('Die Passwörter stimmen nicht überein');
        return;
    }
    const minLength = ctx.generalSettings?.password_min_length || 8;
    if (ctx.passwordForm.newPassword.length < minLength) {
        await window.notify.alert(`Das neue Passwort muss mindestens ${minLength} Zeichen lang sein`);
        return;
    }
    
    try {
        const res = await apiService.changeOwnPassword(
            ctx.passwordForm.currentPassword,
            ctx.passwordForm.newPassword
        );
        if (res.success) {
            // Formular zurücksetzen
            ctx.passwordForm = {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            };
            await window.notify.alert('Passwort erfolgreich geändert!');
        } else {
            await window.notify.alert('Fehler: ' + (res.error || 'Passwort konnte nicht geändert werden'));
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Change password error:', e);
        }
        await window.notify.alert('Fehler beim Ändern des Passworts');
    }
}
