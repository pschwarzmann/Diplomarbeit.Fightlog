// src/services/api.service.js
// Zentraler Client für alle Backend-API-Aufrufe

const BASE_URL = '/fightlog/backend/api';

const jsonHeaders = { 'Content-Type': 'application/json' };

async function request(path, options = {}) {
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
    }
};

// Legacy-Kompatibilität
window.apiService = apiService;


