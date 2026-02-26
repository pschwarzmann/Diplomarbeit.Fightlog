/**
 * Admin CRUD Operations Module
 * Enthält alle Funktionen für Admin-Verwaltung (User, Gruppen, Grades, Goal Templates, Certificate Presets)
 */

import { apiService } from '../services/api.service.js';
import * as forms from './forms.js';
import * as actions from './actions.js';
import { invalidateCache } from './actions.js';

// ========== USER MANAGEMENT ==========

/**
 * User Card toggle
 */
export function toggleUserCard(ctx, user) {
    // Toggle nur diesen spezifischen User
    // Stelle sicher, dass _open initialisiert ist
    if (user._open === undefined) {
        user._open = false;
    }
    user._open = !user._open;
}

/**
 * Permission toggle
 */
export function togglePermission(ctx, user, permKey) {
    const has = user.permissions.includes(permKey);
    if (has) {
        user.permissions = user.permissions.filter(p => p !== permKey);
    } else {
        user.permissions = [...user.permissions, permKey];
    }
}

/**
 * User Edit starten
 */
export function startEditUser(ctx, user) {
    // Erstelle Kopie der aktuellen Daten für Edit-Form
    user._editForm = {
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        school: user.school || '',
        beltLevel: user.beltLevel || '',
        role: user.role || 'schueler',
        verifiedTrainer: user.verifiedTrainer || false,
        newPassword: ''
    };
    user._isEditing = true;
    user._validationErrors = {};
}

/**
 * User Edit abbrechen
 */
export function cancelEditUser(ctx, user) {
    user._isEditing = false;
    user._editForm = null;
    user._validationErrors = {};
}

/**
 * User speichern
 */
export async function saveUser(ctx, user) {
    if (!user._isEditing) {
        return;
    }
    
    // Validierung
    if (!forms.validateUserForm(ctx, user)) {
        await window.notify.alert('Bitte korrigieren Sie die Fehler in den Feldern.');
        return;
    }
    
    user._isSaving = true;
    
    try {
        const form = user._editForm;
        const updateData = {
            id: user.id,
            email: form.email.trim(),
            firstName: form.firstName.trim() || null,
            lastName: form.lastName.trim() || null,
            phone: form.phone.trim() || null,
            school: form.school.trim() || null,
            beltLevel: form.beltLevel.trim() || null,
            role: form.role,
            verifiedTrainer: form.verifiedTrainer
        };
        
        // Name zusammensetzen
        const name = [form.firstName, form.lastName].filter(Boolean).join(' ').trim() || null;
        updateData.name = name;
        
        // Update User-Daten
        const res = await apiService.updateUser(updateData);
        
        if (!res.success) {
            throw new Error(res.error || 'Speichern fehlgeschlagen');
        }
        
        // Passwort ändern, falls angegeben
        if (form.newPassword && form.newPassword.trim() !== '') {
            const passwordRes = await apiService.changeUserPassword(user.id, form.newPassword.trim());
            if (!passwordRes.success) {
                throw new Error(passwordRes.error || 'Passwort konnte nicht geändert werden');
            }
        }
        
        // UI aktualisieren mit neuen Daten
        Object.assign(user, {
            email: updateData.email,
            firstName: updateData.firstName,
            lastName: updateData.lastName,
            phone: updateData.phone,
            school: updateData.school,
            beltLevel: updateData.beltLevel,
            role: updateData.role,
            verifiedTrainer: updateData.verifiedTrainer,
            name: updateData.name
        });
        
        // Edit-Mode beenden
        user._isEditing = false;
        user._editForm = null;
        user._validationErrors = {};
        
        await window.notify.alert('Benutzer erfolgreich gespeichert.');
        
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Save user error:', e);
        }
        await window.notify.alert('Fehler beim Speichern: ' + (e.message || 'Unbekannter Fehler'));
    } finally {
        user._isSaving = false;
    }
}

/**
 * Create User Modal schließen
 */
export function closeCreateUserModal(ctx) {
    ctx.showCreateUserModal = false;
    // Formular zurücksetzen
    ctx.createUserForm = {
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'schueler',
        school: '',
        beltLevel: '',
        verifiedTrainer: false,
        _validationErrors: {},
        _isSaving: false
    };
}

/**
 * User erstellen
 */
