/**
 * Utility-Funktionen für FightLog
 * Enthält Hilfsfunktionen für Datum, Formatierung, Validierung
 */

/**
 * Konvertiert deutsches Datum (31.12.2025) zu ISO (2025-12-31)
 * @param {string} dateStr - Datum im deutschen Format
 * @returns {string} Datum im ISO-Format
 */
export function toISODate(dateStr) {
    if (!dateStr) return '';
    // Bereits im ISO-Format?
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Deutsches Format: DD.MM.YYYY
    const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
    }
    return dateStr;
}

/**
 * Konvertiert ISO-Datum (2025-12-31) zu deutschem Format (31.12.2025)
 * @param {string} dateStr - Datum im ISO-Format
 * @returns {string} Datum im deutschen Format
 */
export function toGermanDate(dateStr) {
    if (!dateStr || dateStr === '0000-00-00') return '';
    // Bereits im deutschen Format?
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) return dateStr;
    // ISO-Format: YYYY-MM-DD
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        return `${parseInt(match[3], 10)}.${parseInt(match[2], 10)}.${match[1]}`;
    }
    return dateStr;
}

/**
 * Formatiert ein Datum: 2025-12-26 -> 26. Dez. 2025
 * @param {string} dateStr - ISO-Datumsstring
 * @returns {string} Formatierter String
 */
export function formatDate(dateStr) {
    if (!dateStr || dateStr === '0000-00-00') return 'Kein Datum';
    try {
        const months = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            // Ungültiges Datum abfangen
            if (year === '0000' || month < 0 || month > 11 || day < 1 || day > 31) {
                return 'Kein Datum';
            }
            return `${day}. ${months[month]} ${year}`;
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

/**
 * Formatiert ein Datum mit Zeit für die Anzeige
 * @param {string} dateStr - ISO-Datumsstring
 * @returns {string} Formatierter String (z.B. "26. Dez. 2025, 14:30")
 */
export function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Jan.', 'Feb.', 'Mär.', 'Apr.', 'Mai', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}. ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Gibt das Emoji für eine Rolle zurück
 * @param {string} role - Rolle (admin, trainer, schueler)
 * @returns {string} Emoji
 */
export function roleEmoji(role) {
    if (role === 'admin') return '🛡️';
    if (role === 'trainer') return '👨‍🏫';
    return '👤';
}

/**
 * Gibt das Label für eine Rolle zurück
 * @param {string} role - Rolle (admin, trainer, schueler)
 * @returns {string} Label
 */
export function roleLabel(role) {
    if (role === 'admin') return 'Admin';
    if (role === 'trainer') return 'Trainer';
    return 'Schüler';
}

/**
 * Gibt den Anzeigenamen eines Users zurück (Name, Username oder ID)
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {number} userId - User-ID
 * @returns {string} Anzeigename
 */
export function displayUserName(ctx, userId) {
    const u = ctx.adminUserList.find(x => x.id === userId);
    return u ? (u.name || u.username || ('#'+userId)) : ('#'+userId);
}

/**
 * Validiert E-Mail-Format
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @returns {boolean} true wenn valide
 */
export function validateEmail(ctx) {
    const email = (ctx.authForm.email || '').trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return re.test(email);
}

/**
 * Validiert Telefonnummer-Format
 * Unterstützt internationale Formate mit +, Leerzeichen, Klammern, Bindestrichen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @returns {boolean} true wenn valide
 */
export function validatePhone(ctx) {
    const phone = (ctx.authForm.phone || '').trim();
    const re = /^\+?[0-9 ()\-]{7,20}$/;
    return re.test(phone);
}

/**
 * Prüft ob eine Kurs-Abmeldung noch möglich ist
 * Abmeldung nur möglich wenn mindestens 1 Tag vor Kursbeginn
 * @param {Object} course - Kurs-Objekt mit date-Property
 * @returns {boolean} true wenn Abmeldung möglich
 */
export function canCancelBooking(course) {
    if (!course || !course.date) return false;
    const courseDate = new Date(course.date);
    courseDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((courseDate - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 1;
}
