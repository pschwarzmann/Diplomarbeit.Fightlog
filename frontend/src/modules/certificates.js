/**
 * Certificates Modul für FightLog
 * Enthält CRUD-Operationen für Urkunden
 */

import { apiService } from '../services/api.service.js';

/**
 * Error-Handler: Loggt Fehler konsistent
 */
function handleError(error, context) {
    if (window.FightLogLogger) {
        window.FightLogLogger.error(`${context} error:`, error);
    } else {
        console.error(`[FightLog] ${context} error:`, error);
    }
}

/**
 * Löscht eine Urkunde
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Object} cert - Urkunden-Objekt
 */
export async function deleteCertificate(ctx, cert) {
    const ok = await window.notify.confirm('Diese Urkunde löschen?');
    if (!ok) return;
    try {
        const res = await apiService.deleteCertificate(cert.id);
        if (res.success) {
            ctx.certificates = ctx.certificates.filter(c => c.id !== cert.id);
            window.notify.alert('Urkunde gelöscht!');
        } else {
            window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
        }
    } catch (e) {
        handleError(e, 'Delete certificate');
        window.notify.alert('Fehler beim Löschen der Urkunde');
    }
}