export async function createUser(ctx) {
    // Client-Validierung
    if (!forms.validateCreateUserForm(ctx)) {
        await window.notify.alert('Bitte korrigieren Sie die Fehler in den Feldern.');
        return;
    }
    
    ctx.createUserForm._isSaving = true;
    
    try {
        const form = ctx.createUserForm;
        
        // Name zusammensetzen
        const name = [form.firstName, form.lastName].filter(Boolean).join(' ').trim() || null;
        
        // Daten für API vorbereiten
        const userData = {
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
            firstName: form.firstName.trim() || null,
            lastName: form.lastName.trim() || null,
            name: name,
            phone: form.phone.trim() || null,
            role: form.role,
            school: form.school.trim() || null,
            beltLevel: form.beltLevel.trim() || null,
            verifiedTrainer: form.verifiedTrainer || false
        };
        
        // API-Call
        const res = await apiService.createUser(userData);
        
        if (!res.success) {
            // Server-Validierung: Prüfe auf spezifische Fehler
            if (res.error && res.error.toLowerCase().includes('bereits vorhanden')) {
                if (res.error.toLowerCase().includes('benutzername')) {
                    ctx.createUserForm._validationErrors = { username: 'Dieser Benutzername ist bereits vergeben' };
                } else if (res.error.toLowerCase().includes('e-mail') || res.error.toLowerCase().includes('email')) {
                    ctx.createUserForm._validationErrors = { email: 'Diese E-Mail-Adresse ist bereits vergeben' };
                } else {
                    ctx.createUserForm._validationErrors = { username: res.error };
                }
                await window.notify.alert('Bitte korrigieren Sie die Fehler in den Feldern.');
                return;
            }
            throw new Error(res.error || 'Benutzer konnte nicht erstellt werden');
        }
        
        // Erfolg: Modal schließen und Liste neu laden
        closeCreateUserModal(ctx);
        
        // Benutzerliste neu laden, damit neue Kartei sofort erscheint
        await actions.loadUsers(ctx);
        
        await window.notify.alert('Benutzer erfolgreich erstellt.');
        
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Create user error:', e);
        }
        await window.notify.alert('Fehler beim Erstellen des Benutzers: ' + (e.message || 'Unbekannter Fehler'));
    } finally {
        ctx.createUserForm._isSaving = false;
    }
}

/**
 * Passkey hinzufügen
 */
export function addPasskey(ctx, user) {
    const key = (user._newPasskey || '').trim();
    if (!key) return;
    const current = Array.isArray(user.passkeys) ? user.passkeys : [];
    if (current.includes(key)) return window.notify.alert('Passkey existiert bereits.');
    user.passkeys = [...current, key];
    user._newPasskey = '';
}

/**
 * Passkey entfernen
 */
export function removePasskey(ctx, user, key) {
    const current = Array.isArray(user.passkeys) ? user.passkeys : [];
    user.passkeys = current.filter(k => k !== key);
}

/**
 * User löschen
 */
export async function deleteUser(ctx, user) {
    const ok = await window.notify.confirm('Benutzer wirklich löschen?');
    if (!ok) return;
    try {
        const res = await apiService.deleteUser(user.id);
        if (res.success) {
            ctx.adminUserList = ctx.adminUserList.filter(u => u.id !== user.id);
            await window.notify.alert('Benutzer erfolgreich gelöscht.');
        } else {
            await window.notify.alert('Fehler beim Löschen: ' + (res.error || 'Unbekannter Fehler'));
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Delete user error:', e);
        }
        await window.notify.alert('Fehler beim Löschen des Benutzers');
    }
}

/**
 * User Passwort ändern
 */
export async function changeUserPassword(ctx, user) {
    const minLength = ctx.generalSettings?.password_min_length || 8;
    if (!user._newPassword || user._newPassword.length < minLength) {
        window.notify.alert(`Passwort muss mindestens ${minLength} Zeichen lang sein`);
        return;
    }
    
    try {
        const res = await apiService.changeUserPassword(user.id, user._newPassword);
        if (res.success) {
            // Erfolgs-Feedback
            user._passwordChanged = true;
            user._newPassword = ''; // Feld leeren
            
            // Nach 3 Sekunden Erfolgsmeldung ausblenden
            setTimeout(() => {
                user._passwordChanged = false;
            }, 3000);
        } else {
            window.notify.alert('Fehler: ' + (res.error || 'Passwort konnte nicht geändert werden'));
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Change password error:', e);
        }
        window.notify.alert('Fehler beim Ändern des Passworts');
    }
}

