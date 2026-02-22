/**
 * API-Call-Funktionen für FightLog
 * Enthält alle Funktionen zum Laden und Speichern von Daten über die API
 */

import { apiService } from '../services/api.service.js';
import { toISODate, toGermanDate } from './utils.js';

/**
 * Lädt Zertifikate
 * @param {Object} ctx - Vue-Kontext
 */
export async function loadCertificates(ctx) {
    // Performance: Cache-Check (verhindert doppelte Requests)
    const cacheKey = 'certificates';
    const cached = ctx._apiCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < ctx._cacheTimeout) {
        ctx.certificates = cached.data;
        return;
    }
    
    try {
        ctx.certificates = await apiService.getCertificates();
        // Cache speichern
        ctx._apiCache[cacheKey] = { data: ctx.certificates, timestamp: Date.now() };
        // Lade auch die Urkunden-Einstellungen
        await loadCertificateSettings(ctx);
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Load certificates error:', error);
        }
    }
}

/**
 * Lädt Zertifikats-Einstellungen
 * @param {Object} ctx - Vue-Kontext
 */
export async function loadCertificateSettings(ctx) {
    try {
        const response = await apiService.getCertificateSettings();
        if (response && response.success && response.settings) {
            ctx.certificateSettings = response.settings;
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Load certificate settings error:', error);
        }
    }
}

/**
 * Speichert Zertifikats-Einstellungen
 * @param {Object} ctx - Vue-Kontext
 */
export async function saveCertificateSettings(ctx) {
    try {
        const result = await apiService.saveCertificateSettings(ctx.certificateSettings);
        if (result.success) {
            window.notify.alert('Urkunden-Einstellungen gespeichert!');
        } else {
            window.notify.alert(result.error || 'Fehler beim Speichern');
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Save certificate settings error:', error);
        }
        window.notify.alert('Fehler beim Speichern der Einstellungen');
    }
}

/**
 * Erstellt ein manuelles Zertifikat
 * @param {Object} ctx - Vue-Kontext
 */
export async function createManualCertificate(ctx) {
    try {
        if (!ctx.manualCertificateForm.studentId) {
            window.notify.alert('Bitte einen Schüler auswählen.');
            return;
        }
        if (!ctx.manualCertificateForm.title || !ctx.manualCertificateForm.date || !ctx.manualCertificateForm.instructor) {
            window.notify.alert('Bitte alle Pflichtfelder ausfüllen.');
            return;
        }
        
        const result = await apiService.createManualCertificate({
            title: ctx.manualCertificateForm.title,
            date: ctx.manualCertificateForm.date,
            level: ctx.manualCertificateForm.level,
            instructor: ctx.manualCertificateForm.instructor,
            userId: ctx.manualCertificateForm.studentId
        });
        
        if (result.success) {
            window.notify.alert('Urkunde erfolgreich erstellt!');
            ctx.manualCertificateForm = {
                title: '',
                date: '',
                level: '',
                instructor: '',
                studentQuery: '',
                studentId: null,
                studentName: ''
            };
            ctx.showManualCertificateForm = false;
            await loadCertificates(ctx);
        } else {
            window.notify.alert(result.error || 'Fehler beim Erstellen der Urkunde');
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Create certificate error:', error);
        }
        window.notify.alert('Fehler beim Erstellen der Urkunde');
    }
}

/**
 * Löscht ein manuelles Zertifikat
 * @param {Object} ctx - Vue-Kontext
 * @param {number} id - Zertifikat-ID
 */
export async function deleteManualCertificate(ctx, id) {
    const ok = await window.notify.confirm('Möchten Sie diese Urkunde wirklich löschen?');
    if (!ok) return;
    
    try {
        const result = await apiService.deleteCertificate(id);
        if (result.success) {
            window.notify.alert('Urkunde gelöscht.');
            ctx.showCertificateDetailModal = false;
            await loadCertificates(ctx);
        } else {
            window.notify.alert(result.error || 'Fehler beim Löschen');
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Delete certificate error:', error);
        }
        window.notify.alert('Fehler beim Löschen der Urkunde');
    }
}

/**
 * Löscht ein Zertifikat
 * @param {Object} ctx - Vue-Kontext
 * @param {Object} cert - Zertifikat-Objekt
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
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Delete certificate error:', e);
        }
        window.notify.alert('Fehler beim Löschen der Urkunde');
    }
}

/**
 * Lädt Prüfungen
 * @param {Object} ctx - Vue-Kontext
 */
export async function loadExams(ctx) {
    // Performance: Cache-Check (verhindert doppelte Requests)
    const cacheKey = `exams_${ctx.currentUser?.id || 'all'}`;
    const cached = ctx._apiCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < ctx._cacheTimeout) {
        ctx.exams = cached.data;
        return;
    }
    
    try {
        const uid = (ctx.currentUser && ctx.currentUser.role === 'schueler') ? ctx.currentUser.id : null;
        ctx.exams = await apiService.getExams(uid);
        // Cache speichern
        ctx._apiCache[cacheKey] = { data: ctx.exams, timestamp: Date.now() };
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Load exams error:', error);
        }
    }
}

/**
 * Fügt eine Prüfung hinzu
 * @param {Object} ctx - Vue-Kontext
 */
