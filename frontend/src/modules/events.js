/**
 * Event-Handler für FightLog
 * Enthält Funktionen für Benutzerinteraktionen (Toggle, Select, Remove)
 */

import { studentMatches } from './filters.js';

/**
 * Fügt einen Schüler zu einem Formular hinzu (cert/exam/course)
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} target - Zielformular ('cert', 'exam', 'course')
 * @param {Object} user - User-Objekt
 */
export function tapSelectStudent(ctx, target, user) {
    if (target === 'cert') {
        if (!ctx.certificateForm.userIds.includes(user.id)) ctx.certificateForm.userIds.push(user.id);
        ctx.certificateForm.studentQuery = '';
    } else if (target === 'exam') {
        if (!ctx.examForm.userIds.includes(user.id)) ctx.examForm.userIds.push(user.id);
        ctx.examForm.studentQuery = '';
    } else if (target === 'course') {
        if (!ctx.courseForm.userIds.includes(user.id)) ctx.courseForm.userIds.push(user.id);
        ctx.courseForm.studentQuery = '';
    }
}

/**
 * Entfernt einen Schüler aus einem Formular
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} target - Zielformular ('cert', 'exam', 'course')
 * @param {number} userId - User-ID
 */
export function removeSelected(ctx, target, userId) {
    if (target === 'cert') ctx.certificateForm.userIds = ctx.certificateForm.userIds.filter(id => id !== userId);
    if (target === 'exam') ctx.examForm.userIds = ctx.examForm.userIds.filter(id => id !== userId);
    if (target === 'course') ctx.courseForm.userIds = ctx.courseForm.userIds.filter(id => id !== userId);
}

/**
 * Fügt alle Mitglieder einer Gruppe zu einem Formular hinzu
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} target - Zielformular ('cert', 'exam', 'course')
 * @param {Object} group - Gruppen-Objekt mit userIds-Array
 */
export function applyGroupObjectTo(ctx, target, group) {
    const setIds = new Set(target === 'cert' ? ctx.certificateForm.userIds : target === 'exam' ? ctx.examForm.userIds : ctx.courseForm.userIds);
    for (const id of group.userIds) setIds.add(id);
    if (target === 'cert') {
        ctx.certificateForm.userIds = Array.from(setIds);
        ctx.certificateForm.studentQuery = '';
    } else if (target === 'exam') {
        ctx.examForm.userIds = Array.from(setIds);
        ctx.examForm.studentQuery = '';
    } else {
        ctx.courseForm.userIds = Array.from(setIds);
        ctx.courseForm.studentQuery = '';
    }
}

/**
 * Toggle für Urkunden-Schüler
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Object} user - User-Objekt
 */
export function toggleCertStudent(ctx, user) {
    const exists = ctx.certificateForm.userIds.includes(user.id);
    if (exists) {
        ctx.certificateForm.userIds = ctx.certificateForm.userIds.filter(id => id !== user.id);
    } else {
        ctx.certificateForm.userIds = [...ctx.certificateForm.userIds, user.id];
    }
}

/**
 * Toggle für alle Urkunden-Schüler
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Event} evt - Event-Objekt
 */
export function toggleAllCertStudents(ctx, evt) {
    const list = studentMatches(ctx, ctx.certificateForm.studentQuery || ' ');
    if (evt.target.checked) {
        const ids = new Set(ctx.certificateForm.userIds);
        for (const u of list) ids.add(u.id);
        ctx.certificateForm.userIds = Array.from(ids);
    } else {
        const ids = new Set(list.map(u => u.id));
        ctx.certificateForm.userIds = ctx.certificateForm.userIds.filter(id => !ids.has(id));
    }
}

/**
 * Toggle für Prüfungs-Schüler
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Object} user - User-Objekt
 */
export function toggleExamStudent(ctx, user) {
    const exists = ctx.examForm.userIds.includes(user.id);
    ctx.examForm.userIds = exists
        ? ctx.examForm.userIds.filter(id => id !== user.id)
        : [...ctx.examForm.userIds, user.id];
}

/**
 * Toggle für alle Prüfungs-Schüler
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Event} evt - Event-Objekt
 */
export function toggleAllExamStudents(ctx, evt) {
    const list = studentMatches(ctx, ctx.examForm.studentQuery || ' ');
    if (evt.target.checked) {
        const ids = new Set(ctx.examForm.userIds);
        for (const u of list) ids.add(u.id);
        ctx.examForm.userIds = Array.from(ids);
    } else {
        const ids = new Set(list.map(u => u.id));
        ctx.examForm.userIds = ctx.examForm.userIds.filter(id => !ids.has(id));
    }
}

/**
 * Toggle für Kurs-Schüler
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Object} user - User-Objekt
 */
export function toggleCourseStudent(ctx, user) {
    const exists = ctx.courseForm.userIds.includes(user.id);
    ctx.courseForm.userIds = exists
        ? ctx.courseForm.userIds.filter(id => id !== user.id)
        : [...ctx.courseForm.userIds, user.id];
}

/**
 * Toggle für alle Kurs-Schüler
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Event} evt - Event-Objekt
 */
export function toggleAllCourseStudents(ctx, evt) {
    const list = studentMatches(ctx, ctx.courseForm.studentQuery || ' ');
    if (evt.target.checked) {
        const ids = new Set(ctx.courseForm.userIds);
        for (const u of list) ids.add(u.id);
        ctx.courseForm.userIds = Array.from(ids);
    } else {
        const ids = new Set(list.map(u => u.id));
        ctx.courseForm.userIds = ctx.courseForm.userIds.filter(id => !ids.has(id));
    }
}
