/**
 * Course CRUD Operations Module
 * Enthält alle Funktionen für Kursverwaltung
 */

import { apiService } from '../services/api.service.js';
import * as actions from './actions.js';
import * as utils from './utils.js';

/**
 * Kurs erstellen
 */
export async function submitCourse(ctx) {
    try {
        // Datum zu ISO-Format konvertieren
        const isoDate = utils.toISODate(ctx.courseForm.date);
        
        // Schüler sind jetzt optional
        const courseData = {
            title: ctx.courseForm.title,
            date: isoDate,
            instructor: ctx.courseForm.instructor,
            duration: ctx.courseForm.duration,
            max_participants: ctx.courseForm.max_participants,
            price: ctx.courseForm.price,
            description: ctx.courseForm.description,
            userIds: ctx.courseForm.userIds || []
        };
        
        const res = await apiService.addCourse(courseData);
        if (res.success) {
            window.notify.alert('Kurs erstellt.');
            ctx.courseForm = { 
                title: '', date: '', instructor: '', duration: '', 
                max_participants: 20, price: '', description: '', 
                status: 'approved', userId: null, userIds: [], 
                studentQuery: '', selectedStudents: [] 
            };
            await actions.loadCourses(ctx);
        } else {
            window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Add course error:', e);
        }
        window.notify.alert('Kurs konnte nicht erstellt werden.');
    }
}

/**
 * Kurs bearbeiten - Modal öffnen
 */
export function editCourse(ctx, course) {
    // Modal öffnen mit Kursdaten
    // Ungültige Daten (0000-00-00) als leer behandeln, sonst ins deutsche Format konvertieren
    let courseDate = course.date || '';
    if (courseDate === '0000-00-00') {
        courseDate = '';
    } else if (courseDate) {
        courseDate = utils.toGermanDate(courseDate);
    }
    
    ctx.courseEditForm = {
        id: course.id,
        title: course.title || '',
        date: courseDate,
        instructor: course.instructor || '',
        duration: course.duration || '',
        max_participants: course.max_participants || 20,
        price: course.price || '',
        description: course.description || ''
    };
    ctx.showCourseEditModal = true;
}

/**
 * Kurs Edit speichern
 */
export async function saveCourseEdit(ctx) {
    try {
        // Konvertiere deutsches Datum zu ISO
        const updateData = {
            ...ctx.courseEditForm,
            date: utils.toISODate(ctx.courseEditForm.date)
        };
        
        const res = await apiService.updateCourse(updateData);
        if (res.success) {
            ctx.showCourseEditModal = false;
            await actions.loadCourses(ctx);
        } else {
            window.notify.alert('Fehler beim Speichern: ' + (res.error || 'Unbekannt'));
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Update course error:', e);
        }
        window.notify.alert('Kurs konnte nicht aktualisiert werden.');
    }
}

/**
 * Kurs löschen
 */
export async function removeCourse(ctx, course) {
    const ok = await window.notify.confirm('Diesen Kurs wirklich löschen?');
    if (!ok) return;
    const res = await apiService.deleteCourse(course.id);
    if (res.success) {
        ctx.courses = ctx.courses.filter(c => c.id !== course.id);
    }
}

/**
 * Teilnehmer anzeigen (Admin/Trainer)
 */
export async function showParticipants(ctx, course) {
    ctx.participantsModalCourse = course;
    ctx.participantsList = [];
    ctx.participantsAddMode = false;
    ctx.participantsSearchQuery = '';
    ctx.showParticipantsModal = true;
    try {
        const participants = await apiService.getCourseParticipants(course.id);
        ctx.participantsList = Array.isArray(participants) ? participants : [];
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Load participants error:', e);
        }
    }
}

/**
 * Participants Modal schließen
 */
export function closeParticipantsModal(ctx) {
    ctx.showParticipantsModal = false;
    ctx.participantsModalCourse = null;
    ctx.participantsList = [];
    ctx.participantsAddMode = false;
    ctx.participantsSearchQuery = '';
}

/**
 * Teilnehmer zu Kurs hinzufügen
 */
