/**
 * API-Actions Modul für FightLog
 * Enthält Wrapper-Funktionen für API-Calls mit Caching und Error-Handling
 */

import { apiService } from '../services/api.service.js';

/**
 * Cache-Helper: Prüft ob Cache gültig ist
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} cacheKey - Cache-Schlüssel
 * @returns {Object|null} Cached data oder null
 */
function getCached(ctx, cacheKey) {
    const cached = ctx._apiCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < ctx._cacheTimeout) {
        return cached.data;
    }
    return null;
}

/**
 * Cache-Helper: Speichert Daten im Cache
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} cacheKey - Cache-Schlüssel
 * @param {*} data - Zu cachende Daten
 */
function setCached(ctx, cacheKey, data) {
    ctx._apiCache[cacheKey] = { data, timestamp: Date.now() };
}

/**
 * Cache-Helper: Invalidiert einen bestimmten Cache-Eintrag
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} cacheKey - Cache-Schlüssel
 */
export function invalidateCache(ctx, cacheKey) {
    if (ctx._apiCache && ctx._apiCache[cacheKey]) {
        delete ctx._apiCache[cacheKey];
    }
}

/**
 * Error-Handler: Loggt Fehler konsistent
 * @param {Error|Object} error - Fehler-Objekt
 * @param {string} context - Kontext (z.B. 'Load certificates')
 */
function handleError(error, context) {
    if (window.FightLogLogger) {
        window.FightLogLogger.error(`${context} error:`, error);
    } else {
        console.error(`[FightLog] ${context} error:`, error);
    }
}

// ========== LOAD FUNCTIONS ==========

