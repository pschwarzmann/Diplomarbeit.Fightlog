// src/services/api.service.js
// Zentraler Client für alle Backend-API-Aufrufe

import { loadingService } from './loading.service.js';
import { getApiBaseUrl, logger } from '../config/env.js';

// Environment-basierte Base URL (keine hardcoded URLs)
const BASE_URL = getApiBaseUrl();

const jsonHeaders = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

// Request-Deduplizierung: Verhindert doppelte gleichzeitige Requests
const pendingRequests = new Map();

/**
 * Erstellt einen eindeutigen Request-Key für Deduplizierung
 */
function getRequestKey(path, options) {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${path}:${body}`;
}

// Holt den Auth-Token aus localStorage
function getAuthToken() {
    try {
        return localStorage.getItem('auth_token');
    } catch (e) {
        return null;
    }
}

// Erstellt Header mit Authorization (Bearer Token)
function getAuthHeaders() {
    const token = getAuthToken();
    const headers = { ...jsonHeaders };
    
    // Bearer Token für sichere Authentifizierung
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        // Workaround: X-Authorization Header für Apache-Setups die Authorization filtern
        headers['X-Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

async function request(path, options = {}) {
    // Request-Deduplizierung: Prüfe ob derselbe Request bereits läuft
    const requestKey = getRequestKey(path, options);
    if (pendingRequests.has(requestKey)) {
        logger.debug('Deduplicating request:', requestKey);
        return pendingRequests.get(requestKey);
    }
    
    // Loading-State setzen
    const loadingKey = `api_${path}_${Date.now()}`;
    
    // Promise für Deduplizierung erstellen
    const requestPromise = (async () => {
        try {
            loadingService.setLoading(loadingKey, true);
            
            // Merge Auth-Headers mit bestehenden Headers
            options.headers = { ...getAuthHeaders(), ...(options.headers || {}) };
            
            // Credentials für Cookies/Sessions mitsenden
            options.credentials = options.credentials || 'include';
            // Browser-Cache umgehen für stets aktuelle API-Daten
            options.cache = options.cache || 'no-store';
            
            // Token als Query-Parameter hinzufügen (Fallback für Apache-Setups die Header filtern)
            const token = getAuthToken();
            let finalPath = path;
            if (token && !path.includes('token=')) {
                const separator = path.includes('?') ? '&' : '?';
                finalPath = `${path}${separator}token=${encodeURIComponent(token)}`;
            }
            
            const response = await fetch(`${BASE_URL}${finalPath}`, options);
            
            // 401 Unauthorized für Session-Calls still behandeln (kein Error-Spam)
            if (response.status === 401 && path.includes('session.php')) {
                loadingService.setLoading(loadingKey, false);
                // Prüfe ob Token gesendet wurde - nur dann war Session wirklich abgelaufen
                const tokenWasSent = options.headers && options.headers['Authorization'] && options.headers['Authorization'].startsWith('Bearer ');
                
                // Versuche JSON-Response zu parsen falls vorhanden
                try {
                    const contentType = response.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        const jsonResult = await response.json();
                        // Nur expired: true setzen wenn Token wirklich gesendet wurde
                        if (tokenWasSent) {
                            return { success: false, expired: true, ...jsonResult };
                        } else {
                            // Kein Token gesendet - einfach false zurückgeben, kein expired flag
                            return { success: false, ...jsonResult };
                        }
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
                
                // Nur expired: true wenn Token gesendet wurde
                if (tokenWasSent) {
                    return { success: false, expired: true, error: 'Unauthorized' };
                } else {
                    return { success: false, error: 'Unauthorized' };
                }
            }
            
            // Prüfe Content-Type
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                // Wenn nicht JSON, Text lesen für besseres Error-Handling
                const text = await response.text();
                logger.error('Non-JSON response:', {
                    status: response.status,
                    statusText: response.statusText,
                    contentType: contentType,
                    url: `${BASE_URL}${path}`
                });
                
                // Versuche trotzdem JSON zu parsen (falls Content-Type falsch gesetzt wurde)
                try {
                    const result = JSON.parse(text);
                    loadingService.setLoading(loadingKey, false);
                    return result;
                } catch (e) {
                    loadingService.setLoading(loadingKey, false);
                    throw new Error(`Server returned non-JSON response (${response.status})`);
                }
            }
            
            const result = await response.json();
            loadingService.setLoading(loadingKey, false);
            return result;
        } catch (error) {
            loadingService.setLoading(loadingKey, false);
            throw error;
        } finally {
            // Request aus Pending-Liste entfernen
            pendingRequests.delete(requestKey);
        }
    })();
    
    // Promise für Deduplizierung speichern
    pendingRequests.set(requestKey, requestPromise);
    
    return requestPromise;
}

export const apiService = {
    login(credentials) {
        // Unterstütze sowohl 'identifier' als auch 'username' für Rückwärtskompatibilität
        const loginData = {
            identifier: credentials.identifier || credentials.username,
            password: credentials.password
        };
        return request('/login.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(loginData)
        });
    },

    logout() {
        return request('/logout.php', {
            method: 'POST',
            headers: jsonHeaders
        });
    },
    
    requestPasswordReset(email) {
        return request('/password-reset.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'request', email })
        });
    },
    
    resetPassword(token, newPassword) {
        return request('/password-reset.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'reset', token, newPassword })
        });
    },
    
    getPasswordMinLength() {
        return request('/settings.php?action=publicPasswordMinLength');
    },
    
    getSessionStatus() {
        return request('/session.php');
    },
    
    extendSession() {
        return request('/session.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'extend' })
        });
    },
    
    exportData(type, format = 'csv') {
        const token = localStorage.getItem('auth_token');
        const url = `${BASE_URL}/export.php?type=${encodeURIComponent(type)}&format=${encodeURIComponent(format)}`;
        window.location.href = url + (token ? `&token=${encodeURIComponent(token)}` : '');
    },

    // Eigene Profil-Daten abrufen
    getOwnProfile() {
        return request('/users.php?action=profile');
    },

    register(userData) {
        return request('/register.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(userData)
        });
    },

    getCertificates() {
        return request('/certificates.php');
    },
    
    getCertificateSettings() {
        return request('/settings.php?action=settings');
    },
    
    saveCertificateSettings(settings) {
        return request('/settings.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'saveSettings', settings })
        });
    },
    
    getGeneralSettings() {
        return request('/settings.php?action=generalSettings');
    },
    
    saveGeneralSettings(settings) {
        return request('/settings.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'saveGeneralSettings', settings })
        });
    },
    
    createManualCertificate(data) {
        return request('/certificates.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'create', ...data })
        });
    },
    
    deleteCertificate(id) {
        return request('/certificates.php', {
            method: 'DELETE',
            headers: jsonHeaders,
            body: JSON.stringify({ id })
        });
    },

    addExam(examData) {
        return request('/exams.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(examData)
        });
    },

    updateExam(examData) {
        return request('/exams.php', {
            method: 'PUT',
            headers: jsonHeaders,
            body: JSON.stringify(examData)
        });
    },

    deleteExam(examId) {
        return request('/exams.php', {
            method: 'DELETE',
            headers: jsonHeaders,
            body: JSON.stringify({ id: examId })
        });
    },

    getExams(userId) {
        const suffix = userId ? `?userId=${userId}` : '';
        return request(`/exams.php${suffix}`);
    },

    // ===== ZIELE (NEU) =====
    
    // Ziel-Templates abrufen
    getGoalTemplates() {
        return request('/goals.php?action=templates');
    },
    
    // Kategorien abrufen
    getGoalCategories() {
        return request('/goals.php?action=categories');
    },
    
    // Ziele eines Users abrufen
    getGoals(userId) {
        const suffix = userId ? `?action=userGoals&userId=${userId}` : '?action=userGoals';
        return request(`/goals.php${suffix}`);
    },
    
    // ALLE Ziele aller User abrufen (Admin/Trainer)
    getAllGoals() {
        return request('/goals.php?action=allGoals');
    },
    
    // Fortschritt/Unterziele eines Ziels abrufen
    getGoalProgress(userGoalId) {
        return request(`/goals.php?action=goalProgress&userGoalId=${userGoalId}`);
    },
    
    // Ziel-Template dem User zuweisen
    assignGoal(templateId, userId = null, targetDate = null) {
        const body = { action: 'assignGoal', templateId };
        if (userId) body.userId = userId;
        if (targetDate) body.targetDate = targetDate;
        return request('/goals.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(body)
        });
    },
    
    // Unterziel als erledigt/nicht erledigt markieren
    toggleSubtask(userGoalId, subtaskId, completed) {
        return request('/goals.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'toggleSubtask', userGoalId, subtaskId, completed: completed ? 1 : 0 })
        });
    },
    
    // Ziel abbrechen
    cancelGoal(userGoalId) {
        return request('/goals.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'cancelGoal', userGoalId })
        });
    },
    
    // Ziel wiederaufnehmen
    resumeGoal(userGoalId) {
        return request('/goals.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'resumeGoal', userGoalId })
        });
    },
    
    // Ziel löschen
    deleteGoal(userGoalId) {
        return request('/goals.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'deleteGoal', userGoalId })
        });
    },
    
    // ========== GOAL TEMPLATE CRUD ==========
    
    // Template-Details mit Unterzielen abrufen
    getTemplateDetails(templateId) {
        return request(`/goals.php?action=templateDetails&templateId=${templateId}`);
    },
    
    // Neues Template erstellen
    createGoalTemplate(title, definition, category, subtasks) {
        return request('/goals.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'createTemplate', title, definition, category, subtasks })
        });
    },
    
    // Template aktualisieren
    updateGoalTemplate(templateId, title, definition, category, subtasks) {
        return request('/goals.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'updateTemplate', templateId, title, definition, category, subtasks })
        });
    },
    
    // Template löschen
    deleteGoalTemplate(templateId) {
        return request('/goals.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'deleteTemplate', templateId })
        });
    },

    getUsers() {
        return request('/users.php');
    },

    updateUser(updatedUser) {
        return request('/users.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'update', ...updatedUser })
        });
    },

    deleteUser(userId) {
        return request('/users.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'delete', id: userId })
        });
    },

    createUser(userData) {
        return request('/register.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(userData)
        });
    },

    changeUserPassword(userId, newPassword) {
        return request('/users.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'changePassword', id: userId, newPassword: newPassword })
        });
    },

    getCourses() {
        return request('/courses.php');
    },

    addCourse(courseData) {
        return request('/courses.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'add', ...courseData })
        });
    },

    updateCourse(courseData) {
        return request('/courses.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'update', ...courseData })
        });
    },

    deleteCourse(courseId) {
        return request('/courses.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'delete', id: courseId })
        });
    },

    // Kurs-Buchungen
    bookCourse(courseId) {
        return request('/courses.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'book', courseId })
        });
    },

    cancelCourseBooking(courseId) {
        return request('/courses.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'cancel', courseId })
        });
    },

    getCourseParticipants(courseId) {
        return request(`/courses.php?action=participants&courseId=${courseId}`);
    },

    addCourseParticipant(courseId, userId) {
        return request('/courses.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'addParticipant', courseId, userId })
        });
    },

    removeCourseParticipant(courseId, userId) {
        return request('/courses.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'removeParticipant', courseId, userId })
        });
    },

    // Gruppen
    getGroups() {
        return request('/groups.php');
    },

    addGroup(groupData) {
        return request('/groups.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(groupData)
        });
    },

    updateGroup(groupData) {
        return request('/groups.php', {
            method: 'PUT',
            headers: jsonHeaders,
            body: JSON.stringify(groupData)
        });
    },

    deleteGroup(groupId) {
        return request(`/groups.php?id=${groupId}`, {
            method: 'DELETE'
        });
    },

    getGroupMembers(groupId) {
        return request(`/groups.php?action=members&group_id=${groupId}`);
    },

    // Profil
    updateProfile(profileData) {
        return request('/users.php', {
            method: 'PUT',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'updateProfile', ...profileData })
        });
    },

    changeOwnPassword(currentPassword, newPassword) {
        return request('/users.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'changeOwnPassword', currentPassword, newPassword })
        });
    },
    
    // Passkey APIs
    passkeyRegister() {
        return request('/passkeys.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'register' })
        });
    },
    
    passkeyVerify(credential, challenge, friendlyName) {
        return request('/passkeys.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'verify',
                credential: credential,
                challenge: challenge,
                friendlyName: friendlyName
            })
        });
    },
    
    passkeyAuthenticate(credentialId = null) {
        return request('/passkeys.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'authenticate',
                credentialId: credentialId
            })
        });
    },
    
    passkeyVerifyAuth(credential, challenge) {
        return request('/passkeys.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'verifyAuth',
                credential: credential,
                challenge: challenge
            })
        });
    },
    
    getPasskeys() {
        return request('/passkeys.php', {
            method: 'GET'
        });
    },
    
    deletePasskey(passkeyId) {
        return request('/passkeys.php', {
            method: 'DELETE',
            body: JSON.stringify({ id: passkeyId })
        });
    },

    // ===== GRADE (Gürtelgrade) =====
    
    // Alle Grade abrufen
    getGrades() {
        return request('/grades.php?action=list');
    },
    
    // Grad erstellen (nur Admin)
    createGrade(name, sortOrder, color) {
        return request('/grades.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'create', name, sort_order: sortOrder, color })
        });
    },
    
    // Grad aktualisieren (nur Admin)
    updateGrade(id, name, sortOrder, color) {
        return request('/grades.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'update', id, name, sort_order: sortOrder, color })
        });
    },
    
    // Grad löschen (nur Admin)
    deleteGrade(id) {
        return request('/grades.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'delete', id })
        });
    }
};

// Legacy-Kompatibilität
window.apiService = apiService;