export async function addExam(ctx) {
    try {
        // Prüfe ob Datum in der Zukunft liegt
        if (ctx.examForm.date) {
            // Parse als lokales Datum (YYYY-MM-DD)
            const parts = ctx.examForm.date.split('-');
            const examDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            examDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (examDate > today) {
                window.notify.alert('Das Prüfungsdatum darf nicht in der Zukunft liegen.');
                return;
            }
        }
        const targetIds = (ctx.examForm.userIds && ctx.examForm.userIds.length)
            ? ctx.examForm.userIds
            : (ctx.examForm.userId ? [ctx.examForm.userId] : []);
        if (!targetIds.length) return window.notify.alert('Bitte mindestens einen Schüler auswählen.');
        for (const uid of targetIds) {
            await apiService.addExam({ ...ctx.examForm, userId: uid });
        }
        const response = { success: true };
        if (response.success) {
            window.notify.alert('Prüfung erfolgreich eingetragen!');
            ctx.examForm = {
                date: '',
                level: '',
                category: '',
                score: '',
                instructor: '',
                comments: '',
                userId: null,
                userIds: [],
                studentQuery: '',
                selectedStudents: []
            };
            await loadExams(ctx);
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Add exam error:', error);
        }
        window.notify.alert('Prüfungseintrag fehlgeschlagen');
    }
}

/**
 * Speichert Prüfungs-Bearbeitung
 * @param {Object} ctx - Vue-Kontext
 */
export async function saveExamEdit(ctx) {
    try {
        // Konvertiere deutsches Datum zu ISO
        const isoDate = toISODate(ctx.examEditForm.date);
        
        // Prüfe ob Datum in der Zukunft liegt
        if (isoDate) {
            const parts = isoDate.split('-');
            const examDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            examDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (examDate > today) {
                window.notify.alert('Das Prüfungsdatum darf nicht in der Zukunft liegen.');
                return;
            }
        }
        const res = await apiService.updateExam({
            id: ctx.examEditForm.id,
            userId: ctx.examEditForm.userId,
            date: isoDate,
            level: ctx.examEditForm.level,
            category: ctx.examEditForm.category,
            instructor: ctx.examEditForm.instructor,
            comments: ctx.examEditForm.comments,
            status: ctx.examEditForm.status
        });
        if (res.success) {
            window.notify.alert('Prüfung erfolgreich aktualisiert!');
            ctx.showExamEditModal = false;
            await loadExams(ctx);
        } else {
            window.notify.alert('Fehler beim Speichern: ' + (res.error || 'Unbekannter Fehler'));
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Update exam error:', e);
        }
        window.notify.alert('Fehler beim Speichern der Prüfung');
    }
}

/**
 * Löscht eine Prüfung
 * @param {Object} ctx - Vue-Kontext
 * @param {Object} exam - Prüfungs-Objekt
 */
export async function deleteExam(ctx, exam) {
    const ok = await window.notify.confirm('Diesen Prüfungseintrag wirklich löschen?');
    if (!ok) return;
    try {
        const res = await apiService.deleteExam(exam.id);
        if (res.success) {
            ctx.exams = ctx.exams.filter(e => e.id !== exam.id);
        } else {
            window.notify.alert('Fehler beim Löschen');
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Delete exam error:', e);
        }
        window.notify.alert('Fehler beim Löschen');
    }
}

/**
 * Lädt allgemeine Einstellungen
 * @param {Object} ctx - Vue-Kontext
 */
export async function loadGeneralSettings(ctx) {
    try {
        if (!ctx.currentUser || ctx.currentUser.role !== 'admin') {
            return;
        }
        const response = await apiService.getGeneralSettings();
        if (response && response.success && response.settings) {
            ctx.generalSettings = {
                password_min_length: parseInt(response.settings.password_min_length) || 8
            };
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Load general settings error:', error);
        }
    }
}

/**
 * Speichert allgemeine Einstellungen
 * @param {Object} ctx - Vue-Kontext
 */
export async function saveGeneralSettings(ctx) {
    ctx.savingGeneralSettings = true;
    ctx.generalSettingsError = null;
    try {
        // Validierung
        const minLength = parseInt(ctx.generalSettings.password_min_length);
        if (isNaN(minLength) || minLength < 4 || minLength > 128) {
            ctx.generalSettingsError = 'Passwort-Mindestlänge muss zwischen 4 und 128 liegen';
            ctx.savingGeneralSettings = false;
            return;
        }
        
        const result = await apiService.saveGeneralSettings({
            password_min_length: String(minLength)
        });
        
        if (result.success) {
            window.notify.alert('Einstellungen gespeichert!');
            // Aktualisiere sofort nach Speichern
            await loadGeneralSettings(ctx);
        } else {
            ctx.generalSettingsError = result.error || 'Fehler beim Speichern';
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Save general settings error:', error);
        }
        ctx.generalSettingsError = 'Fehler beim Speichern der Einstellungen';
    } finally {
        ctx.savingGeneralSettings = false;
    }
}

// Weitere API-Funktionen werden hier hinzugefügt...
// (loadGoalTemplates, loadGoals, loadUsers, loadGroups, loadCourses, loadGrades, etc.)
