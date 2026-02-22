/**
 * Filter- und Suchfunktionen für FightLog
 * Enthält Funktionen zum Filtern und Suchen von Daten
 */

/**
 * Sucht nach Schülern die zum Query-String passen
 * Unterstützt Suche nach Vorname, Nachname, Vollname oder kompakter Form
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} query - Suchbegriff
 * @returns {Array} Gefilterte Schüler (max. 50)
 */
export function studentMatches(ctx, query) {
    const qRaw = (query || '').toLowerCase();
    const q = qRaw.trim();
    const students = ctx.adminUserList.filter(u => (u.role === 'schueler'));
    if (!q) return [];
    return students.filter(u => {
        const first = (u.firstName || (u.name || '').split(' ')[0] || '').toLowerCase();
        const last = (u.lastName || (u.name || '').split(' ')[1] || '').toLowerCase();
        const full = (u.name || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase();
        const compact = (first + last).replace(/\s+/g, '');
        const qCompact = q.replace(/\s+/g, '');
        return first.startsWith(q) || last.startsWith(q) || full.startsWith(q) || compact.startsWith(qCompact);
    }).slice(0, 50);
}

/**
 * Sucht nach Gruppen die zum Query-String passen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} query - Suchbegriff
 * @returns {Array} Gefilterte Gruppen (max. 20)
 */
export function groupMatches(ctx, query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];
    return ctx.studentGroups.filter(g => (g.name || '').toLowerCase().includes(q)).slice(0, 20);
}