// ========== PRESETS MANAGEMENT ==========

/**
 * Certificate Presets laden
 */
export function loadPresets(ctx) {
    try {
        const cp = JSON.parse(localStorage.getItem('fightlog_certificatePresets') || '[]');
        ctx.certificatePresets = Array.isArray(cp) ? cp : [];

        // Seed mit realistischen Dummy-Daten, falls leer
        if (!ctx.certificatePresets.length) {
            ctx.certificatePresets = [
                { id: Date.now() - 1003, title: 'Gelbgurt Prüfung – Standard', type: 'belt_exam', level: 'Gelbgurt', instructor: 'Hans Schmidt' },
                { id: Date.now() - 1002, title: 'Turnier – Berlin Open', type: 'tournament', level: 'Regional', instructor: 'Max Müller' },
                { id: Date.now() - 1001, title: 'Workshop – Selbstverteidigung', type: 'workshop', level: '', instructor: 'Anna Weber' }
            ];
        }
        savePresets(ctx);
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.warn('Presets parse error', e);
        } else {
            console.warn('[FightLog] Presets parse error', e);
        }
        ctx.certificatePresets = [];
    }
}

/**
 * Certificate Presets speichern
 */
export function savePresets(ctx) {
    localStorage.setItem('fightlog_certificatePresets', JSON.stringify(ctx.certificatePresets));
}

/**
 * Certificate Preset hinzufügen
 */
export function addCertificatePreset(ctx) {
    const p = { id: Date.now(), ...ctx.certificatePresetForm };
    ctx.certificatePresets.unshift(p);
    ctx.certificatePresetForm = { title: '', type: '', level: '', instructor: '' };
    savePresets(ctx);
}

/**
 * Certificate Preset bearbeiten
 */
export async function editCertificatePreset(ctx, preset) {
    const title = await window.notify.prompt('Titel', preset.title);
    if (title == null) return;
    const level = await window.notify.prompt('Level', preset.level || '');
    if (level == null) return;
    const instructor = await window.notify.prompt('Trainer/Prüfer', preset.instructor || '');
    if (instructor == null) return;
    const updated = { ...preset, title, level, instructor };
    const idx = ctx.certificatePresets.findIndex(x => x.id === preset.id);
    if (idx !== -1) ctx.certificatePresets[idx] = updated;
    savePresets(ctx);
}

/**
 * Certificate Preset entfernen
 */
export async function removeCertificatePreset(ctx, preset) {
    const ok = await window.notify.confirm('Preset löschen?');
    if (!ok) return;
    ctx.certificatePresets = ctx.certificatePresets.filter(x => x.id !== preset.id);
    savePresets(ctx);
}

// ========== GROUP MANAGEMENT ==========

/**
 * Gruppe hinzufügen
 */
export async function addStudentGroup(ctx) {
    const name = (ctx.groupForm.name || '').trim();
    const description = (ctx.groupForm.description || '').trim();
    const ids = Array.from(new Set(ctx.groupForm.userIds));
    if (!name) return window.notify.alert('Bitte einen Gruppennamen angeben.');
    if (!ids.length) return window.notify.alert('Mindestens einen Schüler auswählen.');
    
    try {
        const response = await apiService.addGroup({
            name: name,
            description: description,
            userIds: ids
        });
        if (response.success) {
            invalidateCache(ctx, 'groups');
            await actions.loadGroups(ctx);
            resetGroupForm(ctx);
        } else {
            window.notify.alert(response.error || 'Fehler beim Erstellen');
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Save group error:', e);
        }
        window.notify.alert('Fehler beim Speichern der Gruppe');
    }
}

/**
 * Group Form zurücksetzen
 */
export function resetGroupForm(ctx) {
    ctx.groupForm = { name: '', description: '', userIds: [], query: '' };
}

/**
 * Schüler zur Gruppe hinzufügen (beim Erstellen)
 */
export function tapSelectGroupStudent(ctx, user) {
    // Schüler zur Gruppe hinzufügen (wenn noch nicht vorhanden)
    if (!ctx.groupForm.userIds.includes(user.id)) {
        ctx.groupForm.userIds = [...ctx.groupForm.userIds, user.id];
    }
    ctx.groupForm.query = '';
}

/**
 * Schüler von Gruppe entfernen (beim Erstellen)
 */
