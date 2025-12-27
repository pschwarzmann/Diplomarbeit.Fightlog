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

    getSpecialCourses() {
        return request('/courses.php');
    },

    getGoals(userId) {
        const suffix = userId ? `?userId=${userId}` : '';
        return request(`/goals.php${suffix}`);
    },

    addGoal(goalData) {
        return request('/goals.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(goalData)
        });
    },

    updateGoal(goalData) {
        return request('/goals.php', {
            method: 'PUT',
            headers: jsonHeaders,
            body: JSON.stringify(goalData)
        });
    },

    deleteGoal(goalId) {
        return request('/goals.php', {
            method: 'DELETE',
            headers: jsonHeaders,
            body: JSON.stringify({ id: goalId })
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
    }
};

// Legacy-Kompatibilität
window.apiService = apiService;


