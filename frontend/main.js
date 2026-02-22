// ===== FIGHTLOG - HAUPTANWENDUNG =====
// Diese Datei enthält die komplette Vue.js Anwendung
// 
// Struktur:
// - Template: Vue.js Template mit allen UI-Komponenten
// - Data: Reaktive Daten für die Anwendung
// - Computed: Berechnete Properties (Filter, Suche, etc.)
// - Methods: Methoden für Interaktionen und API-Calls
//   - Einfache Funktionen sind in Modulen ausgelagert (src/modules/)
//   - Komplexe API-Calls bleiben hier für bessere Übersicht
// - Mounted: Initialisierung beim Laden der Anwendung

// ===== INLINE NOTIFY SYSTEM (garantiert frisch geladen) =====
(function() {
    // Stelle sicher dass notify-root existiert
    let root = document.getElementById('notify-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'notify-root';
        root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
        document.body.appendChild(root);
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function createModal(html) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(10px);pointer-events:auto;';
        
        const box = document.createElement('div');
        box.style.cssText = 'width:90%;max-width:420px;background:rgba(255,255,255,0.95);border-radius:20px;box-shadow:0 20px 25px rgba(0,0,0,0.1);overflow:hidden;font-family:inherit;animation:notifySlideIn .24s ease;';
        box.innerHTML = html;
        
        overlay.appendChild(box);
        root.appendChild(overlay);
        return { overlay, box };
    }

    function removeModal(overlay) {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    // Füge Animation hinzu falls nicht vorhanden
    if (!document.getElementById('notify-keyframes')) {
        const style = document.createElement('style');
        style.id = 'notify-keyframes';
        style.textContent = '@keyframes notifySlideIn{from{opacity:0;transform:translateY(6px) scale(0.995);}to{opacity:1;transform:translateY(0) scale(1);}}';
        document.head.appendChild(style);
    }

    // Debug-Log nur in Development
    if (window.location.port === '3000' || window.FIGHTLOG_DEBUG === 'true') {
        console.log('[FightLog] Inline notify system loaded');
    }

    window.notify = {
        alert(message) {
            return new Promise(resolve => {
                const str = String(message);
                const { overlay, box } = createModal(`
                    <div style="padding:24px 24px 0;">
                        <div style="color:#1e293b;font-size:17px;line-height:1.47;text-align:center;margin-bottom:16px;">${escapeHtml(str).replace(/\n/g,'<br>')}</div>
                    </div>
                    <div style="display:flex;gap:12px;justify-content:center;padding:0 24px 24px;">
                        <button style="background:#0a84ff;color:white;border:none;padding:12px 18px;border-radius:9999px;cursor:pointer;font-size:17px;flex:1;box-shadow:0 10px 20px rgba(10,132,255,0.25);">OK</button>
                    </div>
                `);
                box.querySelector('button').focus();
                box.querySelector('button').onclick = () => { removeModal(overlay); resolve(); };
            });
        },

        confirm(message) {
            return new Promise(resolve => {
                const str = String(message);
                const { overlay, box } = createModal(`
                    <div style="padding:24px 24px 0;">
                        <div style="color:#1e293b;font-size:17px;line-height:1.47;text-align:center;margin-bottom:16px;">${escapeHtml(str).replace(/\n/g,'<br>')}</div>
                    </div>
                    <div style="display:flex;gap:12px;justify-content:center;padding:0 24px 24px;">
                        <button data-val="false" style="background:rgba(142,142,147,0.12);color:#1e293b;border:1px solid rgba(142,142,147,0.2);padding:12px 18px;border-radius:9999px;cursor:pointer;font-size:17px;flex:1;">Abbrechen</button>
                        <button data-val="true" style="background:#0a84ff;color:white;border:none;padding:12px 18px;border-radius:9999px;cursor:pointer;font-size:17px;flex:1;box-shadow:0 10px 20px rgba(10,132,255,0.25);">OK</button>
                    </div>
                `);
                box.querySelectorAll('button').forEach(btn => {
                    btn.onclick = () => {
                        const val = btn.getAttribute('data-val') === 'true';
                        removeModal(overlay);
                        resolve(val);
                    };
                });
                box.querySelector('button[data-val="true"]').focus();
            });
        },

        prompt(message, defaultValue = '') {
            return new Promise(resolve => {
                const str = String(message);
                const { overlay, box } = createModal(`
                    <div style="padding:24px 24px 0;">
                        <div style="color:#1e293b;font-size:17px;line-height:1.47;text-align:center;margin-bottom:16px;">${escapeHtml(str).replace(/\n/g,'<br>')}</div>
                        <input type="text" value="${escapeHtml(defaultValue)}" style="width:100%;padding:16px 20px;border-radius:14px;border:1.5px solid rgba(0,0,0,0.08);background:rgba(255,255,255,0.9);font-size:17px;box-sizing:border-box;margin-bottom:16px;">
                    </div>
                    <div style="display:flex;gap:12px;justify-content:center;padding:0 24px 24px;">
                        <button data-val="cancel" style="background:rgba(142,142,147,0.12);color:#1e293b;border:1px solid rgba(142,142,147,0.2);padding:12px 18px;border-radius:9999px;cursor:pointer;font-size:17px;flex:1;">Abbrechen</button>
                        <button data-val="ok" style="background:#0a84ff;color:white;border:none;padding:12px 18px;border-radius:9999px;cursor:pointer;font-size:17px;flex:1;box-shadow:0 10px 20px rgba(10,132,255,0.25);">OK</button>
                    </div>
                `);
                const input = box.querySelector('input');
                input.focus();
                input.select();
                box.querySelectorAll('button').forEach(btn => {
                    btn.onclick = () => {
                        const val = btn.getAttribute('data-val') === 'ok' ? input.value : null;
                        removeModal(overlay);
                        resolve(val);
                    };
                });
                input.onkeydown = (e) => {
                    if (e.key === 'Enter') { removeModal(overlay); resolve(input.value); }
                    if (e.key === 'Escape') { removeModal(overlay); resolve(null); }
                };
            });
        }
    };
})();
// ===== END INLINE NOTIFY SYSTEM =====

import { translations } from './src/constants/translations.js';
import { demoData } from './src/data/demo-data.js';
import { apiService } from './src/services/api.service.js';
import { registerGlobalComponents } from './src/components/registerGlobalComponents.js';
import {
    cacheUsername,
    getCachedUsername,
    clearUsernameCache,
    clearAuthState,
    readAuthSnapshot,
    persistAuthState,
    persistLanguage,
    readLanguage
} from './src/store/session-store.js';
import { useDarkMode } from './src/composables/useDarkMode.js';
import { useAuth } from './src/composables/useAuth.js';
import { useSession } from './src/composables/useSession.js';
import { keyboardShortcuts } from './src/utils/keyboardShortcuts.js';
// Module für modulare Funktionen
import * as utils from './src/modules/utils.js';
import * as filters from './src/modules/filters.js';
import * as events from './src/modules/events.js';
import * as ui from './src/modules/ui.js';
import * as actions from './src/modules/actions.js';
import * as forms from './src/modules/forms.js';
import * as certificates from './src/modules/certificates.js';
import * as exams from './src/modules/exams.js';
import * as courses from './src/modules/courses.js';
import * as goals from './src/modules/goals.js';
import * as admin from './src/modules/admin.js';
import * as profile from './src/modules/profile.js';
// Templates
import { examsTemplate } from './src/templates/exams-template.js';
import { certificatesTemplate } from './src/templates/certificates-template.js';
import { coursesTemplate } from './src/templates/courses-template.js';
import { settingsTemplate } from './src/templates/settings-template.js';
import { adminTemplate } from './src/templates/admin-template.js';
import { profileTemplate } from './src/templates/profile-template.js';
import { authTemplate } from './src/templates/auth-template.js';
import { dashboardTemplate } from './src/templates/dashboard-template.js';
import { GoalsPageTemplate } from './src/templates/GoalsPageTemplate.js';
import { layoutTemplate } from './src/templates/layout-template.js';
import { modalsTemplate, modalsOutsideMainTemplate } from './src/templates/modals-template.js';

const { createApp } = window.Vue || Vue;

// Übersetzungen & Demo-Daten werden nun über src/constants und src/data eingebunden.

// API-Service wird über src/services/api.service.js gekapselt.

// Hauptanwendung
const app = createApp({
    template: `
        <div id="fightlog-app">
            ${layoutTemplate}
            
            <!-- Hauptinhalt -->
            <main id="main-content">
                ${authTemplate}
                
                ${dashboardTemplate}
                
                ${certificatesTemplate}
                
                                 <!-- Prüfungen -->
                ${examsTemplate}
                
                ${GoalsPageTemplate}

                ${settingsTemplate}

                ${coursesTemplate}


                ${adminTemplate}

                ${profileTemplate}

                ${modalsTemplate}
            </main>
            
            ${modalsOutsideMainTemplate}
        </div>
    `,
    
    data() {
        const darkMode = useDarkMode();
        return {
            // Authentifizierung
            isLoggedIn: false,
            currentUser: null,
            showRegister: false,
            showPassword: false,
            showPasskeyModal: false,
            showCreateUserModal: false,
            darkModeEnabled: darkMode.isDarkMode(),
            
            // Performance: API-Cache für Request-Deduplizierung
            _apiCache: {},
            _cacheTimeout: 30000, // 30 Sekunden Cache
            
            // Navigation
            currentPage: 'dashboard',
            
                         // Sprache (nur Deutsch)
             currentLanguage: 'de',
            
            // Formulardaten
            authForm: {
                username: '',
                email: '',
                password: '',
                role: 'schueler',
                stayLoggedIn: false,
                phone: '',
                firstName: '',
                lastName: ''
            },
            
            certificateForm: {
                title: '',
                type: '',
                date: '',
                level: '',
                instructor: '',
                file: null,
                userId: null, // rückwärtskompatibel
                userIds: [],
                studentQuery: '',
                selectedStudents: []
            },
            
            // Neue Urkunden-Anzeige
            showManualCertificateForm: false,
            manualCertificateForm: {
                title: '',
                date: '',
                level: '',
                instructor: '',
                studentQuery: '',
                studentId: null,
                studentName: ''
            },
            showCertificateDetailModal: false,
            selectedCertificate: null,
            certificateSettings: {
                certificate_title: 'Urkunde',
                certificate_school_name: '',
                certificate_congratulation_text: 'Herzlichen Glückwunsch zur bestandenen Prüfung!',
                certificate_footer_text: ''
            },
            generalSettings: {
                password_min_length: 8
            },
            savingGeneralSettings: false,
            generalSettingsError: null,
            
            // Session-Timeout
            sessionTimeoutWarning: false,
            sessionExpired: false,
            sessionRemainingSeconds: null,
            sessionCheckInterval: null,
            
            examForm: {
                date: '',
                level: '',
                category: '',instructor: '',
                comments: '',
                userId: null,
                userIds: [],
                studentQuery: '',
                selectedStudents: []
            },
            
            // Neues Ziele-System (Template-basiert)
            goalTemplates: [],
            goalCategories: [],
            selectedGoalCategory: '',
            selectedTemplateId: null,
            // Ziel-Details Modal
            showGoalDetailsModal: false,
            goalDetailsData: null,
            goalSubtasks: [],
            showCancelledGoals: false,
            goalTargetDate: '',
            // Admin Ziele-Filter
            adminGoalStatusFilter: '',
            adminGoalSearch: '',
            
            // Daten
            certificates: [],
            exams: [],
            trainingHistory: [],
            goals: [],
            allUsersGoals: [], // Alle Ziele aller User (für Admin)
            courses: []
            ,
            // Admin
            adminUserList: [],
            adminSearch: '',
            createUserForm: {
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
            },
            // Profil-Formular
            profileForm: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                school: '',
                beltLevel: ''
            },
            // Passwort-Änderung
            passwordForm: {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            },
            adminPermissionsList: [
                { key: 'manage_users', label: 'Benutzer verwalten' },
                { key: 'view_all_data', label: 'Alle Daten einsehen' },
                { key: 'manage_certificates', label: 'Urkunden verwalten' },
                { key: 'approve_certificates', label: 'Urkunden freigeben' },
                { key: 'manage_exams', label: 'Prüfungen verwalten' },
                { key: 'edit_training_history', label: 'Trainingsverlauf bearbeiten' }
            ],
            // Suche/Filter
            certificateSearch: '',
            examSearch: '',
            // Kurse
            courseForm: {
                title: '',
                date: '',
                instructor: '',
                duration: '',
                max_participants: 20,
                price: '',
                description: '',
                status: 'approved',
                userId: null,
                userIds: [],
                studentQuery: '',
                selectedStudents: []
            },
            courseSearch: '',
            // Validierung
            emailError: false,
            phoneError: false,

            // Settings (ehemals Presets)
            currentSettingsTab: 'certificates',
            certificatePresets: [],
            certificatePresetForm: { title: '', type: '', level: '', instructor: '' },
            // Gruppen (aus Datenbank)
            studentGroups: [],
            groupForm: { name: '', description: '', userIds: [], query: '' },
            // Ziel-Vorlagen Formular
            goalTemplateForm: {
                id: null,
                title: '',
                definition: '',
                category: '',
                subtasks: []
            },
            // Grade (Gürtelgrade)
            grades: [],
            gradeForm: {
                id: null,
                name: '',
                sort_order: 0,
                color: '#FFEB3B'
            },
            // Gruppen-Bearbeitungs-Modal
            showGroupEditModal: false,
            groupEditForm: {
                id: null,
                name: '',
                description: '',
                members: [],
                memberQuery: '',
                showAddMember: false
            },
            // Prüfung bearbeiten Modal
            showExamEditModal: false,
            examEditForm: {
                id: null,
                date: '',
                level: '',
                category: '',
                instructor: '',
                comments: '',
                status: 'passed',
                userId: null,
                studentName: '',
                studentQuery: ''
            },
            // Kurs bearbeiten Modal
            showCourseEditModal: false,
            courseEditForm: {
                id: null,
                title: '',
                date: '',
                instructor: '',
                duration: '',
                max_participants: 20,
                price: '',
                description: ''
            },
            // Teilnehmer anzeigen Modal
            showParticipantsModal: false,
            participantsModalCourse: null,
            participantsList: [],
            participantsAddMode: false,
            participantsSearchQuery: ''
        }
    },
    
    computed: {
        // Übersetzungen
        t() {
            return (key) => {
                return translations[this.currentLanguage][key] || key;
            }
        },
        // Presets gefiltert nach aktueller Auswahl
        certificatePresetsFiltered() {
            const type = (this.certificatePresetForm.type || '').trim();
            if (!type) return this.certificatePresets;
            return this.certificatePresets.filter(p => (p.type || '') === type);
        },
        // --- Schülerauswahl: All-Selected-Status je Formular ---
        allCertStudentsChecked() {
            const list = this.studentMatches(this.certificateForm.studentQuery || '');
            if (!list.length) return false;
            return list.every(u => this.certificateForm.userIds.includes(u.id));
        },
        allExamStudentsChecked() {
            const list = this.studentMatches(this.examForm.studentQuery || '');
            if (!list.length) return false;
            return list.every(u => this.examForm.userIds.includes(u.id));
        },
        allCourseStudentsChecked() {
            const list = this.studentMatches(this.courseForm.studentQuery || '');
            if (!list.length) return false;
            return list.every(u => this.courseForm.userIds.includes(u.id));
        },
        adminFilteredUsers() {
            const q = (this.adminSearch || '').toLowerCase().trim();
            if (!q) return this.adminUserList;
            return this.adminUserList.filter(u =>
                (u.username || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.name || '').toLowerCase().includes(q) ||
                (u.firstName || '').toLowerCase().includes(q) ||
                (u.lastName || '').toLowerCase().includes(q)
            );
        },
        // Gefilterte Schüler für das Gruppen-Bearbeitungs-Modal
        filteredStudentsForGroupEdit() {
            const q = (this.groupEditForm.memberQuery || '').toLowerCase().trim();
            if (!q) return [];
            const currentIds = this.groupEditForm.members.map(m => m.id);
            return this.adminUserList
                .filter(u => u.role === 'schueler' && !currentIds.includes(u.id))
                .filter(u => {
                    const name = (u.name || '').toLowerCase();
                    const username = (u.username || '').toLowerCase();
                    return name.includes(q) || username.includes(q);
                })
                .slice(0, 20);
        },
        // Gefilterte Schüler für Kurs-Teilnehmer hinzufügen
        filteredStudentsForCourse() {
            const q = (this.participantsSearchQuery || '').toLowerCase().trim();
            if (!q) return [];
            const currentIds = this.participantsList.map(p => p.user_id);
            return this.adminUserList
                .filter(u => u.role === 'schueler' && !currentIds.includes(u.id))
                .filter(u => {
                    const name = (u.name || '').toLowerCase();
                    const username = (u.username || '').toLowerCase();
                    return name.includes(q) || username.includes(q);
                })
                .slice(0, 20);
        },
        // Gefilterte Gruppen für Kurs-Teilnehmer hinzufügen
        filteredGroupsForCourse() {
            const q = (this.participantsSearchQuery || '').toLowerCase().trim();
            if (!q) return [];
            return this.studentGroups
                .filter(g => (g.name || '').toLowerCase().includes(q))
                .slice(0, 10);
        },
        filteredCertificates() {
            const q = (this.certificateSearch || '').toLowerCase().trim();
            if (!q) return this.certificates;
            return this.certificates.filter(c =>
                (c.title || '').toLowerCase().includes(q) ||
                (c.instructor || '').toLowerCase().includes(q) ||
                (c.gradeName || '').toLowerCase().includes(q)
            );
        },
        ownCertificates() {
            if (!this.currentUser) return [];
            return this.certificates.filter(c => String(c.userId || c.user_id) === String(this.currentUser.id));
        },
        displayedCertificates() {
            // Admins/Trainer sehen alle, Schüler nur eigene
            if (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'trainer')) {
                return this.filteredCertificates;
            }
            return this.ownCertificates;
        },
        filteredExams() {
            const q = (this.examSearch || '').toLowerCase().trim();
            if (!q) return this.exams;
            return this.exams.filter(e =>
                (e.level || '').toLowerCase().includes(q) ||
                (e.instructor || '').toLowerCase().includes(q) ||
                (e.category || '').toLowerCase().includes(q) ||
                (e.studentName || '').toLowerCase().includes(q) ||
                (e.studentUsername || '').toLowerCase().includes(q)
            );
        },
        ownExams() {
            if (!this.currentUser) return [];
            return this.exams.filter(e => String(e.userId || e.user_id) === String(this.currentUser.id));
        },
        filteredCourses() {
            const q = (this.courseSearch || '').toLowerCase().trim();
            let courses = this.courses;
            if (q) {
                courses = courses.filter(c =>
                    (c.title || '').toLowerCase().includes(q) ||
                    (c.instructor || '').toLowerCase().includes(q) ||
                    (c.description || '').toLowerCase().includes(q)
                );
            }
            // Sortiere nach Datum (nächster Kurs zuerst)
            return courses.slice().sort((a, b) => {
                const dateA = a.date && a.date !== '0000-00-00' ? new Date(a.date) : new Date('9999-12-31');
                const dateB = b.date && b.date !== '0000-00-00' ? new Date(b.date) : new Date('9999-12-31');
                return dateA - dateB;
            });
        },
        studentApprovedCourses() {
            if (!this.currentUser) return [];
            return this.courses.filter(c => c.status === 'approved' && String(c.userId || c.user_id) === String(this.currentUser.id));
        },
        // Anstehende Kurse für Schüler (Datum >= heute, ungültige Daten werden übersprungen)
        upcomingCourses() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return this.courses.filter(c => {
                // Ungültige Daten überspringen
                if (!c.date || c.date === '0000-00-00') return false;
                const courseDate = new Date(c.date);
                // Prüfen ob gültiges Datum
                if (isNaN(courseDate.getTime())) return false;
                return courseDate >= today;
            }).sort((a, b) => new Date(a.date) - new Date(b.date));
        },
        // Ausstehende Ziele (in_progress, nicht cancelled)
        pendingGoals() {
            return this.goals.filter(g => g.status === 'in_progress');
        },
        // Erreichte Ziele (completed)
        completedGoals() {
            return this.goals.filter(g => g.status === 'completed');
        },
        // Abgebrochene Ziele (cancelled)
        cancelledGoals() {
            return this.goals.filter(g => g.status === 'cancelled');
        },
        // Gefilterte Ziel-Templates basierend auf Kategorie
        filteredGoalTemplates() {
            if (!this.selectedGoalCategory) {
                return this.goalTemplates;
            }
            return this.goalTemplates.filter(t => t.category === this.selectedGoalCategory);
        },
        // Aktuell ausgewähltes Ziel-Template
        selectedGoalTemplate() {
            if (!this.selectedTemplateId) return null;
            return this.goalTemplates.find(t => t.id === this.selectedTemplateId);
        },
        // Fortschritt für Modal berechnen
        goalDetailsProgress() {
            if (!this.goalSubtasks || this.goalSubtasks.length === 0) return 0;
            const completed = this.goalSubtasks.filter(s => s.completed).length;
            return Math.round((completed / this.goalSubtasks.length) * 100);
        },
        // Gefilterte Ziele aller User (für Admin)
        filteredAllUsersGoals() {
            let filtered = this.allUsersGoals;
            
            // Nach Status filtern
            if (this.adminGoalStatusFilter) {
                filtered = filtered.filter(g => g.status === this.adminGoalStatusFilter);
            }
            
            // Nach Name suchen
            if (this.adminGoalSearch) {
                const search = this.adminGoalSearch.toLowerCase();
                filtered = filtered.filter(g => 
                    (g.user_name && g.user_name.toLowerCase().includes(search)) ||
                    (g.username && g.username.toLowerCase().includes(search)) ||
                    (g.title && g.title.toLowerCase().includes(search))
                );
            }
            
            return filtered;
        }
    },
    
    methods: {
        /**
         * Sucht nach Gruppen die zum Query-String passen
         * @param {string} query - Suchbegriff
         * @returns {Array} Gefilterte Gruppen (max. 20)
         */
        // Filter-Funktionen (aus Modul)
        groupMatches(query) {
            return filters.groupMatches(this, query);
        },
        
        displayUserName(userId) {
            return utils.displayUserName(this, userId);
        },
        
        tapSelectStudent(target, user) {
            return events.tapSelectStudent(this, target, user);
        },
        
        removeSelected(target, userId) {
            return events.removeSelected(this, target, userId);
        },
        
        applyGroupObjectTo(target, group) {
            return events.applyGroupObjectTo(this, target, group);
        },
        
        studentMatches(query) {
            return filters.studentMatches(this, query);
        },
        
        toggleCertStudent(user) {
            return events.toggleCertStudent(this, user);
        },
        
        toggleAllCertStudents(evt) {
            return events.toggleAllCertStudents(this, evt);
        },
        
        toggleExamStudent(user) {
            return events.toggleExamStudent(this, user);
        },
        
        toggleAllExamStudents(evt) {
            return events.toggleAllExamStudents(this, evt);
        },
        
        toggleCourseStudent(user) {
            return events.toggleCourseStudent(this, user);
        },
        
        toggleAllCourseStudents(evt) {
            return events.toggleAllCourseStudents(this, evt);
        },
        
        roleEmoji(role) {
            return utils.roleEmoji(role);
        },
        
        roleLabel(role) {
            return utils.roleLabel(role);
        },
        
        // Navigation (aus Modul)
        navigateTo(page) {
            return ui.navigateTo(this, page);
        },
        
        goToDashboard() {
            return ui.goToDashboard(this);
        },
        
        // Authentifizierung (verwendet Composable)
        async handleLogin() {
            const auth = useAuth(this);
            await auth.handleLogin();
        },
        
        // UI-Funktionen (aus Modul)
        toggleDarkMode() {
            return ui.toggleDarkMode(this);
        },
        
        // Registrierung (verwendet Composable)
        async handleRegister() {
            const auth = useAuth(this);
            await auth.handleRegister();
        },
        
        // Session-Timeout Management (verwendet Composable)
        startSessionTimeoutCheck() {
            const session = useSession(this);
            session.startSessionTimeoutCheck();
        },
        
        stopSessionTimeoutCheck() {
            const session = useSession(this);
            session.stopSessionTimeoutCheck();
        },
        
        async checkSessionTimeout() {
            const session = useSession(this);
            await session.checkSessionTimeout();
        },
        
        async extendSession() {
            const session = useSession(this);
            await session.extendSession();
        },
        
        async logout() {
            const auth = useAuth(this);
            await auth.logout();
        },
        
        showPasskeyManagement() {
            return ui.showPasskeyManagement(this);
        },
        
        closePasskeyModal() {
            return ui.closePasskeyModal(this);
        },
        
        async registerPasskey() {
            return ui.registerPasskey(this);
        },
        
        async removePasskey(passkeyId) {
            return ui.removePasskey(this, passkeyId);
        },
        
        getAvailablePasskeys() {
            return ui.getAvailablePasskeys(this);
        },
        
        togglePassword() {
            return ui.togglePassword(this);
        },
        
        setLanguage(lang) {
            return ui.setLanguage(this, lang, persistLanguage);
        },
        
        // API-Actions (aus Modul)
        async loadCertificates() {
            return actions.loadCertificates(this);
        },
        
        async loadCertificateSettings() {
            return actions.loadCertificateSettings(this);
        },
        
        async loadGeneralSettings() {
            return actions.loadGeneralSettings(this);
        },
        
        async saveGeneralSettings() {
            return actions.saveGeneralSettings(this);
        },
        
        openCertificateDetail(cert) {
            return ui.openCertificateDetail(this, cert);
        },
        
        selectStudentForManualCertificate(user) {
            return ui.selectStudentForManualCertificate(this, user);
        },
        
        async createManualCertificate() {
            return actions.createManualCertificate(this);
        },
        
        async deleteManualCertificate(id) {
            return actions.deleteManualCertificate(this, id);
        },
        
        async saveCertificateSettings() {
            return actions.saveCertificateSettings(this);
        },
        
        // Prüfungen
        async addExam() {
            return exams.addExam(this);
        },
        
        async loadExams() {
            return actions.loadExams(this);
        },
        clearCertificateSearch() {
            return ui.clearSearch(this, 'certificate');
        },
        
        clearExamSearch() {
            return ui.clearSearch(this, 'exam');
        },
        
        clearCourseSearch() {
            return ui.clearSearch(this, 'course');
        },
        async deleteCertificate(cert) {
            return certificates.deleteCertificate(this, cert);
        },
        editExam(exam) {
            return exams.editExam(this, exam);
        },
        closeExamEditModal() {
            return exams.closeExamEditModal(this);
        },
        selectStudentForExamEdit(user) {
            return exams.selectStudentForExamEdit(this, user);
        },
        async saveExamEdit() {
            return exams.saveExamEdit(this);
        },
        async deleteExam(exam) {
            return exams.deleteExam(this, exam);
        },
        // Utility-Funktionen (aus Modul)
        toISODate(dateStr) {
            return utils.toISODate(dateStr);
        },
        
        toGermanDate(dateStr) {
            return utils.toGermanDate(dateStr);
        },
        
        formatDate(dateStr) {
            return utils.formatDate(dateStr);
        },
        
        formatDateTime(dateStr) {
            return utils.formatDateTime(dateStr);
        },
        
        canCancelBooking(course) {
            return utils.canCancelBooking(course);
        },
        
        validateEmail() {
            return utils.validateEmail(this);
        },
        
        validatePhone() {
            return utils.validatePhone(this);
        },
        
        // ========== NEUES ZIELE-SYSTEM (Template-basiert) ==========
        
        async loadGoalTemplates() {
            return actions.loadGoalTemplates(this);
        },
        
        async loadGoals() {
            return actions.loadGoals(this);
        },
        
        // Ziel einem User zuweisen (sich selbst)
        async assignGoalToSelf() {
            return goals.assignGoalToSelf(this);
        },
        
        // Ziel-Details Modal öffnen
        async openGoalDetails(goal) {
            return goals.openGoalDetails(this, goal);
        },
        
        // Unterziel toggle (erledigt/nicht erledigt)
        async toggleSubtask(subtask) {
            return goals.toggleSubtask(this, subtask);
        },
        
        // Ziel abbrechen
        async cancelGoal(goal) {
            return goals.cancelGoal(this, goal);
        },
        
        // Ziel wiederaufnehmen
        async resumeGoal(goal) {
            return goals.resumeGoal(this, goal);
        },
        
        // Ziel löschen
        async deleteGoal(goal) {
            return goals.deleteGoal(this, goal);
        },
        
        // ========== ENDE ZIELE-SYSTEM ==========
        
        // Admin
        async loadUsers() {
            return actions.loadUsers(this);
        },
        toggleUserCard(user) {
            return admin.toggleUserCard(this, user);
        },
        togglePermission(user, permKey) {
            return admin.togglePermission(this, user, permKey);
        },
        startEditUser(user) {
            return admin.startEditUser(this, user);
        },
        cancelEditUser(user) {
            return admin.cancelEditUser(this, user);
        },
        validateUserForm(user) {
            return forms.validateUserForm(this, user);
        },
        async saveUser(user) {
            return admin.saveUser(this, user);
        },
        validateCreateUserForm() {
            return forms.validateCreateUserForm(this);
        },
        closeCreateUserModal() {
            return admin.closeCreateUserModal(this);
        },
        async createUser() {
            return admin.createUser(this);
        },
        addPasskey(user) {
            return admin.addPasskey(this, user);
        },
        removePasskey(user, key) {
            return admin.removePasskey(this, user, key);
        },
        async deleteUser(user) {
            return admin.deleteUser(this, user);
        },
        async changeUserPassword(user) {
            return admin.changeUserPassword(this, user);
        },
        
        // Profil speichern
        async saveProfile() {
            return profile.saveProfile(this);
        },
        
        // Eigenes Passwort ändern
        async changePassword() {
            return profile.changePassword(this);
        },
        
        // Daten laden (mit Performance-Optimierung: parallele Calls wo möglich)
        async loadPageData() {
            switch (this.currentPage) {
                case 'certificates':
                    // Performance: Parallele API-Calls (Promise.all)
                    await Promise.all([
                        this.loadCertificates(),
                        this.loadUsers(),
                        this.loadGrades()
                    ]);
                    break;
                case 'exams':
                    // Performance: Parallele API-Calls
                    const examPromises = [this.loadExams(), this.loadGrades()];
                    // Nur für Admin/Trainer Users und Gruppen laden (für Schüler-Zuweisung)
                    if (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'trainer')) {
                        examPromises.push(this.loadUsers(), this.loadGroups());
                    }
                    await Promise.all(examPromises);
                    break;
                case 'goals':
                    // Performance: Parallele API-Calls
                    await Promise.all([
                        this.loadGoalTemplates(),
                        this.loadGoals()
                    ]);
                    break;
                case 'trainingHistory':
                    await actions.loadTrainingHistory(this);
                    break;
                case 'courses':
                    // Performance: Parallele API-Calls
                    const coursePromises = [this.loadCourses()];
                    // Für Admin/Trainer Users und Gruppen laden (für Schüler-Zuweisung)
                    if (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'trainer')) {
                        coursePromises.push(this.loadUsers(), this.loadGroups());
                    }
                    await Promise.all(coursePromises);
                    break;
                case 'admin':
                    // Performance: Parallele API-Calls
                    await Promise.all([
                        this.loadUsers(),
                        this.loadGrades()
                    ]);
                    break;
                case 'settings':
                    this.loadPresets();
                    // Performance: Parallele API-Calls
                    await Promise.all([
                        this.loadUsers(),
                        this.loadGroups(),
                        this.loadGoalTemplates(),
                        this.loadGrades(),
                        this.loadCertificateSettings(),
                        this.loadGeneralSettings()
                    ]);
                    break;
                case 'profile':
                    await this.loadGrades();
                    await actions.loadProfile(this);
                    break;
            }
        },
        async loadCourses() {
            return actions.loadCourses(this);
        },
        // Presets: CRUD + Persistenz
        loadPresets() {
            return admin.loadPresets(this);
        },
        savePresets() {
            return admin.savePresets(this);
        },
        // Gruppen (Datenbank-basiert)
        async loadGroups() {
            return actions.loadGroups(this);
        },
        async addStudentGroup() {
            return admin.addStudentGroup(this);
        },
        resetGroupForm() {
            return admin.resetGroupForm(this);
        },
        tapSelectGroupStudent(user) {
            return admin.tapSelectGroupStudent(this, user);
        },
        removeGroupStudent(userId) {
            return admin.removeGroupStudent(this, userId);
        },
        showGroupMembers(grp) {
            return admin.showGroupMembers(this, grp);
        },
        getGroupMemberNames(grp) {
            return admin.getGroupMemberNames(this, grp);
        },
        editGroup(grp) {
            return admin.editGroup(this, grp);
        },
        
        closeGroupEditModal() {
            return admin.closeGroupEditModal(this);
        },
        
        addMemberToGroupEdit(user) {
            return admin.addMemberToGroupEdit(this, user);
        },
        
        removeMemberFromGroupEdit(userId) {
            return admin.removeMemberFromGroupEdit(this, userId);
        },
        
        async saveGroupEdit() {
            return admin.saveGroupEdit(this);
        },
        async removeGroup(grp) {
            return admin.removeGroup(this, grp);
        },
        // Certificate Presets
        addCertificatePreset() {
            return admin.addCertificatePreset(this);
        },
        async editCertificatePreset(preset) {
            return admin.editCertificatePreset(this, preset);
        },
        async removeCertificatePreset(preset) {
            return admin.removeCertificatePreset(this, preset);
        },
        setSettingsTab(tab) {
            return ui.setSettingsTab(this, tab);
        },
        
        // ========== GRADE CRUD ==========
        
        async loadGrades() {
            return actions.loadGrades(this);
        },
        
        resetGradeForm() {
            return admin.resetGradeForm(this);
        },
        
        editGrade(grade) {
            return admin.editGrade(this, grade);
        },
        
        async saveGrade() {
            return admin.saveGrade(this);
        },
        
        async deleteGrade(grade) {
            return admin.deleteGrade(this, grade);
        },
        
        // ========== GOAL TEMPLATE CRUD ==========
        
        addGoalSubtask() {
            return admin.addGoalSubtask(this);
        },
        
        removeGoalSubtask(index) {
            return admin.removeGoalSubtask(this, index);
        },
        
        resetGoalTemplateForm() {
            return admin.resetGoalTemplateForm(this);
        },
        
        async saveGoalTemplate() {
            return admin.saveGoalTemplate(this);
        },
        
        async editGoalTemplate(template) {
            return admin.editGoalTemplate(this, template);
        },
        
        async deleteGoalTemplate(template) {
            return admin.deleteGoalTemplate(this, template);
        },
        
        async submitCourse() {
            return courses.submitCourse(this);
        },
        editCourse(course) {
            return courses.editCourse(this, course);
        },
        async saveCourseEdit() {
            return courses.saveCourseEdit(this);
        },
        async removeCourse(course) {
            return courses.removeCourse(this, course);
        },
        
        // Teilnehmer anzeigen (Admin/Trainer)
        async showParticipants(course) {
            return courses.showParticipants(this, course);
        },
        
        closeParticipantsModal() {
            return courses.closeParticipantsModal(this);
        },
        
        async addParticipantToCourse(user) {
            return courses.addParticipantToCourse(this, user);
        },
        
        /**
         * Fügt alle Mitglieder einer Gruppe zu einem Kurs hinzu
         * Verhindert Duplikate und zeigt Feedback über Erfolg/Fehler
         */
        async addGroupToCourse(group) {
            return courses.addGroupToCourse(this, group);
        },
        
        async removeParticipantFromCourse(userId) {
            return courses.removeParticipantFromCourse(this, userId);
        },
        
        
        // Schüler: Für Kurs anmelden
        async bookCourse(course) {
            return courses.bookCourse(this, course);
        },
        
        // Schüler: Von Kurs abmelden
        async cancelBooking(course) {
            return courses.cancelBooking(this, course);
        },
        
    },
    
        async mounted() {
            // Lade gespeicherte Einstellungen (nur Deutsch)
            this.currentLanguage = readLanguage('de');
            persistLanguage(this.currentLanguage);
        
            // Prüfe neue Authentifizierungsdaten
            const { isAuthenticated, user } = readAuthSnapshot();
        
            if (isAuthenticated && user) {
                this.isLoggedIn = true;
                
                // Behalte ID aus localStorage, verwende demoData nur für Fallback-Felder
                this.currentUser = {
                    ...demoData.user,
                    ...user, // Überschreibt mit gespeicherten Daten (inkl. id, role, username)
                };
                
                // Performance: Parallele API-Calls beim initialen Laden
                await Promise.all([
                    this.loadExams(),
                    this.loadCourses(),
                    this.loadGrades()
                ]);
                
                // Starte Session-Timeout-Check nur wenn Token vorhanden ist
                const token = localStorage.getItem('auth_token');
                if (token) {
                    this.startSessionTimeoutCheck();
                }
            } else {
                // Fallback zu altem System
                const savedUsername = getCachedUsername();
                if (savedUsername) {
                    this.isLoggedIn = true;
                    this.currentUser = demoData.user;
                    // Performance: Parallele API-Calls
                    await Promise.all([
                        this.loadExams(),
                        this.loadCourses(),
                        this.loadGrades()
                    ]);
                }
            }
            
            // Keyboard Shortcuts registrieren
            keyboardShortcuts.register('ctrl+/', () => {
                window.notify.alert('Keyboard Shortcuts:\n\nCtrl+K: Suche fokussieren\nESC: Modal schließen\nCtrl+/: Diese Hilfe');
            });
            
            keyboardShortcuts.register('ctrl+n', (e) => {
                if (this.currentPage === 'certificates' && this.currentUser?.role === 'admin') {
                    this.showManualCertificateForm = true;
                }
            });
        }
});

// Globale Komponenten registrieren
registerGlobalComponents(app);

// Starte Anwendung
app.mount('#app');