export function removeGroupStudent(ctx, userId) {
    ctx.groupForm.userIds = ctx.groupForm.userIds.filter(id => id !== userId);
}

/**
 * Gruppenmitglieder anzeigen
 */
export function showGroupMembers(ctx, grp) {
    // Toggle die Mitglieder-Anzeige
    grp._showMembers = !grp._showMembers;
}

/**
 * Namen der Gruppenmitglieder abrufen
 */
export function getGroupMemberNames(ctx, grp) {
    return (grp.userIds || []).map(id => {
        const user = ctx.adminUserList.find(u => u.id === id);
        return user ? (user.name || user.username) : `ID: ${id}`;
    });
}

/**
 * Gruppe bearbeiten - Modal öffnen
 */
export function editGroup(ctx, grp) {
    // Lade Gruppe ins Modal
    ctx.groupEditForm = {
        id: grp.id,
        name: grp.name || '',
        description: grp.description || '',
        members: (grp.userIds || []).map(uid => {
            const user = ctx.adminUserList.find(u => u.id === uid);
            return user ? { id: user.id, name: user.name, username: user.username } : { id: uid, name: 'Unbekannt', username: '?' };
        }),
        memberQuery: '',
        showAddMember: false
    };
    ctx.showGroupEditModal = true;
}

/**
 * Group Edit Modal schließen
 */
export function closeGroupEditModal(ctx) {
    ctx.showGroupEditModal = false;
    ctx.groupEditForm = {
        id: null,
        name: '',
        description: '',
        members: [],
        memberQuery: '',
        showAddMember: false
    };
}

/**
 * Mitglied zu Group Edit hinzufügen
 */
export function addMemberToGroupEdit(ctx, user) {
    if (ctx.groupEditForm.members.some(m => m.id === user.id)) {
        return; // Bereits in Liste
    }
    ctx.groupEditForm.members.push({ id: user.id, name: user.name, username: user.username });
    ctx.groupEditForm.memberQuery = '';
    ctx.groupEditForm.showAddMember = false;
}

/**
 * Mitglied von Group Edit entfernen
 */
export function removeMemberFromGroupEdit(ctx, userId) {
    ctx.groupEditForm.members = ctx.groupEditForm.members.filter(m => m.id !== userId);
}

/**
 * Gruppe Edit speichern
 */
export async function saveGroupEdit(ctx) {
    const name = (ctx.groupEditForm.name || '').trim();
    if (!name) {
        window.notify.alert('Bitte einen Gruppennamen angeben.');
        return;
    }
    
    const userIds = ctx.groupEditForm.members.map(m => m.id);
    
    try {
        const response = await apiService.updateGroup({
            id: ctx.groupEditForm.id,
            name: name,
            description: (ctx.groupEditForm.description || '').trim(),
            userIds: userIds
        });
        if (response.success) {
            invalidateCache(ctx, 'groups');
            await actions.loadGroups(ctx);
            closeGroupEditModal(ctx);
        } else {
            window.notify.alert(response.error || 'Fehler beim Speichern');
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Save group error:', e);
        }
        window.notify.alert('Fehler beim Speichern der Gruppe');
    }
}

/**
 * Gruppe löschen
 */
export async function removeGroup(ctx, grp) {
    const ok = await window.notify.confirm('Gruppe löschen?');
    if (!ok) return;
    
    try {
        const response = await apiService.deleteGroup(grp.id);
        if (response.success) {
            invalidateCache(ctx, 'groups');
            await actions.loadGroups(ctx);
        } else {
            window.notify.alert(response.error || 'Fehler beim Löschen');
        }
    } catch (e) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Delete group error:', e);
        }
        window.notify.alert('Fehler beim Löschen der Gruppe');
    }
}

// ========== GRADE MANAGEMENT ==========

/**
 * Grade Form zurücksetzen
 */
export function resetGradeForm(ctx) {
    ctx.gradeForm = {
        id: null,
        name: '',
        sort_order: ctx.grades.length + 1,
        color: '#FFEB3B'
    };
}

/**
 * Grad bearbeiten
 */
export function editGrade(ctx, grade) {
    ctx.gradeForm = {
        id: grade.id,
        name: grade.name,
        sort_order: grade.sort_order,
        color: grade.color || '#FFEB3B'
    };
}

/**
 * Grad speichern
 */