/**
 * Lädt Urkunden mit Cache
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function loadCertificates(ctx) {
    const cacheKey = 'certificates';
    const cached = getCached(ctx, cacheKey);
    if (cached) {
        ctx.certificates = cached;
        return;
    }
    
    try {
        ctx.certificates = await apiService.getCertificates();
        setCached(ctx, cacheKey, ctx.certificates);
        // Lade auch die Urkunden-Einstellungen
        await loadCertificateSettings(ctx);
    } catch (error) {
        handleError(error, 'Load certificates');
    }
}

/**
 * Lädt Urkunden-Einstellungen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function loadCertificateSettings(ctx) {
    try {
        const response = await apiService.getCertificateSettings();
        if (response && response.success && response.settings) {
            ctx.certificateSettings = response.settings;
        }
    } catch (error) {
        handleError(error, 'Load certificate settings');
    }
}

/**
 * Lädt allgemeine Einstellungen (nur für Admin)
 * @param {Object} ctx - Vue-Komponenten-Kontext
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
        handleError(error, 'Load general settings');
    }
}

/**
 * Lädt Prüfungen mit Cache
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function loadExams(ctx) {
    const cacheKey = `exams_${ctx.currentUser?.id || 'all'}`;
    const cached = getCached(ctx, cacheKey);
    if (cached) {
        ctx.exams = cached;
        return;
    }
    
    try {
        const uid = (ctx.currentUser && ctx.currentUser.role === 'schueler') ? ctx.currentUser.id : null;
        ctx.exams = await apiService.getExams(uid);
        setCached(ctx, cacheKey, ctx.exams);
    } catch (error) {
        handleError(error, 'Load exams');
    }
}

/**
 * Lädt Ziel-Templates mit Cache
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function loadGoalTemplates(ctx) {
    const cacheKey = 'goalTemplates';
    const cached = getCached(ctx, cacheKey);
    if (cached) {
        ctx.goalTemplates = cached.templates;
        ctx.goalCategories = cached.categories;
        return;
    }
    
    try {
        const templatesRes = await apiService.getGoalTemplates();
        ctx.goalTemplates = Array.isArray(templatesRes.templates) ? [...templatesRes.templates] : [];
        
        const categoriesRes = await apiService.getGoalCategories();
        ctx.goalCategories = Array.isArray(categoriesRes.categories) ? [...categoriesRes.categories] : [];
        
        setCached(ctx, cacheKey, { templates: ctx.goalTemplates, categories: ctx.goalCategories });
    } catch (error) {
        handleError(error, 'Load goal templates');
    }
}

/**
 * Lädt User-Ziele (oder alle für Admin)
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function loadGoals(ctx) {
    try {
        if (ctx.currentUser && ctx.currentUser.role === 'admin') {
            const res = await apiService.getAllGoals();
            ctx.allUsersGoals = res.goals || [];
            ctx.goals = [];
        } else {
            const userId = ctx.currentUser ? ctx.currentUser.id : null;
            const res = await apiService.getGoals(userId);
            ctx.goals = res.goals || [];
            ctx.allUsersGoals = [];
        }
    } catch (error) {
        handleError(error, 'Load goals');
    }
}

/**
 * Lädt Benutzer-Liste mit Cache
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function loadUsers(ctx) {
    const cacheKey = 'users';
    const cached = getCached(ctx, cacheKey);
    if (cached) {
        ctx.adminUserList = cached;
        return;
    }
    
    try {
        const users = await apiService.getUsers();
        if (!Array.isArray(users)) {
            ctx.adminUserList = [];
            return;
        }
        const mappedUsers = users.map(user => ({
            ...user,
            _open: user._open || false,
            _isEditing: user._isEditing || false,
            _editForm: user._editForm || null,
            _isSaving: user._isSaving || false,
            _newPassword: user._newPassword || '',
            _passwordChanged: user._passwordChanged || false,
            _validationErrors: user._validationErrors || {}
        }));
        ctx.adminUserList = mappedUsers;
        setCached(ctx, cacheKey, mappedUsers);
    } catch (error) {
        ctx.adminUserList = [];
    }
}

/**
 * Lädt Kurse mit Cache
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function loadCourses(ctx) {
    const cacheKey = 'courses';
    const cached = getCached(ctx, cacheKey);
    if (cached) {
        ctx.courses = cached;
        return;
    }
    
    try {
        ctx.courses = await apiService.getCourses();
        setCached(ctx, cacheKey, ctx.courses);
    } catch (error) {
        handleError(error, 'Load courses');
    }
}

/**
 * Lädt Gruppen mit Cache
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function loadGroups(ctx) {
    const cacheKey = 'groups';
    const cached = getCached(ctx, cacheKey);
    if (cached) {
        ctx.studentGroups = cached;
        return;
    }
    
    try {
        const response = await apiService.getGroups();
        if (response.success) {
            const mappedGroups = response.groups.map(g => ({
                ...g,
                _showMembers: false
            }));
            ctx.studentGroups = mappedGroups;
            setCached(ctx, cacheKey, mappedGroups);
        }
    } catch (error) {
        handleError(error, 'Load groups');
    }
}

/**
 * Lädt Gürtelgrade mit Cache
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function loadGrades(ctx) {
    const cacheKey = 'grades';
    const cached = getCached(ctx, cacheKey);
    if (cached) {
        ctx.grades = cached;
        return;
    }
    
    try {
        const res = await apiService.getGrades();
        if (res.success) {
            ctx.grades = res.grades || [];
            setCached(ctx, cacheKey, ctx.grades);
        }
    } catch (error) {
        handleError(error, 'Load grades');
    }
}

// ========== SAVE FUNCTIONS ==========

/**
 * Speichert allgemeine Einstellungen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function saveGeneralSettings(ctx) {
    ctx.savingGeneralSettings = true;
    ctx.generalSettingsError = null;
    try {
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
            await loadGeneralSettings(ctx);
        } else {
            ctx.generalSettingsError = result.error || 'Fehler beim Speichern';
        }
    } catch (error) {
        handleError(error, 'Save general settings');
        ctx.generalSettingsError = 'Fehler beim Speichern der Einstellungen';
    } finally {
        ctx.savingGeneralSettings = false;
    }
}

/**
 * Speichert Urkunden-Einstellungen
 * @param {Object} ctx - Vue-Komponenten-Kontext
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
        handleError(error, 'Save certificate settings');
        window.notify.alert('Fehler beim Speichern der Einstellungen');
    }
}

/**
 * Erstellt manuelle Urkunde
 * @param {Object} ctx - Vue-Komponenten-Kontext
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
        handleError(error, 'Create certificate');
        window.notify.alert('Fehler beim Erstellen der Urkunde');
    }
}

/**
 * Löscht manuelle Urkunde
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {number} id - Urkunden-ID
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
        handleError(error, 'Delete certificate');
        window.notify.alert('Fehler beim Löschen der Urkunde');
    }
}

/**
 * Lädt Trainingsverlauf
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function loadTrainingHistory(ctx) {
    try {
        ctx.trainingHistory = await apiService.getTrainingHistory();
    } catch (error) {
        handleError(error, 'Load training history');
    }
}

/**
 * Lädt Profil-Daten
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function loadProfile(ctx) {
    try {
        const res = await apiService.getOwnProfile();
        if (res.success && res.user) {
            ctx.profileForm = {
                firstName: res.user.firstName || '',
                lastName: res.user.lastName || '',
                email: res.user.email || '',
                phone: res.user.phone || '',
                school: res.user.school || '',
                beltLevel: res.user.beltLevel || ''
            };
        }
    } catch (error) {
        handleError(error, 'Load profile');
        // Fallback: currentUser verwenden
        if (ctx.currentUser) {
            ctx.profileForm = {
                firstName: ctx.currentUser.firstName || '',
                lastName: ctx.currentUser.lastName || '',
                email: ctx.currentUser.email || '',
                phone: ctx.currentUser.phone || '',
                school: ctx.currentUser.school || '',
                beltLevel: ctx.currentUser.beltLevel || ''
            };
        }
    }
}
