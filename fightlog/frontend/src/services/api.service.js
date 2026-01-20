// src/services/api.service.js
// Zentraler Client für alle Backend-API-Aufrufe

// Automatische Erkennung: Dev-Server (localhost:3000) oder XAMPP
const isDev = window.location.port === '3000';
const BASE_URL = isDev ? 'http://localhost:8080/api' : '/fightlog/backend/api';

const jsonHeaders = { 'Content-Type': 'application/json' };

// Holt den aktuellen User aus localStorage
function getCurrentUser() {
    try {
        // Prüfe fightlog_user (session-store)
        const userData = localStorage.getItem('fightlog_user');
        if (userData) {
            return JSON.parse(userData);
        }
    } catch (e) {
        console.warn('Error reading user from localStorage:', e);
    }
    return null;
}

// Erstellt Header mit Authorization (User-ID)
function getAuthHeaders() {
    const user = getCurrentUser();
    const headers = { ...jsonHeaders };
    if (user && user.id) {
        headers['X-User-ID'] = String(user.id);
        headers['X-User-Role'] = user.role || 'schueler';
    }
    return headers;
}

async function request(path, options = {}) {
    // Merge Auth-Headers mit bestehenden Headers
    options.headers = { ...getAuthHeaders(), ...(options.headers || {}) };
    const response = await fetch(`${BASE_URL}${path}`, options);
    return response.json();
}

export const apiService = {
    login(credentials) {
        return request('/login.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(credentials)
        });
    },

    logout() {
        return request('/logout.php', {
            method: 'POST',
            headers: jsonHeaders
        });
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

    uploadCertificate(certificateData) {
        return request('/upload.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(certificateData)
        });
    },

    getCertificates() {
        return request('/certificates.php');
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

    getTrainingHistory() {
        return request('/training.php');
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
    }
};

// Legacy-Kompatibilität
window.apiService = apiService;


