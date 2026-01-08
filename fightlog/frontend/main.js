// ===== FIGHTLOG - HAUPTANWENDUNG =====
// Diese Datei enthält die komplette Vue.js Anwendung
// Backend-Entwickler: Hier können echte API-Calls eingefügt werden

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

const { createApp } = window.Vue || Vue;

// Übersetzungen & Demo-Daten werden nun über src/constants und src/data eingebunden.

// API-Service wird über src/services/api.service.js gekapselt.

// Hauptanwendung
const app = createApp({
    template: `
        <div id="fightlog-app">

            
            <!-- Header Navigation -->
            <header v-if="isLoggedIn" class="header">
                <div class="container">
                    <nav class="nav">
                        <a href="#" @click.prevent="goToDashboard" class="logo">
                            FightLog
                        </a>
                        
                                                 <div class="user-info">
                             <button @click="showPasskeyManagement" class="btn btn-secondary" style="width: auto; padding: 0.5rem 1rem; margin-right: 0.5rem;">
                                 <i class="fas fa-key"></i> Passkey verwalten
                             </button>
                             <button @click="logout" class="btn btn-secondary" style="width: auto; padding: 0.5rem 1rem;">
                                 <i class="fas fa-right-from-bracket"></i> {{ t('logout') }}
                             </button>
                         </div>
                    </nav>
                </div>
            </header>
            
            <!-- Hauptinhalt -->
            <main>
                <!-- Login/Registrierung -->
                <div v-if="!isLoggedIn">
                    <div class="auth-container">
                        <div class="auth-card">
                            <h2>{{ showRegister ? t('register') : t('login') }}</h2>
                            
                            <form @submit.prevent="showRegister ? handleRegister() : handleLogin()">
                                <div class="form-group">
                                    <label for="username">{{ t('username') }}</label>
                                    <input 
                                        type="text" 
                                        id="username" 
                                        v-model="authForm.username" 
                                        class="form-control" 
                                        required
                                    >
                                </div>
                                
                                <div v-if="showRegister" class="form-row">
                                    <div class="form-group">
                                        <label for="firstName">Vorname</label>
                                        <input 
                                            type="text" 
                                            id="firstName" 
                                            v-model="authForm.firstName" 
                                            class="form-control" 
                                            required
                                        >
                                    </div>
                                    <div class="form-group">
                                        <label for="lastName">Nachname</label>
                                        <input 
                                            type="text" 
                                            id="lastName" 
                                            v-model="authForm.lastName" 
                                            class="form-control" 
                                            required
                                        >
                                    </div>
                                </div>

                                <div v-if="showRegister" class="form-group">
                                    <label for="email">{{ t('email') }}</label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        v-model="authForm.email" 
                                        class="form-control" 
                                        required
                                        @blur="validateEmail"
                                    >
                                </div>
                                
                                <div v-if="showRegister" class="form-group">
                                    <label for="phone">{{ t('phone') }}</label>
                                    <input 
                                        type="tel" 
                                        id="phone" 
                                        v-model="authForm.phone" 
                                        class="form-control" 
                                        required
                                        @blur="validatePhone"
                                    >
                                </div>
                                
                                <div class="form-group">
                                    <label for="password">{{ t('password') }}</label>
                                    <div class="password-field">
                                        <input 
                                            :type="showPassword ? 'text' : 'password'" 
                                            id="password" 
                                            v-model="authForm.password" 
                                            class="form-control" 
                                            required
                                        >
                                        <button 
                                            type="button" 
                                            @click="togglePassword" 
                                            class="password-toggle"
                                        >
                                            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Rolle wird bei Registrierung automatisch auf Schüler gesetzt; kein Dropdown sichtbar -->
                                
                                <div class="form-group">
                                    <div class="toggle-row">
                                        <button 
                                            type="button" 
                                            class="toggle" 
                                            :class="{ active: authForm.stayLoggedIn }" 
                                            @click="authForm.stayLoggedIn = !authForm.stayLoggedIn" 
                                            :aria-pressed="authForm.stayLoggedIn.toString()"
                                        >
                                            <span class="toggle-knob"></span>
                                        </button>
                                        <span class="toggle-label">{{ t('stayLoggedIn') }}</span>
                                    </div>
                                </div>
                                
                                <button type="submit" class="btn btn-primary" style="width:100%; border-radius:12px;">
                                    {{ showRegister ? t('register') : t('login') }}
                                </button>
                            </form>
                            
                            <!-- Registrierung nur für Admin verfügbar -->
                            <p v-if="currentUser && currentUser.role === 'admin'" style="text-align: center; margin-top: 1rem;">
                                <button type="button" class="btn btn-secondary" style="width:100%; border-radius:12px;" @click.prevent="showRegister = !showRegister">
                                    {{ showRegister ? t('login') : t('register') }}
                                </button>
                            </p>
                            <p v-else-if="!isLoggedIn" style="text-align: center; margin-top: 1rem; color: #64748b; font-size: 0.9rem;">
                                Registrierung nur für Administratoren verfügbar
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Dashboard -->
                <div v-else-if="currentPage === 'dashboard'">
                    <div class="dashboard">
                        <div class="container">
                            <div class="dashboard-header">
                                <h1>Willkommen bei <span class="brand-logo">FightLog</span></h1>
                                <p>{{ t('subtitle') }}</p>
                            </div>
                            
                            <div class="nav-grid">
                                <nav-card
                                    icon="fa-certificate"
                                    :title="t('certificates')"
                                    description="Urkunden verwalten"
                                    @click="navigateTo('certificates')"
                                />
                                
                                <nav-card
                                    icon="fa-clipboard-check"
                                    :title="t('exams')"
                                    description="Prüfungsergebnisse &amp; Bewertungen"
                                    @click="navigateTo('exams')"
                                />
                                
                                <nav-card
                                    v-if="currentUser"
                                    icon="fa-bullseye"
                                    :title="t('goals')"
                                    description="Protokoll und Ziele verwalten"
                                    @click="navigateTo('goals')"
                                />

                                <nav-card
                                    icon="fa-list-check"
                                    :title="t('courses')"
                                    description="Kurse verwalten/sehen"
                                    @click="navigateTo('courses')"
                                />

                                <nav-card
                                    v-if="currentUser && currentUser.role === 'admin'"
                                    icon="fa-user-shield"
                                    :title="t('adminPanel')"
                                    description="Benutzer, Rollen &amp; Rechte verwalten"
                                    @click="navigateTo('admin')"
                                />

                                <nav-card
                                    v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')"
                                    icon="fa-sliders"
                                    title="Presets"
                                    description="Urkunden-Vorlagen &amp; Gruppen"
                                    @click="navigateTo('presets')"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                                 <!-- Urkunden -->
                 <div v-else-if="currentPage === 'certificates'">
                     <div style="padding: 2rem 0;">
                         <div class="container">
                             <div class="page-header">
                                 <button @click="goToDashboard" class="back-btn">
                                     <i class="fas fa-arrow-left"></i>
                                     Zurück
                                 </button>
                                 <h1>{{ t('certificates') }}</h1>
                             </div>
                            
                            <!-- Admin/Trainer: Upload + Suche/Bearbeiten -->
                            <div v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')">
                                <div class="form-container">
                                    <h2>{{ t('uploadCertificate') }}</h2>
                                    <form @submit.prevent="uploadCertificate">
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>{{ t('certificateTitle') }}</label>
                                                <input type="text" v-model="certificateForm.title" class="form-control" required>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label>{{ t('certificateType') }}</label>
                                                <select v-model="certificateForm.type" class="form-control" required>
                                                    <option value="">{{ t('certificateType') }}</option>
                                                    <option value="belt_exam">Gürtelprüfung</option>
                                                    <option value="tournament">Turnier</option>
                                                    <option value="workshop">Workshop</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>{{ t('certificateDate') }}</label>
                                                <input type="date" v-model="certificateForm.date" class="form-control" required>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label>{{ t('certificateLevel') }}</label>
                                                <select v-model="certificateForm.level" class="form-control" required>
                                                    <option value="">{{ t('certificateLevel') }}</option>
                                                    <option value="Weißgurt">Weißgurt</option>
                                                    <option value="Gelbgurt">Gelbgurt</option>
                                                    <option value="Orangegurt">Orangegurt</option>
                                                    <option value="Grüngurt">Grüngurt</option>
                                                    <option value="Blaugurt">Blaugurt</option>
                                                    <option value="Braungurt">Braungurt</option>
                                                    <option value="Schwarzgurt">Schwarzgurt</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label>{{ t('certificateInstructor') }}</label>
                                            <input type="text" v-model="certificateForm.instructor" class="form-control" required>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label>Schüler zuordnen</label>
                                            <div style="position:relative;">
                                                <input type="text" v-model="certificateForm.studentQuery" class="form-control" placeholder="Schüler suchen (Tippe z. B. 'p' oder 'pa')">
                                                <div v-if="certificateForm.studentQuery && studentMatches(certificateForm.studentQuery).length" class="form-container" style="position:absolute; left:0; right:0; top:100%; margin-top:.25rem; padding:.5rem 0; z-index:1000; max-height:220px; overflow:auto;">
                                                    <div v-for="u in studentMatches(certificateForm.studentQuery)" :key="u.id" style="padding:.4rem 1rem; cursor:pointer;" @click="selectStudentForCertificate(u)">
                                                        {{ u.name }} <span style="color:#64748b;">(@{{ u.username }})</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div v-if="certificateForm.studentSelectedName" style="margin-top:.25rem; color:#64748b; font-size:.9rem;">Ausgewählt: {{ certificateForm.studentSelectedName }}</div>
                                        </div>
                                        
                                        <!-- Datei-Upload entfernt (Bewertung durch verifizierte Trainer) -->
                                        
                                        <button type="submit" class="btn btn-primary">
                                            {{ t('uploadCertificate') }}
                                        </button>
                                    </form>
                                </div>

                                <div class="form-container">
                                    <h2>{{ t('filter') }}</h2>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>{{ t('search') }}</label>
                                            <input type="text" v-model="certificateSearch" class="form-control" placeholder="Titel/Trainer/Level">
                                        </div>
                                        <div class="form-group" style="align-self: end;">
                                            <button class="btn btn-secondary" @click="clearCertificateSearch">{{ t('clearFilter') }}</button>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Schüler zuordnen</label>
                                        <div style="position:relative;">
                                            <input type="text" v-model="certificateForm.studentQuery" class="form-control" placeholder="Gruppe oder Schüler suchen" @keydown.enter.prevent>
                                            <div v-if="certificateForm.studentQuery" class="form-container" style="margin-top:.5rem; padding:.35rem .75rem; max-height:260px; overflow:auto;">
                                                <div v-for="g in groupMatches(certificateForm.studentQuery)" :key="'g_'+g.id" style="padding:.4rem 0; cursor:pointer; font-weight:600;" @click="applyGroupObjectTo('cert', g)">
                                                    {{ g.name }} <span style="color:#64748b; font-weight:500;">(Gruppe)</span>
                                                </div>
                                                <div v-for="u in studentMatches(certificateForm.studentQuery)" :key="u.id" style="padding:.3rem 0; cursor:pointer;" @click="tapSelectStudent('cert', u)">
                                                    {{ u.name }} <span style="color:#64748b;">(@{{ u.username }})</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="certificateForm.userIds.length" style="margin-top:.35rem; display:flex; flex-wrap:wrap; gap:.35rem;">
                                            <span v-for="sid in certificateForm.userIds" :key="sid" class="btn btn-secondary btn-sm" style="cursor:default;">
                                                {{ displayUserName(sid) }}
                                                <button type="button" class="btn btn-danger btn-sm" style="margin-left:.35rem;" @click="removeSelected('cert', sid)"><i class="fas fa-times"></i></button>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="certificates-grid">
                                        <div 
                                            v-for="cert in filteredCertificates" 
                                            :key="cert.id" 
                                            class="certificate-card"
                                        >
                                            <div class="certificate-preview">
                                                {{ cert.preview }}
                                            </div>
                                            <h4>{{ cert.title }}</h4>
                                            <p>{{ cert.level }}</p>
                                            <p>{{ cert.date }}</p>
                                            <p>{{ cert.instructor }}</p>
                                            <div style="margin-top: 0.5rem; display:flex; gap:.5rem; align-items:center;">
                                                <span :class="'status-' + cert.status">{{ cert.status }}</span>
                                                <button class="btn btn-secondary" style="width:auto;" @click="editCertificate(cert)"><i class="fas fa-pen"></i></button>
                                                <button class="btn btn-secondary" style="width:auto;" @click="deleteCertificate(cert)"><i class="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Schüler: nur eigene Urkunden -->
                            <div v-else class="certificates-grid">
                                <div 
                                    v-for="cert in ownCertificates" 
                                    :key="cert.id" 
                                    class="certificate-card"
                                >
                                    <div class="certificate-preview">
                                        {{ cert.preview }}
                                    </div>
                                    <h4>{{ cert.title }}</h4>
                                    <p>{{ cert.level }}</p>
                                    <p>{{ cert.date }}</p>
                                    <p>{{ cert.instructor }}</p>
                                    <div style="margin-top: 0.5rem;">
                                        <span :class="'status-' + cert.status">{{ cert.status }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                
                                 <!-- Prüfungen -->
                 <div v-else-if="currentPage === 'exams'">
                     <div style="padding: 2rem 0;">
                         <div class="container">
                             <div class="page-header">
                                 <button @click="goToDashboard" class="back-btn">
                                     <i class="fas fa-arrow-left"></i>
                                     Zurück
                                 </button>
                                 <h1>{{ t('exams') }}</h1>
                             </div>
                            
                            <!-- Admin/Trainer: Prüfung eintragen + filtern/bearbeiten; Schüler: nur eigene sehen -->
                            <div v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')" class="form-container">
                                <h2>{{ t('examEntry') }}</h2>
                                <form @submit.prevent="addExam">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>{{ t('examDate') }}</label>
                                            <input type="date" v-model="examForm.date" class="form-control" required>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label>{{ t('examLevel') }}</label>
                                            <select v-model="examForm.level" class="form-control" required>
                                                <option value="">{{ t('examLevel') }}</option>
                                                <option value="Weißgurt">Weißgurt</option>
                                                <option value="Gelbgurt">Gelbgurt</option>
                                                <option value="Orangegurt">Orangegurt</option>
                                                <option value="Grüngurt">Grüngurt</option>
                                                <option value="Blaugurt">Blaugurt</option>
                                                <option value="Braungurt">Braungurt</option>
                                                <option value="Schwarzgurt">Schwarzgurt</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    
                                    <div class="form-row">
                                        <div class="form-group" style="position: relative; z-index: 100;">
                                            <label>{{ t('examCategory') }}</label>
                                            <select v-model="examForm.category" class="form-control" required>
                                                <option value="">{{ t('examCategory') }}</option>
                                                <option value="Technik">Technik</option>
                                                <option value="Kampf">Kampf</option>
                                                <option value="Theorie">Theorie</option>
                                                <option value="Kata">Kata</option>
                                            </select>
                                        </div>
                                        
                                        <div class="form-group">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Schüler zuordnen</label>
                                        <div style="position:relative;">
                                            <input type="text" v-model="examForm.studentQuery" class="form-control" placeholder="Gruppe oder Schüler suchen" @keydown.enter.prevent>
                                            <div v-if="examForm.studentQuery" class="form-container" style="margin-top:.5rem; padding:.35rem .75rem; max-height:260px; overflow:auto;">
                                                <div v-for="g in groupMatches(examForm.studentQuery)" :key="'g_'+g.id" style="padding:.4rem 0; cursor:pointer; font-weight:600;" @click="applyGroupObjectTo('exam', g)">
                                                    {{ g.name }} <span style="color:#64748b; font-weight:500;">(Gruppe)</span>
                                                </div>
                                                <div v-for="u in studentMatches(examForm.studentQuery)" :key="u.id" style="padding:.3rem 0; cursor:pointer;" @click="tapSelectStudent('exam', u)">
                                                    {{ u.name }} <span style="color:#64748b;">(@{{ u.username }})</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="examForm.userIds.length" style="margin-top:.35rem; display:flex; flex-wrap:wrap; gap:.35rem;">
                                            <span v-for="sid in examForm.userIds" :key="sid" class="btn btn-secondary btn-sm" style="cursor:default;">
                                                {{ displayUserName(sid) }}
                                                <button type="button" class="btn btn-danger btn-sm" style="margin-left:.35rem;" @click="removeSelected('exam', sid)"><i class="fas fa-times"></i></button>
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>{{ t('examInstructor') }}</label>
                                        <input type="text" v-model="examForm.instructor" class="form-control" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>{{ t('examComments') }}</label>
                                        <textarea v-model="examForm.comments" class="form-control" rows="4"></textarea>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary">{{ t('submit') }}</button>
                                </form>
                            </div>
                            <div v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')" class="form-container">
                                <h2>{{ t('filter') }}</h2>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>{{ t('search') }}</label>
                                        <input type="text" v-model="examSearch" class="form-control" placeholder="Level/Prüfer/Kategorie/Schüler">
                                    </div>
                                    <div class="form-group" style="align-self:end;">
                                        <button class="btn btn-secondary" @click="clearExamSearch">{{ t('clearFilter') }}</button>
                                    </div>
                                </div>
                                <div class="timeline">
                                    <div v-for="exam in filteredExams" :key="exam.id" class="timeline-item">
                                        <div class="timeline-content">
                                            <h4>{{ exam.level }} - {{ exam.category }}</h4>
                                            <p><strong>Schüler:</strong> {{ exam.studentName || 'Unbekannt' }} <span v-if="exam.studentUsername" style="color:#64748b;">(@{{ exam.studentUsername }})</span></p>
                                            <p><strong>Datum:</strong> {{ formatDate(exam.date) }}</p>
                                            <p><strong>Prüfer:</strong> {{ exam.instructor }}</p>
                                            <p><strong>Status:</strong> <span :class="'status-' + exam.status">{{ exam.status }}</span></p>
                                            <p v-if="exam.comments"><strong>Kommentare:</strong> {{ exam.comments }}</p>
                                            <div style="margin-top:.5rem; display:flex; gap:.5rem;">
                                                <button class="btn btn-secondary" style="width:auto;" @click="editExam(exam)"><i class="fas fa-pen"></i></button>
                                                <button class="btn btn-secondary" style="width:auto;" @click="deleteExam(exam)"><i class="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else>
                                <div class="timeline">
                                    <div v-for="exam in ownExams" :key="exam.id" class="timeline-item">
                                        <div class="timeline-content">
                                            <h4>{{ exam.level }} - {{ exam.category }}</h4>
                                            <p><strong>Datum:</strong> {{ formatDate(exam.date) }}</p>
                                            <p><strong>Prüfer:</strong> {{ exam.instructor }}</p>
                                            <p><strong>Status:</strong> <span :class="'status-' + exam.status">{{ exam.status }}</span></p>
                                            <p v-if="exam.comments"><strong>Kommentare:</strong> {{ exam.comments }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Bearbeiten-Modal für Prüfungen -->
                            <div v-if="showExamEditModal" class="modal-overlay" @click="closeExamEditModal">
                                <div class="modal-content" @click.stop style="max-width: 600px;">
                                    <div class="modal-header">
                                        <h2><i class="fas fa-edit"></i> Prüfung bearbeiten</h2>
                                        <button @click="closeExamEditModal" class="close-btn">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <form @submit.prevent="saveExamEdit">
                                            <div class="form-row">
                                                <div class="form-group">
                                                    <label>Datum</label>
                                                    <input type="date" v-model="examEditForm.date" class="form-control" required>
                                                </div>
                                                <div class="form-group">
                                                    <label>Stufe</label>
                                                    <select v-model="examEditForm.level" class="form-control" required>
                                                        <option value="Weißgurt">Weißgurt</option>
                                                        <option value="Gelbgurt">Gelbgurt</option>
                                                        <option value="Orangegurt">Orangegurt</option>
                                                        <option value="Grüngurt">Grüngurt</option>
                                                        <option value="Blaugurt">Blaugurt</option>
                                                        <option value="Braungurt">Braungurt</option>
                                                        <option value="Schwarzgurt">Schwarzgurt</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-row">
                                                <div class="form-group">
                                                    <label>Kategorie</label>
                                                    <select v-model="examEditForm.category" class="form-control" required>
                                                        <option value="Technik">Technik</option>
                                                        <option value="Kampf">Kampf</option>
                                                        <option value="Theorie">Theorie</option>
                                                        <option value="Kata">Kata</option>
                                                    </select>
                                                </div>
                                                <div class="form-group">
                                                    <label>Status</label>
                                                    <select v-model="examEditForm.status" class="form-control" required>
                                                        <option value="passed">Bestanden</option>
                                                        <option value="failed">Nicht bestanden</option>
                                                        <option value="pending">Ausstehend</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label>Schüler</label>
                                                <div style="position:relative;">
                                                    <input type="text" v-model="examEditForm.studentQuery" class="form-control" placeholder="Schüler suchen...">
                                                    <div v-if="examEditForm.studentQuery && studentMatches(examEditForm.studentQuery).length" class="form-container" style="position:absolute; left:0; right:0; top:100%; margin-top:.25rem; padding:.5rem 0; z-index:1000; max-height:180px; overflow:auto;">
                                                        <div v-for="u in studentMatches(examEditForm.studentQuery)" :key="u.id" style="padding:.4rem 1rem; cursor:pointer;" @click="selectStudentForExamEdit(u)">
                                                            {{ u.name }} <span style="color:#64748b;">(@{{ u.username }})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div v-if="examEditForm.studentName" style="margin-top:.25rem; color:#64748b; font-size:.9rem;">Ausgewählt: {{ examEditForm.studentName }}</div>
                                            </div>
                                            <div class="form-group">
                                                <label>Prüfer</label>
                                                <input type="text" v-model="examEditForm.instructor" class="form-control" required>
                                            </div>
                                            <div class="form-group">
                                                <label>Kommentar</label>
                                                <textarea v-model="examEditForm.comments" class="form-control" rows="3"></textarea>
                                            </div>
                                            <div style="display:flex; gap:.5rem; justify-content:flex-end;">
                                                <button type="button" class="btn btn-secondary" @click="closeExamEditModal">Abbrechen</button>
                                                <button type="submit" class="btn btn-primary">Speichern</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                                 <!-- Ziele -->
                 <div v-else-if="currentPage === 'goals'">
                     <div style="padding: 2rem 0;">
                         <div class="container">
                             <div class="page-header">
                                 <button @click="goToDashboard" class="back-btn">
                                     <i class="fas fa-arrow-left"></i>
                                     Zurück
                                 </button>
                                 <h1>{{ t('goals') }}</h1>
                             </div>
                            
                            <!-- Neues Ziel hinzufügen (nur für Schüler und Trainer, nicht für Admins) -->
                            <div v-if="currentUser && currentUser.role !== 'admin'" class="form-container">
                                <h2>Neues Ziel hinzufügen</h2>
                                <form @submit.prevent="addGoal">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Titel</label>
                                            <input type="text" v-model="goalForm.title" class="form-control" required>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label>Zieldatum</label>
                                            <input type="date" v-model="goalForm.targetDate" class="form-control" required>
                                        </div>
                                    </div>
                                    
                                    <div class="form-row">
                                        <div class="form-group" style="position: relative; z-index: 100;">
                                            <label>Kategorie</label>
                                            <select v-model="goalForm.category" class="form-control" required>
                                                <option value="">Kategorie wählen</option>
                                                <option value="Gürtelprüfung">Gürtelprüfung</option>
                                                <option value="Wettkampf">Wettkampf</option>
                                                <option value="Karriere">Karriere</option>
                                                <option value="Training">Training</option>
                                            </select>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label>Fortschritt (%)</label>
                                            <input type="number" v-model="goalForm.progress" class="form-control" min="0" max="100" required>
                                        </div>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary">
                                        Ziel hinzufügen
                                    </button>
                                </form>
                            </div>
                            
                            <!-- Ausstehende Ziele -->
                            <div class="form-container" style="margin-top: 1.5rem;">
                                <h2><i class="fas fa-clock" style="color: #f59e0b;"></i> Ausstehende Ziele</h2>
                                <div v-if="pendingGoals.length === 0" style="color: #64748b; padding: 1rem 0;">
                                    Keine ausstehenden Ziele vorhanden.
                                </div>
                                <div class="nav-grid" v-else>
                                    <div 
                                        v-for="goal in pendingGoals" 
                                        :key="goal.id" 
                                        class="nav-card"
                                        style="text-align: left; cursor: pointer;"
                                        @click="openGoalTasks(goal)"
                                    >
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                            <h3>{{ goal.title }}</h3>
                                            <button class="btn btn-danger btn-sm" @click.stop="deleteGoal(goal)" title="Ziel löschen" style="width: auto; padding: 0.25rem 0.5rem;">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <p v-if="currentUser && currentUser.role === 'admin'" style="color: #64748b; font-size: 0.85rem; margin-bottom: 0.5rem;">
                                            <i class="fas fa-user"></i> {{ goal.ownerName || 'Unbekannt' }} <span v-if="goal.ownerUsername">(@{{ goal.ownerUsername }})</span>
                                        </p>
                                        <p><strong>Kategorie:</strong> {{ goal.category }}</p>
                                        <p><strong>Zieldatum:</strong> {{ formatDate(goal.targetDate) }}</p>
                                        
                                        <div style="margin-top: 1rem;">
                                            <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                                                <div 
                                                    :style="{ 
                                                        background: '#3b82f6', 
                                                        width: Math.min(goal.progress, 100) + '%', 
                                                        height: '100%' 
                                                    }"
                                                ></div>
                                            </div>
                                            <p style="margin-top: 0.5rem; font-size: 0.9rem;">
                                                {{ goal.progress }}% abgeschlossen
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Erreichte Ziele -->
                            <div class="form-container" style="margin-top: 1.5rem;">
                                <h2><i class="fas fa-check-circle" style="color: #10b981;"></i> Erreichte Ziele</h2>
                                <div v-if="completedGoals.length === 0" style="color: #64748b; padding: 1rem 0;">
                                    Noch keine Ziele erreicht.
                                </div>
                                <div class="nav-grid" v-else>
                                    <div 
                                        v-for="goal in completedGoals" 
                                        :key="goal.id" 
                                        class="nav-card"
                                        style="text-align: left; border-left: 4px solid #10b981;"
                                    >
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                            <h3>{{ goal.title }}</h3>
                                            <button class="btn btn-danger btn-sm" @click="deleteGoal(goal)" title="Ziel löschen" style="width: auto; padding: 0.25rem 0.5rem;">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <p v-if="currentUser && currentUser.role === 'admin'" style="color: #64748b; font-size: 0.85rem; margin-bottom: 0.5rem;">
                                            <i class="fas fa-user"></i> {{ goal.ownerName || 'Unbekannt' }} <span v-if="goal.ownerUsername">(@{{ goal.ownerUsername }})</span>
                                        </p>
                                        <p><strong>Kategorie:</strong> {{ goal.category }}</p>
                                        <p><strong>Zieldatum:</strong> {{ formatDate(goal.targetDate) }}</p>
                                        <p><strong>Status:</strong> <span style="color: #10b981;"><i class="fas fa-check"></i> Erreicht</span></p>
                                        
                                        <div style="margin-top: 1rem;">
                                            <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                                                <div 
                                                    :style="{ 
                                                        background: '#10b981', 
                                                        width: '100%', 
                                                        height: '100%' 
                                                    }"
                                                ></div>
                                            </div>
                                            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #10b981;">
                                                <i class="fas fa-trophy"></i> 100% abgeschlossen
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Presets (nur Admin) -->
                <div v-else-if="currentPage === 'presets' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')">
                    <div style="padding: 2rem 0;">
                        <div class="container">
                            <div class="page-header">
                                <button @click="goToDashboard" class="back-btn">
                                    <i class="fas fa-arrow-left"></i>
                                    Zurück
                                </button>
                                <h1>Presets</h1>
                            </div>

                            <!-- Tab-Switcher -->
                            <div class="preset-tabs" role="tablist" aria-label="Presets Kategorien">
                                <button 
                                    class="tab-btn" 
                                    :class="{ active: currentPresetsTab === 'certificates' }" 
                                    role="tab" 
                                    :aria-selected="(currentPresetsTab === 'certificates').toString()" 
                                    aria-controls="tab-certificates" 
                                    @click="setPresetsTab('certificates')"
                                >Urkunden</button>
                                
                                <button 
                                    class="tab-btn" 
                                    :class="{ active: currentPresetsTab === 'groups' }" 
                                    role="tab" 
                                    :aria-selected="(currentPresetsTab === 'groups').toString()" 
                                    aria-controls="tab-groups" 
                                    @click="setPresetsTab('groups')"
                                >Gruppen</button>
                            </div>

                            <div v-show="currentPresetsTab === 'certificates'" id="tab-certificates" class="form-container" role="tabpanel">
                                <h2>Urkunden-Presets</h2>
                                <form @submit.prevent="addCertificatePreset">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Titel</label>
                                            <input type="text" v-model="certificatePresetForm.title" class="form-control" required>
                                        </div>
                                        <div class="form-group">
                                            <label>Art</label>
                                            <div class="choice-group" role="group" aria-label="Urkunden-Art wählen">
                                                <button type="button" class="choice-btn" :class="{ active: certificatePresetForm.type === 'belt_exam' }" @click="certificatePresetForm.type = 'belt_exam'" :aria-pressed="(certificatePresetForm.type === 'belt_exam').toString()">Gürtelprüfung</button>
                                                <button type="button" class="choice-btn" :class="{ active: certificatePresetForm.type === 'tournament' }" @click="certificatePresetForm.type = 'tournament'" :aria-pressed="(certificatePresetForm.type === 'tournament').toString()">Turnier</button>
                                                <button type="button" class="choice-btn" :class="{ active: certificatePresetForm.type === 'workshop' }" @click="certificatePresetForm.type = 'workshop'" :aria-pressed="(certificatePresetForm.type === 'workshop').toString()">Workshop</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Level</label>
                                            <input type="text" v-model="certificatePresetForm.level" class="form-control">
                                        </div>
                                        <div class="form-group">
                                            <label>Trainer/Prüfer</label>
                                            <input type="text" v-model="certificatePresetForm.instructor" class="form-control">
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-primary">Preset hinzufügen</button>
                                </form>

                                <h3 style="margin:1rem 0 .25rem; color:#1e293b;">Vorhandene Presets</h3>
                                <div class="certificates-grid" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
                                    <div v-for="p in certificatePresetsFiltered" :key="p.id" class="nav-card preset-card" style="text-align:left;">
                                        <h3>{{ p.title }}</h3>
                                        <p><strong>Art:</strong> {{ p.type }}</p>
                                        <p v-if="p.level"><strong>Level:</strong> {{ p.level }}</p>
                                        <p v-if="p.instructor"><strong>Trainer/Prüfer:</strong> {{ p.instructor }}</p>
                                        <div style="margin-top:.5rem; display:flex; gap:.5rem;">
                                            <button class="icon-btn" @click="editCertificatePreset(p)" aria-label="Preset bearbeiten"><i class="fas fa-pen"></i></button>
                                            <button class="icon-btn" @click="removeCertificatePreset(p)" aria-label="Preset löschen"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-show="currentPresetsTab === 'groups'" id="tab-groups" class="form-container" role="tabpanel">
                                <h2>Gruppen verwalten</h2>
                                <form @submit.prevent="addStudentGroup()">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Gruppenname</label>
                                            <input type="text" v-model="groupForm.name" class="form-control" placeholder="z. B. Prüfungsgruppe Mai" required>
                                        </div>
                                        <div class="form-group">
                                            <label>Beschreibung</label>
                                            <input type="text" v-model="groupForm.description" class="form-control" placeholder="Optionale Beschreibung">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Schüler zuordnen</label>
                                        <div style="position:relative;">
                                            <input type="text" v-model="groupForm.query" class="form-control" placeholder="Schüler suchen..." @keydown.enter.prevent>
                                            <div v-if="groupForm.query" class="form-container" style="margin-top:.5rem; padding:.35rem .75rem; max-height:260px; overflow:auto;">
                                                <div v-for="u in studentMatches(groupForm.query)" :key="u.id" style="padding:.3rem 0; cursor:pointer;" @click="tapSelectGroupStudent(u)">
                                                    {{ u.name }} <span style="color:#64748b;">(@{{ u.username }})</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="groupForm.userIds.length" style="margin-top:.35rem; display:flex; flex-wrap:wrap; gap:.35rem;">
                                            <span v-for="sid in groupForm.userIds" :key="sid" class="btn btn-secondary btn-sm" style="cursor:default;">
                                                {{ displayUserName(sid) }}
                                                <button type="button" class="btn btn-danger btn-sm" style="margin-left:.35rem;" @click="removeGroupStudent(sid)"><i class="fas fa-times"></i></button>
                                            </span>
                                        </div>
                                    </div>
                                    <div style="margin-top:.75rem; display:flex; gap:.5rem;">
                                        <button type="submit" class="btn btn-primary">Gruppe erstellen</button>
                                        <button type="button" class="btn btn-secondary" @click="resetGroupForm()">Zurücksetzen</button>
                                    </div>
                                </form>

                                <h3 style="margin:1.5rem 0 .5rem; color:#1e293b;">Vorhandene Gruppen</h3>
                                <div v-if="studentGroups.length === 0" style="color:#64748b;">Noch keine Gruppen erstellt.</div>
                                <div class="certificates-grid" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
                                    <div v-for="g in studentGroups" :key="g.id" class="nav-card preset-card" style="text-align:left;">
                                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                            <div>
                                                <h4 style="margin:0;">{{ g.name }}</h4>
                                                <p v-if="g.description" style="color:#475569; margin:.15rem 0; font-size:.9rem;">{{ g.description }}</p>
                                                <p style="color:#64748b; margin:.25rem 0;">{{ g.member_count || g.userIds.length }} Mitglieder</p>
                                            </div>
                                            <div style="display:flex; gap:.35rem;">
                                                <button class="icon-btn" @click="showGroupMembers(g)" title="Mitglieder anzeigen"><i class="fas fa-users"></i></button>
                                                <button class="icon-btn" @click="editGroup(g)" title="Bearbeiten"><i class="fas fa-pen"></i></button>
                                                <button class="icon-btn" @click="removeGroup(g)" title="Löschen"><i class="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                        <div v-if="g._showMembers" style="margin-top:.5rem; padding:.5rem; background:#f8fafc; border-radius:6px; max-height:150px; overflow:auto;">
                                            <div v-if="getGroupMemberNames(g).length === 0" style="color:#64748b; font-size:.85rem;">Keine Mitglieder</div>
                                            <div v-for="name in getGroupMemberNames(g)" :key="name" style="font-size:.85rem; padding:.15rem 0;">• {{ name }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <!-- Kurse -->
                <div v-else-if="currentPage === 'courses'">
                    <div style="padding: 2rem 0;">
                        <div class="container">
                            <div class="page-header">
                                <button @click="goToDashboard" class="back-btn">
                                    <i class="fas fa-arrow-left"></i>
                                    Zurück
                                </button>
                                <h1>{{ t('courses') }}</h1>
                            </div>

                            <!-- Admin/Trainer Ansicht -->
                            <div v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')">
                                <div class="form-container">
                                    <h2>{{ t('addCourse') }}</h2>
                                    <form @submit.prevent="submitCourse">
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>{{ t('courseTitle') }} *</label>
                                                <input type="text" v-model="courseForm.title" class="form-control" required>
                                            </div>
                                            <div class="form-group">
                                                <label>{{ t('courseDate') }} *</label>
                                                <input type="date" v-model="courseForm.date" class="form-control" required>
                                            </div>
                                        </div>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>{{ t('courseInstructor') }} *</label>
                                                <input type="text" v-model="courseForm.instructor" class="form-control" required>
                                            </div>
                                            <div class="form-group">
                                                <label>Dauer *</label>
                                                <input type="text" v-model="courseForm.duration" class="form-control" placeholder="z.B. 2 Stunden" required>
                                            </div>
                                        </div>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label>Max. Teilnehmer *</label>
                                                <input type="number" v-model.number="courseForm.max_participants" class="form-control" min="1" required>
                                            </div>
                                            <div class="form-group">
                                                <label>Preis *</label>
                                                <input type="text" v-model="courseForm.price" class="form-control" placeholder="z.B. 25€ oder Gratis" required>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label>{{ t('courseDescription') }}</label>
                                            <textarea v-model="courseForm.description" class="form-control" rows="3"></textarea>
                                        </div>
                                        <div class="form-group">
                                            <label>Schüler zuordnen (optional)</label>
                                            <div style="position:relative;">
                                                <input type="text" v-model="courseForm.studentQuery" class="form-control" placeholder="Gruppe oder Schüler suchen" @keydown.enter.prevent>
                                                <div v-if="courseForm.studentQuery" class="form-container" style="margin-top:.5rem; padding:.35rem .75rem; max-height:260px; overflow:auto;">
                                                    <div v-for="g in groupMatches(courseForm.studentQuery)" :key="'g_'+g.id" style="padding:.4rem 0; cursor:pointer; font-weight:600;" @click="applyGroupObjectTo('course', g)">
                                                        {{ g.name }} <span style="color:#64748b; font-weight:500;">(Gruppe)</span>
                                                    </div>
                                                    <div v-for="u in studentMatches(courseForm.studentQuery)" :key="u.id" style="padding:.3rem 0; cursor:pointer;" @click="tapSelectStudent('course', u)">
                                                        {{ u.name }} <span style="color:#64748b;">(@{{ u.username }})</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div v-if="courseForm.userIds.length" style="margin-top:.35rem; display:flex; flex-wrap:wrap; gap:.35rem;">
                                                <span v-for="sid in courseForm.userIds" :key="sid" class="btn btn-secondary btn-sm" style="cursor:default;">
                                                    {{ displayUserName(sid) }}
                                                    <button type="button" class="btn btn-danger btn-sm" style="margin-left:.35rem;" @click="removeSelected('course', sid)"><i class="fas fa-times"></i></button>
                                                </span>
                                            </div>
                                        </div>
                                        <button type="submit" class="btn btn-primary">{{ t('addCourse') }}</button>
                                    </form>
                                </div>

                                <div class="form-container">
                                    <h2>Alle Kurse</h2>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>{{ t('search') }}</label>
                                            <input type="text" v-model="courseSearch" class="form-control" placeholder="Titel/Trainer/Beschreibung">
                                        </div>
                                        <div class="form-group" style="align-self:end;">
                                            <button class="btn btn-secondary" @click="clearCourseSearch">{{ t('clearFilter') }}</button>
                                        </div>
                                    </div>
                                    <div class="certificates-grid" style="grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));">
                                        <div v-for="c in filteredCourses" :key="c.id" class="certificate-card" style="text-align:left;">
                                            <h4>{{ c.title }}</h4>
                                            <p><strong>{{ t('courseDate') }}:</strong> {{ formatDate(c.date) }}</p>
                                            <p><strong>{{ t('courseInstructor') }}:</strong> {{ c.instructor }}</p>
                                            <p><strong>Dauer:</strong> {{ c.duration || '—' }}</p>
                                            <p><strong>Teilnehmer:</strong> {{ c.current_participants || 0 }} / {{ c.max_participants }} <span style="color:#64748b;">({{ c.free_spots || c.max_participants }} frei)</span></p>
                                            <p><strong>Preis:</strong> {{ c.price || 'Gratis' }}</p>
                                            <p v-if="c.description" style="color:#64748b; font-size:0.9rem;">{{ c.description }}</p>
                                            <div style="margin-top:.75rem; display:flex; gap:.5rem; flex-wrap:wrap;">
                                                <button class="btn btn-secondary btn-sm" @click="showParticipants(c)" title="Teilnehmer anzeigen">
                                                    <i class="fas fa-users"></i> Teilnehmer
                                                </button>
                                                <button class="btn btn-secondary btn-sm" @click="editCourse(c)" title="Bearbeiten">
                                                    <i class="fas fa-pen"></i>
                                                </button>
                                                <button class="btn btn-danger btn-sm" @click="removeCourse(c)" title="Löschen">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Schüler Ansicht -->
                            <div v-else>
                                <h2 style="margin-bottom:1rem;">Anstehende Kurse</h2>
                                <div class="certificates-grid" style="grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));">
                                    <div v-for="c in upcomingCourses" :key="c.id" class="certificate-card" 
                                         :style="{ textAlign: 'left', borderLeft: c.booking_status === 'confirmed' ? '4px solid #22c55e' : '' }">
                                        <div v-if="c.booking_status === 'confirmed'" style="background:#22c55e; color:white; padding:.25rem .5rem; border-radius:4px; font-size:0.8rem; display:inline-block; margin-bottom:.5rem;">
                                            <i class="fas fa-check"></i> Angemeldet
                                        </div>
                                        <h4>{{ c.title }}</h4>
                                        <p><strong>{{ t('courseDate') }}:</strong> {{ formatDate(c.date) }}</p>
                                        <p><strong>{{ t('courseInstructor') }}:</strong> {{ c.instructor }}</p>
                                        <p><strong>Dauer:</strong> {{ c.duration || '—' }}</p>
                                        <p><strong>Freie Plätze:</strong> {{ c.free_spots }} / {{ c.max_participants }}</p>
                                        <p><strong>Preis:</strong> {{ c.price || 'Gratis' }}</p>
                                        <p v-if="c.description" style="color:#64748b; font-size:0.9rem;">{{ c.description }}</p>
                                        <div style="margin-top:.75rem;">
                                            <button v-if="!c.booking_status" class="btn btn-primary" @click="bookCourse(c)" :disabled="c.free_spots <= 0">
                                                <i class="fas fa-plus"></i> Anmelden
                                            </button>
                                            <button v-else-if="c.booking_status === 'confirmed' && canCancelBooking(c)" class="btn btn-danger" @click="cancelBooking(c)">
                                                <i class="fas fa-times"></i> Abmelden
                                            </button>
                                            <span v-else-if="c.booking_status === 'confirmed'" style="color:#64748b; font-size:0.85rem;">
                                                <i class="fas fa-info-circle"></i> Abmeldung nicht mehr möglich
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p v-if="upcomingCourses.length === 0" style="color:#64748b;">Keine anstehenden Kurse verfügbar.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Kurs bearbeiten Modal -->
                <div v-if="showCourseEditModal" class="modal-overlay" @click.self="showCourseEditModal = false">
                    <div class="modal-content form-container" style="max-width:500px;">
                        <h2>Kurs bearbeiten</h2>
                        <form @submit.prevent="saveCourseEdit">
                            <div class="form-group">
                                <label>Titel</label>
                                <input type="text" v-model="courseEditForm.title" class="form-control" required>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Datum</label>
                                    <input type="date" v-model="courseEditForm.date" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Trainer</label>
                                    <input type="text" v-model="courseEditForm.instructor" class="form-control" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Dauer</label>
                                    <input type="text" v-model="courseEditForm.duration" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Max. Teilnehmer</label>
                                    <input type="number" v-model.number="courseEditForm.max_participants" class="form-control" min="1">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Preis</label>
                                <input type="text" v-model="courseEditForm.price" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Beschreibung</label>
                                <textarea v-model="courseEditForm.description" class="form-control" rows="3"></textarea>
                            </div>
                            <div style="display:flex; gap:.5rem; margin-top:1rem;">
                                <button type="submit" class="btn btn-primary">Speichern</button>
                                <button type="button" class="btn btn-secondary" @click="showCourseEditModal = false">Abbrechen</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Teilnehmer Modal -->
                <div v-if="showParticipantsModal" class="modal-overlay" @click.self="showParticipantsModal = false">
                    <div class="modal-content form-container" style="max-width:500px;">
                        <h2><i class="fas fa-users"></i> Teilnehmer</h2>
                        <p v-if="participantsModalCourse" style="color:#64748b; margin-bottom:1rem;">{{ participantsModalCourse.title }}</p>
                        <div v-if="participantsList.length === 0" style="color:#64748b;">
                            Keine Teilnehmer angemeldet.
                        </div>
                        <div v-else>
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:2px solid #e2e8f0;">
                                        <th style="text-align:left; padding:.5rem;">Name</th>
                                        <th style="text-align:left; padding:.5rem;">Angemeldet am</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="p in participantsList" :key="p.id" style="border-bottom:1px solid #e2e8f0;">
                                        <td style="padding:.5rem;">{{ p.name }} <span style="color:#64748b;">(@{{ p.username }})</span></td>
                                        <td style="padding:.5rem;">{{ formatDateTime(p.booking_date) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div style="margin-top:1rem;">
                            <button class="btn btn-secondary" @click="showParticipantsModal = false">Schließen</button>
                        </div>
                    </div>
                </div>

                <!-- Ziel-Aufgaben Modal -->
                <div v-if="showGoalTasksModal" class="modal-overlay" @click.self="showGoalTasksModal = false">
                    <div class="modal-content form-container" style="max-width:500px;">
                        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h2><i class="fas fa-tasks" style="color: #3b82f6;"></i> Aufgaben</h2>
                            <button @click="showGoalTasksModal = false" class="close-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <p v-if="goalTasksModalGoal" style="color:#64748b; margin-bottom:1rem;">
                            <strong>{{ goalTasksModalGoal.title }}</strong> - {{ goalTasksModalGoal.category }}
                        </p>
                        <div v-if="goalTasks.length === 0" style="color:#64748b; padding: 1rem 0;">
                            Keine Aufgaben für dieses Ziel definiert.
                        </div>
                        <div v-else>
                            <div v-for="(task, index) in goalTasks" :key="index" 
                                 style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid #e2e8f0; cursor: pointer;"
                                 @click="toggleGoalTask(index)">
                                <div :style="{
                                    width: '24px', height: '24px', borderRadius: '6px', 
                                    border: task.completed ? 'none' : '2px solid #cbd5e1',
                                    background: task.completed ? '#10b981' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }">
                                    <i v-if="task.completed" class="fas fa-check" style="color: white; font-size: 0.75rem;"></i>
                                </div>
                                <span :style="{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#94a3b8' : '#1e293b' }">
                                    {{ task.title }}
                                </span>
                            </div>
                        </div>
                        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span style="font-weight: 600;">Fortschritt:</span>
                                <span style="color: #3b82f6; font-weight: 600;">{{ calculateGoalProgress() }}%</span>
                            </div>
                            <div style="background: #e5e7eb; height: 10px; border-radius: 5px; overflow: hidden;">
                                <div :style="{ background: calculateGoalProgress() >= 100 ? '#10b981' : '#3b82f6', width: calculateGoalProgress() + '%', height: '100%', transition: 'width 0.3s ease' }"></div>
                            </div>
                        </div>
                        <div style="margin-top:1rem; display: flex; gap: 0.5rem;">
                            <button class="btn btn-primary" @click="saveGoalTasks">Speichern</button>
                            <button class="btn btn-secondary" @click="showGoalTasksModal = false">Abbrechen</button>
                        </div>
                    </div>
                </div>

                <!-- Admin-Bereich -->
                <div v-else-if="currentPage === 'admin' && currentUser && currentUser.role === 'admin'">
                    <div style="padding: 2rem 0;">
                        <div class="container">
                            <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <button @click="goToDashboard" class="back-btn">
                                        <i class="fas fa-arrow-left"></i>
                                        Zurück
                                    </button>
                                    <h1 style="margin: 0;">{{ t('adminPanel') }}</h1>
                                </div>
                                <button @click="showCreateUserModal = true" class="btn btn-primary" style="width: auto;">
                                    <i class="fas fa-user-plus"></i> Benutzer anlegen
                                </button>
                            </div>

                            <div class="form-container">
                                <h2>{{ t('users') }}</h2>
                                <div class="form-group">
                                    <label>{{ t('search') }}</label>
                                    <input type="text" v-model="adminSearch" class="form-control" placeholder="Benutzer suchen (Name, Benutzername, E-Mail)">
                                </div>

                                <div class="certificates-grid" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
                                    <div v-for="user in adminFilteredUsers" :key="user.id" class="nav-card admin-user-card collapsible" :class="{ open: user._open }" style="text-align: left;">
                                        <div class="collapsible-header" @click.stop="toggleUserCard(user)">
                                            <div class="role-emoji" aria-hidden="true">{{ roleEmoji(user.role) }}</div>
                                            <div class="header-text">
                                                <div class="name">{{ user.name }}</div>
                                                <div class="subtitle">{{ roleLabel(user.role) }}</div>
                                            </div>
                                            <div class="caret" :class="{ open: user._open }"><i class="fas fa-chevron-down"></i></div>
                                        </div>
                                        <transition name="collapse">
                                            <div v-if="user._open" class="collapsible-body" @click.stop>
                                                <p><strong>Benutzername:</strong> {{ user.username }}</p>
                                                <p><strong>E-Mail:</strong> {{ user.email }}</p>
                                                <p><strong>{{ t('phone') }}:</strong> {{ user.phone || '-' }}</p>
                                                <!-- Passkeys bewusst ausgeblendet -->
                                                <div class="form-group" style="margin-top: 0.5rem;">
                                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1f2937;"><strong>Rolle:</strong></label>
                                                    <select v-model="user.role" class="form-control">
                                                        <option value="schueler">Schüler</option>
                                                        <option value="trainer">Trainer</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </div>
                                                
                                                <!-- Passwort-Änderung -->
                                                <div class="form-group" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                                                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #1f2937;">
                                                        <i class="fas fa-key"></i> <strong>Passwort ändern:</strong>
                                                    </label>
                                                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                                        <input 
                                                            type="password" 
                                                            v-model="user._newPassword" 
                                                            class="form-control" 
                                                            placeholder="Neues Passwort"
                                                            style="flex: 1; min-width: 150px;"
                                                            @keyup.enter="changeUserPassword(user)"
                                                        >
                                                        <button 
                                                            class="btn btn-secondary btn-sm" 
                                                            @click="changeUserPassword(user)"
                                                            :disabled="!user._newPassword || user._newPassword.length < 3"
                                                            style="white-space: nowrap;"
                                                        >
                                                            <i class="fas fa-save"></i> Passwort ändern
                                                        </button>
                                                    </div>
                                                    <p v-if="user._passwordChanged" style="color: #10b981; font-size: 0.85rem; margin-top: 0.5rem;">
                                                        <i class="fas fa-check"></i> Passwort erfolgreich geändert
                                                    </p>
                                                </div>
                                                
                                                <div class="actions" style="margin-top: 1rem;">
                                                    <button class="btn btn-primary btn-sm" @click="saveUser(user)">{{ t('saveChanges') }}</button>
                                                    <button class="btn btn-danger btn-sm" @click="deleteUser(user)" aria-label="Benutzer löschen"><i class="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                        </transition>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal: Benutzer erstellen (nur Admin) -->
                <div v-if="showCreateUserModal" class="modal-overlay" @click.self="closeCreateUserModal">
                    <div class="modal-content form-container" style="max-width: 500px; max-height: 90vh; overflow-y: auto;" @click.stop>
                        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <h2><i class="fas fa-user-plus"></i> Benutzer anlegen</h2>
                            <button @click="closeCreateUserModal" class="close-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form @submit.prevent="createUser">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Vorname *</label>
                                    <input type="text" v-model="createUserForm.firstName" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Nachname *</label>
                                    <input type="text" v-model="createUserForm.lastName" class="form-control" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Benutzername *</label>
                                <input type="text" v-model="createUserForm.username" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>E-Mail *</label>
                                <input type="email" v-model="createUserForm.email" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Passwort *</label>
                                <input type="password" v-model="createUserForm.password" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Rolle *</label>
                                <select v-model="createUserForm.role" class="form-control" required>
                                    <option value="schueler">Schüler</option>
                                    <option value="trainer">Trainer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Schule (optional)</label>
                                <input type="text" v-model="createUserForm.school" class="form-control" placeholder="Kampfsport Akademie Berlin">
                            </div>
                            <div class="form-group">
                                <label>Gürtelgrad (optional)</label>
                                <input type="text" v-model="createUserForm.beltLevel" class="form-control" placeholder="z.B. Weißgurt">
                            </div>
                            <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                                <button type="submit" class="btn btn-primary">Benutzer erstellen</button>
                                <button type="button" class="btn btn-secondary" @click="closeCreateUserModal">Abbrechen</button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            
            <!-- Gruppen-Bearbeitungs-Modal -->
            <div v-if="showGroupEditModal" class="modal-overlay" @click="closeGroupEditModal">
                <div class="modal-content" @click.stop style="max-width: 550px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-users-cog"></i> Gruppe bearbeiten</h2>
                        <button @click="closeGroupEditModal" class="close-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <form @submit.prevent="saveGroupEdit">
                            <!-- Gruppenname -->
                            <div class="form-group">
                                <label>Gruppenname *</label>
                                <input type="text" v-model="groupEditForm.name" class="form-control" required>
                            </div>
                            
                            <!-- Beschreibung -->
                            <div class="form-group">
                                <label>Beschreibung</label>
                                <input type="text" v-model="groupEditForm.description" class="form-control" placeholder="Optionale Beschreibung">
                            </div>
                            
                            <!-- Mitglieder -->
                            <div class="form-group">
                                <label style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>Mitglieder</span>
                                    <button type="button" class="btn btn-success btn-sm" @click="groupEditForm.showAddMember = !groupEditForm.showAddMember">
                                        <i class="fas fa-plus"></i> Hinzufügen
                                    </button>
                                </label>
                                
                                <!-- Mitglied hinzufügen -->
                                <div v-if="groupEditForm.showAddMember" style="margin-top: 0.5rem; padding: 0.75rem; background: #f1f5f9; border-radius: 8px;">
                                    <input type="text" v-model="groupEditForm.memberQuery" class="form-control" placeholder="Schüler suchen..." @keydown.enter.prevent>
                                    <div v-if="groupEditForm.memberQuery && filteredStudentsForGroupEdit.length" style="margin-top: 0.5rem; max-height: 150px; overflow: auto; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
                                        <div v-for="u in filteredStudentsForGroupEdit" :key="u.id" style="padding: 0.5rem 0.75rem; cursor: pointer; border-bottom: 1px solid #f1f5f9;" @click="addMemberToGroupEdit(u)">
                                            {{ u.name }} <span style="color: #64748b;">(@{{ u.username }})</span>
                                        </div>
                                    </div>
                                    <div v-if="groupEditForm.memberQuery && !filteredStudentsForGroupEdit.length" style="margin-top: 0.5rem; color: #64748b; font-size: 0.9rem;">Keine Schüler gefunden</div>
                                </div>
                                
                                <!-- Mitglieder-Liste -->
                                <div style="margin-top: 0.5rem; max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                                    <div v-if="groupEditForm.members.length === 0" style="color: #64748b; text-align: center; padding: 1.5rem;">
                                        Keine Mitglieder
                                    </div>
                                    <div v-for="member in groupEditForm.members" :key="member.id" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9;">
                                        <span>{{ member.name }}</span>
                                        <button type="button" @click="removeMemberFromGroupEdit(member.id)" class="btn btn-danger btn-sm">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                                <button type="button" class="btn btn-secondary" @click="closeGroupEditModal">Abbrechen</button>
                                <button type="submit" class="btn btn-primary">Speichern</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Passkey-Verwaltungsmodal -->
            <div v-if="showPasskeyModal" class="modal-overlay" @click="closePasskeyModal">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h2><i class="fas fa-key"></i> Passkey-Verwaltung</h2>
                        <button @click="closePasskeyModal" class="close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="passkey-section">
                            <h3>Neuen Passkey registrieren</h3>
                            <p>Registrieren Sie einen neuen Passkey für schnelle und sichere Anmeldung.</p>
                            <button @click="registerPasskey" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Passkey hinzufügen
                            </button>
                        </div>
                        
                        <div class="passkey-section" v-if="getAvailablePasskeys().length > 0">
                            <h3>Registrierte Passkeys</h3>
                            <div class="passkey-list">
                                <div v-for="passkey in getAvailablePasskeys()" :key="passkey" class="passkey-item">
                                    <div class="passkey-info">
                                        <i class="fas fa-key"></i>
                                        <span>{{ passkey }}</span>
                                    </div>
                                    <button @click="removePasskey(passkey)" class="btn btn-danger btn-sm">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="passkey-section" v-else>
                            <p class="text-muted">Noch keine Passkeys registriert.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            // Authentifizierung
            isLoggedIn: false,
            currentUser: null,
            showRegister: false,
            showPassword: false,
            showPasskeyModal: false,
            showCreateUserModal: false,
            
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
            
            goalForm: {
                title: '',
                targetDate: '',
                category: '',
                progress: 0
            },
            
            // Daten
            certificates: [],
            exams: [],
            trainingHistory: [],
            specialCourses: [],
            goals: [],
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
                role: 'schueler',
                school: '',
                beltLevel: ''
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

            // Presets
            currentPresetsTab: 'certificates',
            certificatePresets: [],
            certificatePresetForm: { title: '', type: '', level: '', instructor: '' },
            // Gruppen (aus Datenbank)
            studentGroups: [],
            groupForm: { name: '', description: '', userIds: [], query: '' },
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
            // Ziel-Aufgaben Modal
            showGoalTasksModal: false,
            goalTasksModalGoal: null,
            goalTasks: []
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
        filteredCertificates() {
            const q = (this.certificateSearch || '').toLowerCase().trim();
            if (!q) return this.certificates;
            return this.certificates.filter(c =>
                (c.title || '').toLowerCase().includes(q) ||
                (c.instructor || '').toLowerCase().includes(q) ||
                (c.level || '').toLowerCase().includes(q)
            );
        },
        ownCertificates() {
            if (!this.currentUser) return [];
            return this.certificates.filter(c => String(c.userId || c.user_id) === String(this.currentUser.id));
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
            if (!q) return this.courses;
            return this.courses.filter(c =>
                (c.title || '').toLowerCase().includes(q) ||
                (c.instructor || '').toLowerCase().includes(q) ||
                (c.description || '').toLowerCase().includes(q)
            );
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
        }
    },
    
    methods: {
        groupMatches(query) {
            const q = (query || '').toLowerCase().trim();
            if (!q) return [];
            return this.studentGroups.filter(g => (g.name || '').toLowerCase().includes(q)).slice(0, 20);
        },
        displayUserName(userId) {
            const u = this.adminUserList.find(x => x.id === userId);
            return u ? (u.name || u.username || ('#'+userId)) : ('#'+userId);
        },
        tapSelectStudent(target, user) {
            if (target === 'cert') {
                if (!this.certificateForm.userIds.includes(user.id)) this.certificateForm.userIds.push(user.id);
                this.certificateForm.studentQuery = '';
            } else if (target === 'exam') {
                if (!this.examForm.userIds.includes(user.id)) this.examForm.userIds.push(user.id);
                this.examForm.studentQuery = '';
            } else if (target === 'course') {
                if (!this.courseForm.userIds.includes(user.id)) this.courseForm.userIds.push(user.id);
                this.courseForm.studentQuery = '';
            }
        },
        removeSelected(target, userId) {
            if (target === 'cert') this.certificateForm.userIds = this.certificateForm.userIds.filter(id => id !== userId);
            if (target === 'exam') this.examForm.userIds = this.examForm.userIds.filter(id => id !== userId);
            if (target === 'course') this.courseForm.userIds = this.courseForm.userIds.filter(id => id !== userId);
        },
        applyGroupObjectTo(target, group) {
            const setIds = new Set(target === 'cert' ? this.certificateForm.userIds : target === 'exam' ? this.examForm.userIds : this.courseForm.userIds);
            for (const id of group.userIds) setIds.add(id);
            if (target === 'cert') {
                this.certificateForm.userIds = Array.from(setIds);
                this.certificateForm.studentQuery = '';
            } else if (target === 'exam') {
                this.examForm.userIds = Array.from(setIds);
                this.examForm.studentQuery = '';
            } else {
                this.courseForm.userIds = Array.from(setIds);
                this.courseForm.studentQuery = '';
            }
        },
        studentMatches(query) {
            const qRaw = (query || '').toLowerCase();
            const q = qRaw.trim();
            const students = this.adminUserList.filter(u => (u.role === 'schueler'));
            if (!q) return [];
            return students.filter(u => {
                const first = (u.firstName || (u.name || '').split(' ')[0] || '').toLowerCase();
                const last = (u.lastName || (u.name || '').split(' ')[1] || '').toLowerCase();
                const full = (u.name || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase();
                const compact = (first + last).replace(/\s+/g, '');
                const qCompact = q.replace(/\s+/g, '');
                return first.startsWith(q) || last.startsWith(q) || full.startsWith(q) || compact.startsWith(qCompact);
            }).slice(0, 50);
        },
        toggleCertStudent(user) {
            const exists = this.certificateForm.userIds.includes(user.id);
            if (exists) {
                this.certificateForm.userIds = this.certificateForm.userIds.filter(id => id !== user.id);
            } else {
                this.certificateForm.userIds = [...this.certificateForm.userIds, user.id];
            }
        },
        toggleAllCertStudents(evt) {
            const list = this.studentMatches(this.certificateForm.studentQuery || ' ');
            if (evt.target.checked) {
                const ids = new Set(this.certificateForm.userIds);
                for (const u of list) ids.add(u.id);
                this.certificateForm.userIds = Array.from(ids);
            } else {
                const ids = new Set(list.map(u => u.id));
                this.certificateForm.userIds = this.certificateForm.userIds.filter(id => !ids.has(id));
            }
        },
        toggleExamStudent(user) {
            const exists = this.examForm.userIds.includes(user.id);
            this.examForm.userIds = exists
                ? this.examForm.userIds.filter(id => id !== user.id)
                : [...this.examForm.userIds, user.id];
        },
        toggleAllExamStudents(evt) {
            const list = this.studentMatches(this.examForm.studentQuery || ' ');
            if (evt.target.checked) {
                const ids = new Set(this.examForm.userIds);
                for (const u of list) ids.add(u.id);
                this.examForm.userIds = Array.from(ids);
            } else {
                const ids = new Set(list.map(u => u.id));
                this.examForm.userIds = this.examForm.userIds.filter(id => !ids.has(id));
            }
        },
        toggleCourseStudent(user) {
            const exists = this.courseForm.userIds.includes(user.id);
            this.courseForm.userIds = exists
                ? this.courseForm.userIds.filter(id => id !== user.id)
                : [...this.courseForm.userIds, user.id];
        },
        toggleAllCourseStudents(evt) {
            const list = this.studentMatches(this.courseForm.studentQuery || ' ');
            if (evt.target.checked) {
                const ids = new Set(this.courseForm.userIds);
                for (const u of list) ids.add(u.id);
                this.courseForm.userIds = Array.from(ids);
            } else {
                const ids = new Set(list.map(u => u.id));
                this.courseForm.userIds = this.courseForm.userIds.filter(id => !ids.has(id));
            }
        },
        roleEmoji(role) {
            if (role === 'admin') return '🛡️';
            if (role === 'trainer') return '👨‍🏫';
            return '👤';
        },
        roleLabel(role) {
            if (role === 'admin') return 'Admin';
            if (role === 'trainer') return 'Trainer';
            return 'Schüler';
        },
        // Navigation
        navigateTo(page) {
            this.currentPage = page;
            this.loadPageData();
        },
        
        goToDashboard() {
            this.currentPage = 'dashboard';
        },
        
        // Authentifizierung
        async handleLogin() {
            try {
                const response = await apiService.login(this.authForm);
                if (response.success) {
                    this.isLoggedIn = true;
                    this.currentUser = response.user;
                    
                    // User-Daten in localStorage speichern für API-Requests
                    persistAuthState(response.user);
                    
                    if (this.authForm.stayLoggedIn) {
                        cacheUsername(this.authForm.username);
                    }
                    
                    this.authForm = {
                        username: '',
                        email: '',
                        password: '',
                        role: '',
                        stayLoggedIn: false,
                        phone: '' // Zurücksetzen des Telefonfelds
                    };
                } else {
                    await notify.alert(response.error || 'Login fehlgeschlagen');
                }
            } catch (error) {
                console.error('Login error:', error);
                await notify.alert('Login fehlgeschlagen');
            }
        },
        
        async handleRegister() {
            try {
                if (!this.validateEmail() || !this.validatePhone()) {
                    await notify.alert(this.validateEmail() ? this.t('phoneInvalid') : this.t('emailInvalid'));
                    return;
                }
                const payload = { ...this.authForm, role: 'schueler' };
                const response = await apiService.register(payload);
                if (response.success) {
                    await notify.alert('Registrierung erfolgreich! Sie können sich jetzt anmelden.');
                    this.showRegister = false;
                    this.authForm = {
                        username: '',
                        email: '',
                        password: '',
                        role: 'schueler',
                        stayLoggedIn: false,
                        phone: '',
                        firstName: '',
                        lastName: ''
                    };
                }
            } catch (error) {
                console.error('Register error:', error);
                await notify.alert('Registrierung fehlgeschlagen');
            }
        },
        
        logout() {
            clearUsernameCache();
            clearAuthState();

            if (typeof window.navigateWithTransition === 'function') {
                window.navigateWithTransition('simple.html');
            } else {
                const overlay = document.createElement('div');
                overlay.id = 'page-transition';
                overlay.className = 'page-transition show';
                document.body.appendChild(overlay);
                setTimeout(()=> { window.location.href = 'simple.html'; }, 280);
            }
        },
        
        // Passkey-Verwaltung anzeigen
        showPasskeyManagement() {
            this.showPasskeyModal = true;
        },
        
        // Passkey-Modal schließen
        closePasskeyModal() {
            this.showPasskeyModal = false;
        },
        
        // Passkey registrieren
        async registerPasskey() {
            if (!window.passkeyManager) {
                alert('PasskeyManager nicht verfügbar. Bitte laden Sie die Seite neu.');
                return;
            }
            
            try {
                const username = this.currentUser.username;
                const result = await window.passkeyManager.registerPasskey(username);
                
                if (result.success) {
                    alert('Passkey erfolgreich registriert!');
                    this.closePasskeyModal();
                } else {
                    throw new Error('Passkey-Registrierung fehlgeschlagen');
                }
                
            } catch (error) {
                console.error('Passkey-Registrierung fehlgeschlagen:', error);
                alert('Passkey-Registrierung fehlgeschlagen: ' + error.message);
            }
        },
        
        // Passkey entfernen
        async removePasskey(passkeyId) {
            const ok = await notify.confirm('Passkey wirklich entfernen?');
            if (!ok) return;

            try {
                const username = this.currentUser.username;
                window.passkeyManager.removePasskey(username);
                alert('Passkey erfolgreich entfernt!');
            } catch (error) {
                console.error('Passkey-Entfernung fehlgeschlagen:', error);
                alert('Passkey-Entfernung fehlgeschlagen: ' + error.message);
            }
        },
        
        // Verfügbare Passkeys abrufen
        getAvailablePasskeys() {
            if (!window.passkeyManager) return [];
            return window.passkeyManager.listPasskeys();
        },
        
        togglePassword() {
            this.showPassword = !this.showPassword;
        },
        
                 // Sprache (nur Deutsch)
         setLanguage(lang) {
             this.currentLanguage = 'de'; // Immer Deutsch
             persistLanguage('de');
         },
        
        // Datei-Upload entfernt
        
        // Urkunden
        async uploadCertificate() {
            try {
                const targetIds = (this.certificateForm.userIds && this.certificateForm.userIds.length)
                    ? this.certificateForm.userIds
                    : (this.certificateForm.userId ? [this.certificateForm.userId] : []);
                if (!targetIds.length) return alert('Bitte mindestens einen Schüler auswählen.');
                // Demo: je Schüler eine Urkunde anlegen
                for (const uid of targetIds) {
                    await apiService.uploadCertificate({ ...this.certificateForm, userId: uid });
                }
                const response = { success: true };
                if (response.success) {
                    alert('Urkunde erfolgreich hochgeladen!');
                    this.certificateForm = {
                        title: '',
                        type: '',
                        date: '',
                        level: '',
                        instructor: '',
                        file: null,
                        userId: null,
                        userIds: [],
                        studentQuery: '',
                        selectedStudents: []
                    };
                    this.loadCertificates();
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('Upload fehlgeschlagen');
            }
        },
        
        async loadCertificates() {
            try {
                this.certificates = await apiService.getCertificates();
            } catch (error) {
                console.error('Load certificates error:', error);
            }
        },
        
        // Prüfungen
        async addExam() {
            try {
                // Prüfe ob Datum in der Zukunft liegt
                if (this.examForm.date) {
                    // Parse als lokales Datum (YYYY-MM-DD)
                    const parts = this.examForm.date.split('-');
                    const examDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    examDate.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (examDate > today) {
                        alert('Das Prüfungsdatum darf nicht in der Zukunft liegen.');
                        return;
                    }
                }
                const targetIds = (this.examForm.userIds && this.examForm.userIds.length)
                    ? this.examForm.userIds
                    : (this.examForm.userId ? [this.examForm.userId] : []);
                if (!targetIds.length) return alert('Bitte mindestens einen Schüler auswählen.');
                for (const uid of targetIds) {
                    await apiService.addExam({ ...this.examForm, userId: uid });
                }
                const response = { success: true };
                if (response.success) {
                    alert('Prüfung erfolgreich eingetragen!');
                    this.examForm = {
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
                    this.loadExams();
                }
            } catch (error) {
                console.error('Add exam error:', error);
                alert('Prüfungseintrag fehlgeschlagen');
            }
        },
        
        async loadExams() {
            try {
                const uid = (this.currentUser && this.currentUser.role === 'schueler') ? this.currentUser.id : null;
                this.exams = await apiService.getExams(uid);
            } catch (error) {
                console.error('Load exams error:', error);
            }
        },
        clearCertificateSearch() {
            this.certificateSearch = '';
        },
        clearExamSearch() {
            this.examSearch = '';
        },
        editCertificate(cert) {
            alert('Bearbeiten (Platzhalter): ' + cert.title);
        },
        async deleteCertificate(cert) {
            const ok = await notify.confirm('Diese Urkunde löschen?');
            if (ok) {
                this.certificates = this.certificates.filter(c => c.id !== cert.id);
            }
        },
        editExam(exam) {
            this.examEditForm = {
                id: exam.id,
                date: exam.date,
                level: exam.level,
                category: exam.category,
                instructor: exam.instructor,
                comments: exam.comments || '',
                status: exam.status || 'passed',
                userId: exam.userId || exam.user_id,
                studentName: exam.studentName || '',
                studentQuery: ''
            };
            this.showExamEditModal = true;
        },
        closeExamEditModal() {
            this.showExamEditModal = false;
        },
        selectStudentForExamEdit(user) {
            this.examEditForm.userId = user.id;
            this.examEditForm.studentName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
            this.examEditForm.studentQuery = '';
        },
        async saveExamEdit() {
            try {
                // Prüfe ob Datum in der Zukunft liegt
                if (this.examEditForm.date) {
                    // Parse als lokales Datum (YYYY-MM-DD)
                    const parts = this.examEditForm.date.split('-');
                    const examDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    examDate.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (examDate > today) {
                        alert('Das Prüfungsdatum darf nicht in der Zukunft liegen.');
                        return;
                    }
                }
                const res = await apiService.updateExam({
                    id: this.examEditForm.id,
                    userId: this.examEditForm.userId,
                    date: this.examEditForm.date,
                    level: this.examEditForm.level,
                    category: this.examEditForm.category,
                    instructor: this.examEditForm.instructor,
                    comments: this.examEditForm.comments,
                    status: this.examEditForm.status
                });
                if (res.success) {
                    alert('Prüfung erfolgreich aktualisiert!');
                    this.showExamEditModal = false;
                    await this.loadExams();
                } else {
                    alert('Fehler beim Speichern: ' + (res.error || 'Unbekannter Fehler'));
                }
            } catch (e) {
                console.error('Update exam error:', e);
                alert('Fehler beim Speichern der Prüfung');
            }
        },
        async deleteExam(exam) {
            const ok = await notify.confirm('Diesen Prüfungseintrag wirklich löschen?');
            if (!ok) return;
            try {
                const res = await apiService.deleteExam(exam.id);
                if (res.success) {
                    this.exams = this.exams.filter(e => e.id !== exam.id);
                } else {
                    alert('Fehler beim Löschen');
                }
            } catch (e) {
                console.error('Delete exam error:', e);
                alert('Fehler beim Löschen');
            }
        },
        // Deutsches Datum (31.12.2025) zu ISO (2025-12-31) konvertieren
        toISODate(dateStr) {
            if (!dateStr) return '';
            // Bereits im ISO-Format?
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
            // Deutsches Format: DD.MM.YYYY
            const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
            if (match) {
                const day = match[1].padStart(2, '0');
                const month = match[2].padStart(2, '0');
                const year = match[3];
                return `${year}-${month}-${day}`;
            }
            return dateStr;
        },
        // Datum formatieren: 2025-12-26 -> 26. Dez. 2025
        formatDate(dateStr) {
            if (!dateStr || dateStr === '0000-00-00') return 'Kein Datum';
            try {
                const months = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const year = parts[0];
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    // Ungültiges Datum abfangen
                    if (year === '0000' || month < 0 || month > 11 || day < 1 || day > 31) {
                        return 'Kein Datum';
                    }
                    return `${day}. ${months[month]} ${year}`;
                }
                return dateStr;
            } catch (e) {
                return dateStr;
            }
        },
        
        // Ziele
        async addGoal() {
            try {
                const response = await apiService.addGoal(this.goalForm);
                if (response.success) {
                    alert('Ziel erfolgreich hinzugefügt!');
                    this.goalForm = {
                        title: '',
                        targetDate: '',
                        category: '',
                        progress: 0
                    };
                    this.loadGoals();
                }
            } catch (error) {
                console.error('Add goal error:', error);
                alert('Ziel hinzufügen fehlgeschlagen');
            }
        },
        
        async deleteGoal(goal) {
            const ok = await notify.confirm('Dieses Ziel wirklich löschen?');
            if (!ok) return;
            try {
                const res = await apiService.deleteGoal(goal.id);
                if (res.success) {
                    this.goals = this.goals.filter(g => g.id !== goal.id);
                } else {
                    alert('Fehler beim Löschen: ' + (res.error || 'Unbekannt'));
                }
            } catch (e) {
                console.error('Delete goal error:', e);
                alert('Fehler beim Löschen des Ziels');
            }
        },
        
        // Ziel-Aufgaben Modal öffnen
        openGoalTasks(goal) {
            this.goalTasksModalGoal = goal;
            // Lade gespeicherte Aufgaben aus localStorage oder erstelle leere Liste
            const savedTasks = localStorage.getItem(`fightlog_goal_tasks_${goal.id}`);
            if (savedTasks) {
                this.goalTasks = JSON.parse(savedTasks);
            } else {
                // Leere Aufgabenliste - wird später mit konkreten Aufgaben gefüllt
                this.goalTasks = [];
            }
            this.showGoalTasksModal = true;
        },
        
        // Aufgabe toggle
        toggleGoalTask(index) {
            this.goalTasks[index].completed = !this.goalTasks[index].completed;
        },
        
        // Fortschritt berechnen basierend auf erledigten Aufgaben
        calculateGoalProgress() {
            if (!this.goalTasks || this.goalTasks.length === 0) return 0;
            const completed = this.goalTasks.filter(t => t.completed).length;
            return Math.round((completed / this.goalTasks.length) * 100);
        },
        
        // Aufgaben speichern und Progress aktualisieren
        async saveGoalTasks() {
            if (!this.goalTasksModalGoal) return;
            
            const goalId = this.goalTasksModalGoal.id;
            const newProgress = this.calculateGoalProgress();
            
            // Speichere Aufgaben lokal
            localStorage.setItem(`fightlog_goal_tasks_${goalId}`, JSON.stringify(this.goalTasks));
            
            // Aktualisiere Progress im Backend
            try {
                const res = await apiService.updateGoal({ id: goalId, progress: newProgress });
                if (res.success) {
                    // Aktualisiere lokale Ziele-Liste
                    const goalIndex = this.goals.findIndex(g => g.id === goalId);
                    if (goalIndex !== -1) {
                        this.goals[goalIndex].progress = newProgress;
                        // Wenn 100% erreicht, Status auf completed setzen
                        if (newProgress >= 100) {
                            this.goals[goalIndex].status = 'completed';
                        }
                    }
                    this.showGoalTasksModal = false;
                    // Lade Ziele neu um sicherzustellen dass alles synchron ist
                    await this.loadGoals();
                } else {
                    alert('Fehler beim Speichern: ' + (res.error || 'Unbekannt'));
                }
            } catch (e) {
                console.error('Save goal tasks error:', e);
                alert('Fehler beim Speichern der Aufgaben');
            }
        },
        
        async loadGoals() {
            try {
                // Alle Rollen (auch Trainer) laden jetzt nur ihre eigenen Ziele - Backend regelt das
                this.goals = await apiService.getGoals();
            } catch (error) {
                console.error('Load goals error:', error);
            }
        },
        
        // Admin
        async loadUsers() {
            try {
                const users = await apiService.getUsers();
                // Stelle sicher, dass jeder User die benötigten Properties hat
                this.adminUserList = users.map(user => ({
                    ...user,
                    _open: user._open || false,
                    _newPassword: user._newPassword || '',
                    _passwordChanged: user._passwordChanged || false
                }));
            } catch (error) {
                console.error('Load users error:', error);
            }
        },
        toggleUserCard(user) {
            // Toggle nur diesen spezifischen User
            // Stelle sicher, dass _open initialisiert ist
            if (user._open === undefined) {
                user._open = false;
            }
            user._open = !user._open;
        },
        togglePermission(user, permKey) {
            const has = user.permissions.includes(permKey);
            if (has) {
                user.permissions = user.permissions.filter(p => p !== permKey);
            } else {
                user.permissions = [...user.permissions, permKey];
            }
        },
        async saveUser(user) {
            try {
                const res = await apiService.updateUser(user);
                if (res.success) {
                    alert('Benutzer gespeichert.');
                } else {
                    alert('Speichern fehlgeschlagen');
                }
            } catch (e) {
                console.error('Save user error:', e);
                alert('Speichern fehlgeschlagen');
            }
        },
        closeCreateUserModal() {
            this.showCreateUserModal = false;
            // Formular zurücksetzen
            this.createUserForm = {
                username: '',
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                role: 'schueler',
                school: '',
                beltLevel: ''
            };
        },
        async createUser() {
            try {
                const res = await apiService.createUser(this.createUserForm);
                if (res.success) {
                    alert('Benutzer erfolgreich erstellt.');
                    this.closeCreateUserModal();
                    // Benutzerliste neu laden
                    await this.loadUsers();
                } else {
                    alert('Fehler: ' + (res.error || 'Benutzer konnte nicht erstellt werden'));
                }
            } catch (e) {
                console.error('Create user error:', e);
                alert('Fehler beim Erstellen des Benutzers');
            }
        },
        addPasskey(user) {
            const key = (user._newPasskey || '').trim();
            if (!key) return;
            const current = Array.isArray(user.passkeys) ? user.passkeys : [];
            if (current.includes(key)) return alert('Passkey existiert bereits.');
            user.passkeys = [...current, key];
            user._newPasskey = '';
        },
        removePasskey(user, key) {
            const current = Array.isArray(user.passkeys) ? user.passkeys : [];
            user.passkeys = current.filter(k => k !== key);
        },
        async deleteUser(user) {
            const ok = await notify.confirm('Benutzer wirklich löschen?');
            if (!ok) return;
            // Platzhalter: entfernt den Benutzer lokal aus der Liste
            this.adminUserList = this.adminUserList.filter(u => u.id !== user.id);
            alert('Benutzer gelöscht (Platzhalter).');
        },
        async changeUserPassword(user) {
            if (!user._newPassword || user._newPassword.length < 3) {
                alert('Passwort muss mindestens 3 Zeichen lang sein');
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
                    alert('Fehler: ' + (res.error || 'Passwort konnte nicht geändert werden'));
                }
            } catch (e) {
                console.error('Change password error:', e);
                alert('Fehler beim Ändern des Passworts');
            }
        },
        
        // Daten laden
        async loadPageData() {
            switch (this.currentPage) {
                case 'certificates':
                    await this.loadCertificates();
                    await this.loadUsers();
                    break;
                case 'exams':
                    await this.loadExams();
                    await this.loadUsers();
                    break;
                case 'goals':
                    await this.loadGoals();
                    break;
                case 'trainingHistory':
                    try {
                        this.trainingHistory = await apiService.getTrainingHistory();
                    } catch (error) {
                        console.error('Load training history error:', error);
                    }
                    break;
                case 'specialCourses':
                    try {
                        this.specialCourses = await apiService.getSpecialCourses();
                    } catch (error) {
                        console.error('Load special courses error:', error);
                    }
                    break;
                case 'courses':
                    await this.loadCourses();
                    await this.loadUsers();
                    break;
                case 'admin':
                    await this.loadUsers();
                    break;
                case 'presets':
                    this.loadPresets();
                    await this.loadUsers();
                    await this.loadGroups();
                    break;
            }
        },
        async loadCourses() {
            try {
                this.courses = await apiService.getCourses();
            } catch (e) {
                console.error('Load courses error:', e);
            }
        },
        // Presets: CRUD + Persistenz
        loadPresets() {
            try {
                const cp = JSON.parse(localStorage.getItem('fightlog_certificatePresets') || '[]');
                this.certificatePresets = Array.isArray(cp) ? cp : [];

                // Seed mit realistischen Dummy-Daten, falls leer
                if (!this.certificatePresets.length) {
                    this.certificatePresets = [
                        { id: Date.now() - 1003, title: 'Gelbgurt Prüfung – Standard', type: 'belt_exam', level: 'Gelbgurt', instructor: 'Hans Schmidt' },
                        { id: Date.now() - 1002, title: 'Turnier – Berlin Open', type: 'tournament', level: 'Regional', instructor: 'Max Müller' },
                        { id: Date.now() - 1001, title: 'Workshop – Selbstverteidigung', type: 'workshop', level: '', instructor: 'Anna Weber' }
                    ];
                }
                this.savePresets();
            } catch (e) {
                console.warn('Presets parse error', e);
                this.certificatePresets = [];
            }
        },
        savePresets() {
            localStorage.setItem('fightlog_certificatePresets', JSON.stringify(this.certificatePresets));
        },
        // Gruppen (Datenbank-basiert)
        async loadGroups() {
            try {
                const response = await apiService.getGroups();
                if (response.success) {
                    this.studentGroups = response.groups.map(g => ({
                        ...g,
                        _showMembers: false
                    }));
                }
            } catch (e) {
                console.error('Load groups error:', e);
            }
        },
        async addStudentGroup() {
            const name = (this.groupForm.name || '').trim();
            const description = (this.groupForm.description || '').trim();
            const ids = Array.from(new Set(this.groupForm.userIds));
            if (!name) return alert('Bitte einen Gruppennamen angeben.');
            if (!ids.length) return alert('Mindestens einen Schüler auswählen.');
            
            try {
                const response = await apiService.addGroup({
                    name: name,
                    description: description,
                    userIds: ids
                });
                if (response.success) {
                    await this.loadGroups();
                    this.resetGroupForm();
                } else {
                    alert(response.error || 'Fehler beim Erstellen');
                }
            } catch (e) {
                console.error('Save group error:', e);
                alert('Fehler beim Speichern der Gruppe');
            }
        },
        resetGroupForm() {
            this.groupForm = { name: '', description: '', userIds: [], query: '' };
        },
        tapSelectGroupStudent(user) {
            // Schüler zur Gruppe hinzufügen (wenn noch nicht vorhanden)
            if (!this.groupForm.userIds.includes(user.id)) {
                this.groupForm.userIds = [...this.groupForm.userIds, user.id];
            }
            this.groupForm.query = '';
        },
        removeGroupStudent(userId) {
            this.groupForm.userIds = this.groupForm.userIds.filter(id => id !== userId);
        },
        showGroupMembers(grp) {
            // Toggle die Mitglieder-Anzeige
            grp._showMembers = !grp._showMembers;
        },
        getGroupMemberNames(grp) {
            return (grp.userIds || []).map(id => {
                const user = this.adminUserList.find(u => u.id === id);
                return user ? (user.name || user.username) : `ID: ${id}`;
            });
        },
        editGroup(grp) {
            // Lade Gruppe ins Modal
            this.groupEditForm = {
                id: grp.id,
                name: grp.name || '',
                description: grp.description || '',
                members: (grp.userIds || []).map(uid => {
                    const user = this.adminUserList.find(u => u.id === uid);
                    return user ? { id: user.id, name: user.name, username: user.username } : { id: uid, name: 'Unbekannt', username: '?' };
                }),
                memberQuery: '',
                showAddMember: false
            };
            this.showGroupEditModal = true;
        },
        
        closeGroupEditModal() {
            this.showGroupEditModal = false;
            this.groupEditForm = {
                id: null,
                name: '',
                description: '',
                members: [],
                memberQuery: '',
                showAddMember: false
            };
        },
        
        addMemberToGroupEdit(user) {
            if (this.groupEditForm.members.some(m => m.id === user.id)) {
                return; // Bereits in Liste
            }
            this.groupEditForm.members.push({ id: user.id, name: user.name, username: user.username });
            this.groupEditForm.memberQuery = '';
            this.groupEditForm.showAddMember = false;
        },
        
        removeMemberFromGroupEdit(userId) {
            this.groupEditForm.members = this.groupEditForm.members.filter(m => m.id !== userId);
        },
        
        async saveGroupEdit() {
            const name = (this.groupEditForm.name || '').trim();
            if (!name) {
                alert('Bitte einen Gruppennamen angeben.');
                return;
            }
            
            const userIds = this.groupEditForm.members.map(m => m.id);
            
            try {
                const response = await apiService.updateGroup({
                    id: this.groupEditForm.id,
                    name: name,
                    description: (this.groupEditForm.description || '').trim(),
                    userIds: userIds
                });
                if (response.success) {
                    await this.loadGroups();
                    this.closeGroupEditModal();
                } else {
                    alert(response.error || 'Fehler beim Speichern');
                }
            } catch (e) {
                console.error('Save group error:', e);
                alert('Fehler beim Speichern der Gruppe');
            }
        },
        async removeGroup(grp) {
            const ok = await notify.confirm('Gruppe löschen?');
            if (!ok) return;
            
            try {
                const response = await apiService.deleteGroup(grp.id);
                if (response.success) {
                    await this.loadGroups();
                } else {
                    alert(response.error || 'Fehler beim Löschen');
                }
            } catch (e) {
                console.error('Delete group error:', e);
                alert('Fehler beim Löschen der Gruppe');
            }
        },
        // Certificate Presets
        addCertificatePreset() {
            const p = { id: Date.now(), ...this.certificatePresetForm };
            this.certificatePresets.unshift(p);
            this.certificatePresetForm = { title: '', type: '', level: '', instructor: '' };
            this.savePresets();
        },
        async editCertificatePreset(preset) {
            const title = await notify.prompt('Titel', preset.title);
            if (title == null) return;
            const level = await notify.prompt('Level', preset.level || '');
            if (level == null) return;
            const instructor = await notify.prompt('Trainer/Prüfer', preset.instructor || '');
            if (instructor == null) return;
            const updated = { ...preset, title, level, instructor };
            const idx = this.certificatePresets.findIndex(x => x.id === preset.id);
            if (idx !== -1) this.certificatePresets[idx] = updated;
            this.savePresets();
        },
        async removeCertificatePreset(preset) {
            const ok = await notify.confirm('Preset löschen?');
            if (!ok) return;
            this.certificatePresets = this.certificatePresets.filter(x => x.id !== preset.id);
            this.savePresets();
        },
        setPresetsTab(tab) {
            this.currentPresetsTab = tab;
            // Optional: Scroll to top on mobile for better UX
            try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}
        },
        clearCourseSearch() {
            this.courseSearch = '';
        },
        async submitCourse() {
            console.log('submitCourse called');
            console.log('courseForm:', JSON.stringify(this.courseForm));
            try {
                // Datum zu ISO-Format konvertieren
                const isoDate = this.toISODate(this.courseForm.date);
                console.log('Submitting course with date:', this.courseForm.date, '->', isoDate);
                
                // Schüler sind jetzt optional
                const courseData = {
                    title: this.courseForm.title,
                    date: isoDate,
                    instructor: this.courseForm.instructor,
                    duration: this.courseForm.duration,
                    max_participants: this.courseForm.max_participants,
                    price: this.courseForm.price,
                    description: this.courseForm.description,
                    userIds: this.courseForm.userIds || []
                };
                
                const res = await apiService.addCourse(courseData);
                if (res.success) {
                    alert('Kurs erstellt.');
                    this.courseForm = { 
                        title: '', date: '', instructor: '', duration: '', 
                        max_participants: 20, price: '', description: '', 
                        status: 'approved', userId: null, userIds: [], 
                        studentQuery: '', selectedStudents: [] 
                    };
                    await this.loadCourses();
                } else {
                    alert('Fehler: ' + (res.error || 'Unbekannt'));
                }
            } catch (e) {
                console.error('Add course error:', e);
                alert('Kurs konnte nicht erstellt werden.');
            }
        },
        editCourse(course) {
            // Modal öffnen mit Kursdaten
            // Ungültige Daten (0000-00-00) als leer behandeln
            let courseDate = course.date || '';
            if (courseDate === '0000-00-00') courseDate = '';
            
            this.courseEditForm = {
                id: course.id,
                title: course.title || '',
                date: courseDate,
                instructor: course.instructor || '',
                duration: course.duration || '',
                max_participants: course.max_participants || 20,
                price: course.price || '',
                description: course.description || ''
            };
            this.showCourseEditModal = true;
        },
        async saveCourseEdit() {
            try {
                // Datum zu ISO-Format konvertieren
                const updateData = {
                    ...this.courseEditForm,
                    date: this.toISODate(this.courseEditForm.date)
                };
                console.log('Updating course with date:', this.courseEditForm.date, '->', updateData.date);
                
                const res = await apiService.updateCourse(updateData);
                if (res.success) {
                    this.showCourseEditModal = false;
                    await this.loadCourses();
                } else {
                    alert('Fehler beim Speichern: ' + (res.error || 'Unbekannt'));
                }
            } catch (e) {
                console.error('Update course error:', e);
                alert('Kurs konnte nicht aktualisiert werden.');
            }
        },
        async removeCourse(course) {
            const ok = await notify.confirm('Diesen Kurs wirklich löschen?');
            if (!ok) return;
            const res = await apiService.deleteCourse(course.id);
            if (res.success) {
                this.courses = this.courses.filter(c => c.id !== course.id);
            }
        },
        
        // Teilnehmer anzeigen (Admin/Trainer)
        async showParticipants(course) {
            this.participantsModalCourse = course;
            this.participantsList = [];
            this.showParticipantsModal = true;
            try {
                const participants = await apiService.getCourseParticipants(course.id);
                this.participantsList = Array.isArray(participants) ? participants : [];
            } catch (e) {
                console.error('Load participants error:', e);
            }
        },
        
        // Datum+Zeit formatieren
        formatDateTime(dateStr) {
            if (!dateStr) return '—';
            const date = new Date(dateStr);
            const day = date.getDate();
            const months = ['Jan.', 'Feb.', 'Mär.', 'Apr.', 'Mai', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}. ${month} ${year}, ${hours}:${minutes}`;
        },
        
        // Schüler: Für Kurs anmelden
        async bookCourse(course) {
            try {
                const res = await apiService.bookCourse(course.id);
                if (res.success) {
                    alert('Erfolgreich angemeldet!');
                    await this.loadCourses();
                } else {
                    alert('Anmeldung fehlgeschlagen: ' + (res.error || 'Unbekannt'));
                }
            } catch (e) {
                console.error('Book course error:', e);
                alert('Anmeldung fehlgeschlagen.');
            }
        },
        
        // Schüler: Von Kurs abmelden
        async cancelBooking(course) {
            const ok = await notify.confirm('Wirklich vom Kurs abmelden?');
            if (!ok) return;
            try {
                const res = await apiService.cancelCourseBooking(course.id);
                if (res.success) {
                    alert('Erfolgreich abgemeldet.');
                    await this.loadCourses();
                } else {
                    alert('Abmeldung fehlgeschlagen: ' + (res.error || 'Unbekannt'));
                }
            } catch (e) {
                console.error('Cancel booking error:', e);
                alert('Abmeldung fehlgeschlagen.');
            }
        },
        
        // Prüfen ob Abmeldung noch möglich (mind. 1 Tag vorher)
        canCancelBooking(course) {
            if (!course || !course.date) return false;
            const courseDate = new Date(course.date);
            courseDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((courseDate - today) / (1000 * 60 * 60 * 24));
            return diffDays >= 1;
        },

        // Validierung
        validateEmail() {
            const email = (this.authForm.email || '').trim();
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
            return re.test(email);
        },
        validatePhone() {
            const phone = (this.authForm.phone || '').trim();
            const re = /^\+?[0-9 ()\-]{7,20}$/;
            return re.test(phone);
        }
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
                
                // Lade Daten nach dem Login
                await this.loadExams();
                await this.loadCourses();
            } else {
                // Fallback zu altem System
                const savedUsername = getCachedUsername();
                if (savedUsername) {
                    this.isLoggedIn = true;
                    this.currentUser = demoData.user;
                    await this.loadExams();
                    await this.loadCourses();
                }
            }
        }
});

// Globale Komponenten registrieren
registerGlobalComponents(app);

// Starte Anwendung
app.mount('#app');