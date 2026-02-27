/**
 * Form-Validierung für FightLog
 * Enthält Validierungsfunktionen für verschiedene Formulare
 */

/**
 * Validiert User-Edit-Formular
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Object} user - User-Objekt mit _editForm
 * @returns {boolean} true wenn valide
 */
export function validateUserForm(ctx, user) {
    const errors = {};
    const form = user._editForm;
    
    if (!form.email || form.email.trim() === '') {
        errors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Ungültige E-Mail-Adresse';
    }
    
    if (!form.role || !['schueler', 'trainer', 'admin'].includes(form.role)) {
        errors.role = 'Ungültige Rolle';
    }
    
    if (form.newPassword && form.newPassword.trim() !== '') {
        const minLength = ctx.generalSettings?.password_min_length || 8;
        if (form.newPassword.length < minLength) {
            errors.newPassword = `Passwort muss mindestens ${minLength} Zeichen lang sein`;
        }
    }
    
    user._validationErrors = errors;
    return Object.keys(errors).length === 0;
}

/**
 * Validiert Create-User-Formular
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @returns {boolean} true wenn valide
 */
export function validateCreateUserForm(ctx) {
    const errors = {};
    const form = ctx.createUserForm;
    
    if (!form.username || form.username.trim() === '') {
        errors.username = 'Benutzername ist erforderlich';
    } else if (form.username.trim().length < 3) {
        errors.username = 'Benutzername muss mindestens 3 Zeichen lang sein';
    }
    
    if (!form.email || form.email.trim() === '') {
        errors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Ungültige E-Mail-Adresse';
    }
    
    if (!form.password || form.password.trim() === '') {
        errors.password = 'Passwort ist erforderlich';
    } else {
        const minLength = ctx.generalSettings?.password_min_length || 8;
        if (form.password.length < minLength) {
            errors.password = `Passwort muss mindestens ${minLength} Zeichen lang sein`;
        }
    }
    
    if (!form.role || !['schueler', 'trainer', 'admin'].includes(form.role)) {
        errors.role = 'Ungültige Rolle';
    }
    
    ctx.createUserForm._validationErrors = errors;
    return Object.keys(errors).length === 0;
}

/**
 * Validiert Prüfungsdatum (darf nicht in Zukunft liegen)
 * @param {string} dateStr - Datum im Format YYYY-MM-DD
 * @returns {boolean} true wenn valide
 */
export function validateExamDate(dateStr) {
    if (!dateStr) return true; // Optional
    const str = String(dateStr).trim();
    if (!str) return true;
    let year, month, day;
    // Unterstütze sowohl ISO (YYYY-MM-DD) als auch deutsches Format (DD.MM.YYYY)
    const germanMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (germanMatch) {
        day = parseInt(germanMatch[1], 10);
        month = parseInt(germanMatch[2], 10);
        year = parseInt(germanMatch[3], 10);
    } else if (isoMatch) {
        year = parseInt(isoMatch[1], 10);
        month = parseInt(isoMatch[2], 10);
        day = parseInt(isoMatch[3], 10);
    } else {
        return false;
    }
    const examDate = new Date(year, month - 1, day);
    examDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return examDate <= today;
}
