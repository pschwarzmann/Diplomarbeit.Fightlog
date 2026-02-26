/**
 * Exam CRUD Operations Module
 * Enthält alle Funktionen für Prüfungsverwaltung
 */

import { apiService } from '../services/api.service.js';
import * as forms from './forms.js';
import * as actions from './actions.js';
import * as utils from './utils.js';

/**
 * Prüfung hinzufügen
 */
export async function addExam(ctx) {
    try {
        // Prüfe ob Datum in der Zukunft liegt (Datum kann im deutschen Format DD.MM.YYYY vorliegen)
        if (ctx.examForm.date && !forms.validateExamDate(ctx.examForm.date)) {
            window.notify.alert('Das Prüfungsdatum darf nicht in der Zukunft liegen.');
            return;
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
            await actions.loadExams(ctx);
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Add exam error:', error);
        }
        window.notify.alert('Prüfungseintrag fehlgeschlagen');
    }
}

/**
 * Prüfung bearbeiten - Modal öffnen
 */
export function editExam(ctx, exam) {
    ctx.examEditForm = {
        id: exam.id,
        date: utils.toGermanDate(exam.date),
        level: exam.level,
        category: exam.category,
        instructor: exam.instructor,
        comments: exam.comments || '',
        status: exam.status || 'passed',
        userId: exam.userId || exam.user_id,
        studentName: exam.studentName || '',
        studentQuery: ''
    };
    ctx.showExamEditModal = true;
}

/**
 * Exam Edit Modal schließen
 */
export function closeExamEditModal(ctx) {
    ctx.showExamEditModal = false;
}

/**
 * Schüler für Exam Edit auswählen
 */
export function selectStudentForExamEdit(ctx, user) {
    ctx.examEditForm.userId = user.id;
    ctx.examEditForm.studentName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    ctx.examEditForm.studentQuery = '';
}

/**
 * Exam Edit speichern
 */
export async function saveExamEdit(ctx) {
    try {
        // Konvertiere deutsches Datum zu ISO
        const isoDate = utils.toISODate(ctx.examEditForm.date);
        
        // Prüfe ob Datum in der Zukunft liegt
        if (isoDate && !forms.validateExamDate(isoDate)) {
            window.notify.alert('Das Prüfungsdatum darf nicht in der Zukunft liegen.');
            return;
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
            await actions.loadExams(ctx);
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
 * Prüfung löschen
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
