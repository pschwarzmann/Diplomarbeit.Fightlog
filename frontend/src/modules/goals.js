/**
 * Goal CRUD Operations Module
 * Enthält alle Funktionen für Zielverwaltung
 */

import { apiService } from '../services/api.service.js';
import * as actions from './actions.js';

/**
 * Ziel sich selbst zuweisen
 */
export async function assignGoalToSelf(ctx) {
    if (!ctx.selectedTemplateId || !ctx.currentUser) return;
    
    try {
        // Datum von DD.MM.YYYY zu YYYY-MM-DD konvertieren (falls vom Datepicker)
        let targetDate = null;
        if (ctx.goalTargetDate) {
            const match = ctx.goalTargetDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
            if (match) {
                // Deutsches Format DD.MM.YYYY -> ISO Format YYYY-MM-DD
                targetDate = `${match[3]}-${match[2]}-${match[1]}`;
            } else {
                // Falls bereits ISO Format oder anderes
                targetDate = ctx.goalTargetDate;
            }
        }
        const res = await apiService.assignGoal(ctx.selectedTemplateId, ctx.currentUser.id, targetDate);
        if (res.success) {
            ctx.selectedTemplateId = null;
            ctx.goalTargetDate = '';
            await actions.loadGoals(ctx);
            window.notify.alert('Ziel erfolgreich gestartet!');
        } else {
            window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Assign goal error:', error);
        }
        window.notify.alert('Fehler beim Starten des Ziels');
    }
}

/**
 * Ziel-Details Modal öffnen
 */
export async function openGoalDetails(ctx, goal) {
    ctx.goalDetailsData = goal;
    try {
        const res = await apiService.getGoalProgress(goal.id);
        ctx.goalSubtasks = res.subtasks || [];
        ctx.showGoalDetailsModal = true;
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Load goal progress error:', error);
        }
        window.notify.alert('Fehler beim Laden der Unterziele');
    }
}

/**
 * Unterziel toggle (erledigt/nicht erledigt)
 */
export async function toggleSubtask(ctx, subtask) {
    if (!ctx.goalDetailsData) return;
    
    try {
        const newCompleted = !subtask.completed;
        const res = await apiService.toggleSubtask(ctx.goalDetailsData.id, subtask.subtask_id, newCompleted);
        
        if (res.success) {
            // Lokal aktualisieren
            subtask.completed = newCompleted;
            
            // Prüfen ob Ziel jetzt abgeschlossen ist
            if (res.goalCompleted) {
                window.notify.alert('Glückwunsch! Ziel erreicht! 🎉');
                ctx.showGoalDetailsModal = false;
            }
            
            // Ziele-Liste neu laden
            await actions.loadGoals(ctx);
        } else {
            window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Toggle subtask error:', error);
        }
        window.notify.alert('Fehler beim Aktualisieren');
    }
}

/**
 * Ziel abbrechen
 */
export async function cancelGoal(ctx, goal) {
    const ok = await window.notify.confirm('Dieses Ziel wirklich abbrechen?');
    if (!ok) return;
    
    try {
        const res = await apiService.cancelGoal(goal.id);
        if (res.success) {
            await actions.loadGoals(ctx);
            window.notify.alert('Ziel abgebrochen');
        } else {
            window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Cancel goal error:', error);
        }
        window.notify.alert('Fehler beim Abbrechen des Ziels');
    }
}

/**
 * Ziel wiederaufnehmen
 */
export async function resumeGoal(ctx, goal) {
    const ok = await window.notify.confirm('Dieses Ziel wirklich wiederaufnehmen?');
    if (!ok) return;
    
    try {
        const res = await apiService.resumeGoal(goal.id);
        if (res.success) {
            await actions.loadGoals(ctx);
            window.notify.alert('Ziel wiederaufgenommen');
        } else {
            window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Resume goal error:', error);
        }
        window.notify.alert('Fehler beim Wiederaufnehmen des Ziels');
    }
}

/**
 * Ziel löschen
 */
export async function deleteGoal(ctx, goal) {
    const ok = await window.notify.confirm('Dieses Ziel wirklich löschen? Dies kann nicht rückgängig gemacht werden.');
    if (!ok) return;
    
    try {
        const res = await apiService.deleteGoal(goal.id);
        if (res.success) {
            ctx.goals = ctx.goals.filter(g => g.id !== goal.id);
            window.notify.alert('Ziel gelöscht');
        } else {
            window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Delete goal error:', error);
        }
        window.notify.alert('Fehler beim Löschen des Ziels');
    }
}