export async function saveGrade(ctx) {
    const { id, name, sort_order, color } = ctx.gradeForm;
    
    try {
        let res;
        if (id) {
            res = await apiService.updateGrade(id, name, sort_order, color);
        } else {
            res = await apiService.createGrade(name, sort_order, color);
        }
        
        if (res.success) {
            resetGradeForm(ctx);
            invalidateCache(ctx, 'grades');
            await actions.loadGrades(ctx);
            window.notify.alert(id ? 'Grad aktualisiert' : 'Grad erstellt');
        } else {
            window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Save grade error:', error);
        }
        window.notify.alert('Fehler beim Speichern des Grads');
    }
}

/**
 * Grad löschen
 */
export async function deleteGrade(ctx, grade) {
    const ok = await window.notify.confirm('Diesen Grad wirklich löschen?');
    if (!ok) return;
    
    try {
        const res = await apiService.deleteGrade(grade.id);
        if (res.success) {
            invalidateCache(ctx, 'grades');
            await actions.loadGrades(ctx);
            window.notify.alert('Grad gelöscht');
        } else {
            window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Delete grade error:', error);
        }
        window.notify.alert('Fehler beim Löschen des Grads');
    }
}

// ========== GOAL TEMPLATE MANAGEMENT ==========

/**
 * Goal Template Form zurücksetzen
 */
export function resetGoalTemplateForm(ctx) {
    ctx.goalTemplateForm = {
        id: null,
        title: '',
        definition: '',
        category: '',
        subtasks: []
    };
}

/**
 * Goal Subtask hinzufügen
 */
export function addGoalSubtask(ctx) {
    ctx.goalTemplateForm.subtasks.push('');
}

/**
 * Goal Subtask entfernen
 */
export function removeGoalSubtask(ctx, index) {
    ctx.goalTemplateForm.subtasks.splice(index, 1);
}

/**
 * Goal Template speichern
 */
export async function saveGoalTemplate(ctx) {
    const { id, title, definition, category, subtasks } = ctx.goalTemplateForm;
    
    // Leere Unterziele herausfiltern
    const validSubtasks = subtasks.filter(s => s && s.trim());
    
    try {
        let res;
        if (id) {
            // Aktualisieren
            res = await apiService.updateGoalTemplate(id, title, definition, category, validSubtasks);
        } else {
            // Neu erstellen
            res = await apiService.createGoalTemplate(title, definition, category, validSubtasks);
        }
        
        if (res.success) {
            resetGoalTemplateForm(ctx);
            await actions.loadGoalTemplates(ctx);
            window.notify.alert(id ? 'Ziel-Vorlage aktualisiert!' : 'Ziel-Vorlage erstellt!');
        } else {
            window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Save goal template error:', error);
        }
        window.notify.alert('Fehler beim Speichern');
    }
}

/**
 * Goal Template bearbeiten
 */
export async function editGoalTemplate(ctx, template) {
    try {
        // Details mit Unterzielen laden
        const res = await apiService.getTemplateDetails(template.id);
        if (res.success && res.template) {
            ctx.goalTemplateForm = {
                id: res.template.id,
                title: res.template.title,
                definition: res.template.definition || '',
                category: res.template.category || '',
                subtasks: (res.template.subtasks || []).map(s => s.definition)
            };
            // Scroll zum Formular
            try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}
        } else {
            window.notify.alert('Fehler beim Laden der Vorlage');
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Edit goal template error:', error);
        }
        window.notify.alert('Fehler beim Laden');
    }
}

/**
 * Goal Template löschen
 */
export async function deleteGoalTemplate(ctx, template) {
    const ok = await window.notify.confirm(`Ziel-Vorlage "${template.title}" wirklich löschen?\n\nHinweis: Vorlagen können nur gelöscht werden, wenn sie nicht mehr von Schülern verwendet werden.`);
    if (!ok) return;
    
    try {
        const res = await apiService.deleteGoalTemplate(template.id);
        if (res.success) {
            window.notify.alert('Ziel-Vorlage gelöscht!');
            await actions.loadGoalTemplates(ctx);
        } else {
            // Bessere Fehlermeldung für "wird noch verwendet"
            if (res.error && res.error.includes('verwendet')) {
                window.notify.alert('Diese Vorlage kann nicht gelöscht werden, da sie noch von Schülern verwendet wird. Bitte beenden Sie zuerst alle zugewiesenen Ziele.');
            } else {
                window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
            }
        }
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Delete goal template error:', error);
        }
        window.notify.alert('Fehler beim Löschen');
    }
}