export async function addParticipantToCourse(ctx, user) {
    if (!ctx.participantsModalCourse) return;
    try {
        const res = await apiService.addCourseParticipant(ctx.participantsModalCourse.id, user.id);
        if (res.success) {
            // Teilnehmerliste neu laden
            const participants = await apiService.getCourseParticipants(ctx.participantsModalCourse.id);
            ctx.participantsList = Array.isArray(participants) ? participants : [];
            ctx.participantsAddMode = false;
            ctx.participantsSearchQuery = '';
            // Kursliste aktualisieren für korrekte Teilnehmerzahl
            await actions.loadCourses(ctx);
        } else {
            window.notify.alert(res.error || 'Fehler beim Hinzufügen');
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Add participant error:', e);
        }
        window.notify.alert('Fehler beim Hinzufügen des Teilnehmers');
    }
}

/**
 * Fügt alle Mitglieder einer Gruppe zu einem Kurs hinzu
 * Verhindert Duplikate und zeigt Feedback über Erfolg/Fehler
 */
export async function addGroupToCourse(ctx, group) {
    if (!ctx.participantsModalCourse) return;
    if (!group.memberIds || group.memberIds.length === 0) {
        window.notify.alert('Diese Gruppe hat keine Mitglieder');
        return;
    }
    
    // Bereits vorhandene Teilnehmer IDs sammeln
    const currentIds = ctx.participantsList.map(p => p.user_id);
    // Nur neue Mitglieder hinzufügen
    const newMemberIds = group.memberIds.filter(id => !currentIds.includes(id));
    
    if (newMemberIds.length === 0) {
        window.notify.alert('Alle Mitglieder dieser Gruppe sind bereits im Kurs');
        return;
    }
    
    let added = 0;
    let failed = 0;
    
    // Füge jeden Mitglied einzeln hinzu (für detailliertes Feedback)
    for (const userId of newMemberIds) {
        try {
            const res = await apiService.addCourseParticipant(ctx.participantsModalCourse.id, userId);
            if (res.success) {
                added++;
            } else {
                failed++;
            }
        } catch (e) {
            failed++;
        }
    }
    
    // Teilnehmerliste neu laden
    const participants = await apiService.getCourseParticipants(ctx.participantsModalCourse.id);
    ctx.participantsList = Array.isArray(participants) ? participants : [];
    ctx.participantsAddMode = false;
    ctx.participantsSearchQuery = '';
    // Kursliste aktualisieren für korrekte Teilnehmerzahl
    await actions.loadCourses(ctx);
    
    if (failed > 0) {
        window.notify.alert(`${added} Mitglieder hinzugefügt, ${failed} fehlgeschlagen (evtl. bereits angemeldet oder Kurs voll)`);
    } else {
        await window.notify.alert(`${added} Mitglieder aus "${group.name}" hinzugefügt`);
    }
}

/**
 * Teilnehmer von Kurs entfernen
 */
export async function removeParticipantFromCourse(ctx, userId) {
    if (!ctx.participantsModalCourse) return;
    const ok = await window.notify.confirm('Teilnehmer wirklich entfernen?');
    if (!ok) return;
    try {
        const res = await apiService.removeCourseParticipant(ctx.participantsModalCourse.id, userId);
        if (res.success) {
            // Teilnehmer aus Liste entfernen
            ctx.participantsList = ctx.participantsList.filter(p => p.user_id !== userId);
            // Kursliste aktualisieren für korrekte Teilnehmerzahl
            await actions.loadCourses(ctx);
        } else {
            window.notify.alert(res.error || 'Fehler beim Entfernen');
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Remove participant error:', e);
        }
        window.notify.alert('Fehler beim Entfernen des Teilnehmers');
    }
}

/**
 * Schüler: Für Kurs anmelden
 */
export async function bookCourse(ctx, course) {
    try {
        const res = await apiService.bookCourse(course.id);
        if (res.success) {
            window.notify.alert('Erfolgreich angemeldet!');
            await actions.loadCourses(ctx);
        } else {
            window.notify.alert('Anmeldung fehlgeschlagen: ' + (res.error || 'Unbekannt'));
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Book course error:', e);
        }
        window.notify.alert('Anmeldung fehlgeschlagen.');
    }
}

/**
 * Schüler: Von Kurs abmelden
 */
export async function cancelBooking(ctx, course) {
    const ok = await window.notify.confirm('Wirklich vom Kurs abmelden?');
    if (!ok) return;
    try {
        const res = await apiService.cancelCourseBooking(course.id);
        if (res.success) {
            window.notify.alert('Erfolgreich abgemeldet.');
            await actions.loadCourses(ctx);
        } else {
            window.notify.alert('Abmeldung fehlgeschlagen: ' + (res.error || 'Unbekannt'));
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Cancel booking error:', e);
        }
        window.notify.alert('Abmeldung fehlgeschlagen.');
    }
}
