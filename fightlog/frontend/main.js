// ===== FIGHTLOG - HAUPTANWENDUNG =====
// Diese Datei enthält die komplette Vue.js Anwendung
// Backend-Entwickler: Hier können echte API-Calls eingefügt werden

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

    console.log('[FightLog] Inline notify system loaded');
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
                                    icon="fa-user"
                                    title="Profil"
                                    description="Profil bearbeiten & Passwort ändern"
                                    @click="navigateTo('profile')"
                                />
                                
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
                                    title="Settings"
                                    description="Urkunden-Vorlagen &amp; Gruppen"
                                    @click="navigateTo('settings')"
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
                                 <h1><i class="fas fa-certificate"></i> Meine Urkunden</h1>
                             </div>
                            
                            <!-- Trainer/Admin: Manuelle Urkunde hinzufügen -->
                            <div v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')" class="form-container" style="margin-bottom: 1.5rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <h3 style="margin: 0;"><i class="fas fa-plus-circle"></i> Manuelle Urkunde erstellen</h3>
                                    <button class="btn btn-primary btn-sm" @click="showManualCertificateForm = !showManualCertificateForm">
                                        {{ showManualCertificateForm ? 'Ausblenden' : 'Hinzufügen' }}
                                    </button>
                                </div>
                                <form v-if="showManualCertificateForm" @submit.prevent="createManualCertificate" style="margin-top: 1rem;">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Titel *</label>
                                            <input type="text" v-model="manualCertificateForm.title" class="form-control" placeholder="z.B. Sonderauszeichnung" required>
                                        </div>
                                        <div class="form-group">
                                            <label>Datum *</label>
                                            <input type="date" v-model="manualCertificateForm.date" class="form-control" required>
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Gürtelgrad</label>
                                            <select v-model="manualCertificateForm.level" class="form-control">
                                                <option value="">Bitte wählen</option>
                                                <option v-for="grade in grades" :key="grade.id" :value="grade.name">{{ grade.name }}</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>Prüfer/Trainer *</label>
                                            <input type="text" v-model="manualCertificateForm.instructor" class="form-control" required>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Schüler auswählen *</label>
                                        <div style="position:relative;">
                                            <input type="text" v-model="manualCertificateForm.studentQuery" class="form-control" placeholder="Schüler suchen...">
                                            <div v-if="manualCertificateForm.studentQuery && studentMatches(manualCertificateForm.studentQuery).length" class="form-container" style="position:absolute; left:0; right:0; top:100%; margin-top:.25rem; padding:.5rem 0; z-index:1000; max-height:180px; overflow:auto;">
                                                <div v-for="u in studentMatches(manualCertificateForm.studentQuery)" :key="u.id" style="padding:.4rem 1rem; cursor:pointer;" @click="selectStudentForManualCertificate(u)">
                                                    {{ u.name }} <span style="color:#64748b;">(@{{ u.username }})</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="manualCertificateForm.studentName" style="margin-top:.25rem; color:#10b981; font-size:.9rem;">
                                            <i class="fas fa-check"></i> Ausgewählt: {{ manualCertificateForm.studentName }}
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-success">
                                        <i class="fas fa-save"></i> Urkunde erstellen
                                    </button>
                                </form>
                            </div>
                            
                            <!-- Info-Text -->
                            <div v-if="certificates.length === 0" class="form-container" style="text-align: center; padding: 3rem;">
                                <i class="fas fa-certificate" style="font-size: 4rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
                                <h3 style="color: #64748b;">Noch keine Urkunden vorhanden</h3>
                                <p style="color: #94a3b8;">Urkunden werden automatisch erstellt, wenn du Prüfungen bestehst.</p>
                            </div>
                            
                            <!-- Urkunden-Kacheln -->
                            <div v-else class="certificates-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                                <div 
                                    v-for="cert in displayedCertificates" 
                                    :key="cert.id" 
                                    class="certificate-card form-container"
                                    style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative;"
                                    @click="openCertificateDetail(cert)"
                                    @mouseenter="$event.target.style.transform = 'translateY(-4px)'; $event.target.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)'"
                                    @mouseleave="$event.target.style.transform = ''; $event.target.style.boxShadow = ''"
                                >
                                    <!-- Gürtelgrad-Farbband -->
                                    <div v-if="cert.gradeColor" style="position: absolute; top: 0; left: 0; right: 0; height: 6px; border-radius: 14px 14px 0 0;" :style="{ backgroundColor: cert.gradeColor }"></div>
                                    
                                    <!-- Manuell-Badge -->
                                    <div v-if="cert.isManual" style="position: absolute; top: 12px; right: 12px;">
                                        <span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600;">MANUELL</span>
                                    </div>
                                    
                                    <div style="text-align: center; padding: 1.5rem 1rem;">
                                        <!-- Urkunden-Icon mit Grad-Farbe -->
                                        <div style="width: 70px; height: 70px; margin: 0 auto 1rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem;" :style="{ backgroundColor: (cert.gradeColor || '#e2e8f0') + '20', color: cert.gradeColor || '#64748b' }">
                                            <i class="fas fa-award"></i>
                                        </div>
                                        
                                        <!-- Titel -->
                                        <h4 style="margin: 0 0 0.5rem; font-size: 1.1rem; color: #1e293b;">{{ cert.title }}</h4>
                                        
                                        <!-- Gürtelgrad -->
                                        <div v-if="cert.gradeName" style="margin-bottom: 0.75rem;">
                                            <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;" :style="{ backgroundColor: (cert.gradeColor || '#64748b') + '20', color: cert.gradeColor || '#64748b' }">
                                                {{ cert.gradeName }}
                                            </span>
                                        </div>
                                        
                                        <!-- Details -->
                                        <div style="color: #64748b; font-size: 0.9rem;">
                                            <p style="margin: 0.25rem 0;"><i class="fas fa-calendar-alt" style="width: 20px;"></i> {{ formatDate(cert.date) }}</p>
                                            <p style="margin: 0.25rem 0;"><i class="fas fa-user-tie" style="width: 20px;"></i> {{ cert.instructor }}</p>
                                            <p v-if="cert.category" style="margin: 0.25rem 0;"><i class="fas fa-tag" style="width: 20px;"></i> {{ cert.category }}</p>
                                        </div>
                                        
                                        <!-- Admin: Schülername -->
                                        <div v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer') && cert.ownerName" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 0.85rem;">
                                            <i class="fas fa-user-graduate"></i> {{ cert.ownerName }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Urkunden-Detail-Modal -->
                <div v-if="showCertificateDetailModal" class="modal-overlay" @click.self="showCertificateDetailModal = false">
                    <div class="modal-content form-container" style="max-width: 600px; text-align: center;">
                        <button @click="showCertificateDetailModal = false" class="close-btn" style="position: absolute; top: 1rem; right: 1rem;">
                            <i class="fas fa-times"></i>
                        </button>
                        
                        <!-- Farbband oben -->
                        <div v-if="selectedCertificate && selectedCertificate.gradeColor" style="position: absolute; top: 0; left: 0; right: 0; height: 8px; border-radius: 14px 14px 0 0;" :style="{ backgroundColor: selectedCertificate.gradeColor }"></div>
                        
                        <div v-if="selectedCertificate" style="padding: 2rem 1rem;">
                            <!-- Großes Urkunden-Icon -->
                            <div style="width: 100px; height: 100px; margin: 0 auto 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem;" :style="{ backgroundColor: (selectedCertificate.gradeColor || '#e2e8f0') + '20', color: selectedCertificate.gradeColor || '#64748b' }">
                                <i class="fas fa-award"></i>
                            </div>
                            
                            <!-- Schultitel -->
                            <h2 style="margin: 0 0 0.5rem; color: #64748b; font-size: 1rem; text-transform: uppercase; letter-spacing: 2px;">{{ certificateSettings.certificate_school_name || 'Kampfsport Akademie' }}</h2>
                            
                            <!-- Urkunde Titel -->
                            <h1 style="margin: 0 0 1rem; font-size: 2rem; color: #1e293b;">{{ certificateSettings.certificate_title || 'Urkunde' }}</h1>
                            
                            <!-- Empfänger -->
                            <p style="font-size: 1.1rem; color: #64748b; margin-bottom: 0.5rem;">verliehen an</p>
                            <h3 style="margin: 0 0 1.5rem; font-size: 1.5rem; color: #1e293b;">{{ selectedCertificate.ownerName || 'Unbekannt' }}</h3>
                            
                            <!-- Gürtelgrad -->
                            <div v-if="selectedCertificate.gradeName" style="margin-bottom: 1.5rem;">
                                <span style="padding: 8px 24px; border-radius: 25px; font-size: 1.1rem; font-weight: 600;" :style="{ backgroundColor: (selectedCertificate.gradeColor || '#64748b') + '20', color: selectedCertificate.gradeColor || '#64748b' }">
                                    {{ selectedCertificate.gradeName }}
                                </span>
                            </div>
                            
                            <!-- Prüfungstitel -->
                            <h4 style="margin: 0 0 1.5rem; color: #475569;">{{ selectedCertificate.title }}</h4>
                            
                            <!-- Gratulationstext -->
                            <div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; white-space: pre-line; color: #475569; line-height: 1.6;">
                                {{ certificateSettings.certificate_congratulation_text || 'Herzlichen Glückwunsch zur bestandenen Prüfung!' }}
                            </div>
                            
                            <!-- Details -->
                            <div style="display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; color: #64748b; margin-bottom: 1.5rem;">
                                <div>
                                    <i class="fas fa-calendar-alt"></i>
                                    <strong style="margin-left: 0.5rem;">{{ formatDate(selectedCertificate.date) }}</strong>
                                </div>
                                <div>
                                    <i class="fas fa-user-tie"></i>
                                    <strong style="margin-left: 0.5rem;">{{ selectedCertificate.instructor }}</strong>
                                </div>
                                <div v-if="selectedCertificate.category">
                                    <i class="fas fa-tag"></i>
                                    <strong style="margin-left: 0.5rem;">{{ selectedCertificate.category }}</strong>
                                </div>
                            </div>
                            
                            <!-- Footer -->
                            <p style="color: #94a3b8; font-size: 0.85rem; font-style: italic;">
                                {{ certificateSettings.certificate_footer_text || 'Diese Urkunde wurde automatisch erstellt.' }}
                            </p>
                            
                            <!-- Löschen-Button für manuelle Urkunden (nur Admin) -->
                            <div v-if="selectedCertificate.isManual && currentUser && currentUser.role === 'admin'" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                                <button class="btn btn-danger" @click="deleteManualCertificate(selectedCertificate.id)">
                                    <i class="fas fa-trash"></i> Urkunde löschen
                                </button>
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
                                                <option v-for="grade in grades" :key="grade.id" :value="grade.name">{{ grade.name }}</option>
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
                                                    <input type="text" v-model="examEditForm.date" class="form-control datepicker" placeholder="TT.MM.JJJJ" required>
                                                </div>
                                                <div class="form-group">
                                                    <label>Stufe</label>
                                                    <select v-model="examEditForm.level" class="form-control" required>
                                                        <option v-for="grade in grades" :key="grade.id" :value="grade.name">{{ grade.name }}</option>
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
                
                                 <!-- Ziele (Neues Template-basiertes System) -->
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
                            
                            <!-- ADMIN-ANSICHT: Alle Ziele aller User -->
                            <div v-if="currentUser && currentUser.role === 'admin'">
                                <div class="form-container">
                                    <h2><i class="fas fa-users" style="color: #8b5cf6;"></i> Alle Schüler-Ziele</h2>
                                    <p style="color: #64748b; margin-bottom: 1rem;">Übersicht aller Ziele aller Schüler</p>
                                    
                                    <!-- Filter nach Status -->
                                    <div class="form-row" style="margin-bottom: 1rem;">
                                        <div class="form-group">
                                            <label>Status filtern</label>
                                            <select v-model="adminGoalStatusFilter" class="form-control no-custom-select">
                                                <option value="">Alle</option>
                                                <option value="in_progress">In Bearbeitung</option>
                                                <option value="completed">Abgeschlossen</option>
                                                <option value="cancelled">Abgebrochen</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>Schüler suchen</label>
                                            <input type="text" v-model="adminGoalSearch" class="form-control" placeholder="Name eingeben...">
                                        </div>
                                    </div>
                                    
                                    <div v-if="filteredAllUsersGoals.length === 0" style="color: #64748b; padding: 1rem 0;">
                                        Keine Ziele gefunden.
                                    </div>
                                    
                                    <div class="nav-grid" v-else>
                                        <div 
                                            v-for="goal in filteredAllUsersGoals" 
                                            :key="goal.id" 
                                            class="nav-card"
                                            style="text-align: left;"
                                            :style="{
                                                borderLeft: goal.status === 'completed' ? '4px solid #10b981' : 
                                                           goal.status === 'cancelled' ? '4px solid #ef4444' : 
                                                           '4px solid #3b82f6'
                                            }"
                                        >
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                                <div>
                                                    <span style="background: #8b5cf6; color: white; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-bottom: 0.5rem; display: inline-block;">
                                                        {{ goal.user_name }}
                                                    </span>
                                                    <h3 style="margin: 0.25rem 0 0.5rem 0;">{{ goal.title }}</h3>
                                                </div>
                                                <span :style="{
                                                    padding: '0.15rem 0.5rem', 
                                                    borderRadius: '4px', 
                                                    fontSize: '0.75rem',
                                                    background: goal.status === 'completed' ? '#dcfce7' : 
                                                               goal.status === 'cancelled' ? '#fee2e2' : '#dbeafe',
                                                    color: goal.status === 'completed' ? '#166534' : 
                                                          goal.status === 'cancelled' ? '#991b1b' : '#1e40af'
                                                }">
                                                    {{ goal.status === 'completed' ? 'Abgeschlossen' : 
                                                       goal.status === 'cancelled' ? 'Abgebrochen' : 'In Bearbeitung' }}
                                                </span>
                                            </div>
                                            <p style="color: #64748b; font-size: 0.9rem; margin: 0.25rem 0;">{{ goal.definition }}</p>
                                            <p style="color: #94a3b8; font-size: 0.8rem;">
                                                <i class="fas fa-folder"></i> {{ goal.category }}
                                                <span v-if="goal.target_date"> | <i class="fas fa-calendar"></i> {{ formatDate(goal.target_date) }}</span>
                                            </p>
                                            
                                            <div style="margin-top: 0.75rem;">
                                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                                    <span style="font-size: 0.85rem; color: #64748b;">Fortschritt</span>
                                                    <span style="font-size: 0.85rem; font-weight: 600;" :style="{ color: goal.status === 'completed' ? '#10b981' : '#3b82f6' }">
                                                        {{ goal.completed_subtasks }}/{{ goal.total_subtasks }} ({{ goal.progress }}%)
                                                    </span>
                                                </div>
                                                <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                                                    <div 
                                                        :style="{ 
                                                            background: goal.status === 'completed' ? '#10b981' : '#3b82f6', 
                                                            width: goal.progress + '%', 
                                                            height: '100%'
                                                        }"
                                                    ></div>
                                                </div>
                                            </div>
                                            
                                            <p v-if="goal.completed_at" style="color: #10b981; font-size: 0.8rem; margin-top: 0.5rem;">
                                                <i class="fas fa-trophy"></i> Abgeschlossen am {{ formatDate(goal.completed_at) }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- NORMALE USER-ANSICHT (Schüler/Trainer) -->
                            <div v-else>
                            
                            <!-- Neues Ziel auswählen (nur für Schüler und Trainer) -->
                            <div v-if="currentUser && currentUser.role !== 'admin'" class="form-container">
                                <h2><i class="fas fa-plus-circle" style="color: #3b82f6;"></i> Neues Ziel starten</h2>
                                
                                <div class="form-row">
                                    <!-- Kategorie Dropdown -->
                                    <div class="form-group">
                                        <label>Kategorie</label>
                                        <select v-model="selectedGoalCategory" class="form-control no-custom-select">
                                            <option value="">Alle Kategorien</option>
                                            <option v-for="cat in goalCategories" :key="cat" :value="cat">{{ cat }}</option>
                                        </select>
                                    </div>
                                    
                                    <!-- Ziel Dropdown -->
                                    <div class="form-group">
                                        <label>Ziel auswählen</label>
                                        <select v-model="selectedTemplateId" class="form-control no-custom-select" :disabled="filteredGoalTemplates.length === 0">
                                            <option :value="null">-- Ziel wählen --</option>
                                            <option v-for="template in filteredGoalTemplates" :key="template.id" :value="template.id">
                                                {{ template.title }} ({{ template.subtask_count }} Unterziele)
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <!-- Zieldatum -->
                                    <div class="form-group">
                                        <label>Zieldatum (optional)</label>
                                        <input type="date" v-model="goalTargetDate" class="form-control">
                                    </div>
                                    
                                    <!-- Info zum ausgewählten Ziel -->
                                    <div class="form-group" v-if="selectedGoalTemplate">
                                        <label>Beschreibung</label>
                                        <div style="padding: 0.5rem; background: #f8fafc; border-radius: 6px; color: #64748b; font-size: 0.9rem;">
                                            {{ selectedGoalTemplate.definition || 'Keine Beschreibung' }}
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    class="btn btn-primary" 
                                    style="margin-top: 1rem;"
                                    :disabled="!selectedTemplateId"
                                    @click="assignGoalToSelf"
                                >
                                    <i class="fas fa-plus"></i> Ziel starten
                                </button>
                            </div>
                            
                            <!-- Aktive Ziele (In Bearbeitung) -->
                            <div class="form-container" style="margin-top: 1.5rem;">
                                <h2><i class="fas fa-clock" style="color: #f59e0b;"></i> Aktive Ziele</h2>
                                <div v-if="pendingGoals.length === 0" style="color: #64748b; padding: 1rem 0;">
                                    Keine aktiven Ziele. Wähle oben ein Ziel aus, um zu starten!
                                </div>
                                <div class="nav-grid" v-else>
                                    <div 
                                        v-for="goal in pendingGoals" 
                                        :key="goal.id" 
                                        class="nav-card"
                                        style="text-align: left; cursor: pointer;"
                                        @click="openGoalDetails(goal)"
                                    >
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                            <h3 style="margin: 0 0 0.5rem 0;">{{ goal.title }}</h3>
                                            <div style="display: flex; gap: 0.5rem;">
                                                <button class="btn btn-sm" @click.stop="cancelGoal(goal)" title="Ziel abbrechen" style="width: auto; padding: 0.25rem 0.5rem; background: #f59e0b; color: white;">
                                                    <i class="fas fa-ban"></i>
                                                </button>
                                                <button class="btn btn-danger btn-sm" @click.stop="deleteGoal(goal)" title="Ziel löschen" style="width: auto; padding: 0.25rem 0.5rem;">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <p style="color: #64748b; font-size: 0.9rem; margin: 0.25rem 0;">{{ goal.definition }}</p>
                                        <p style="color: #94a3b8; font-size: 0.8rem;">
                                            <i class="fas fa-folder"></i> {{ goal.category }}
                                            <span v-if="goal.target_date"> | <i class="fas fa-calendar"></i> {{ formatDate(goal.target_date) }}</span>
                                        </p>
                                        
                                        <div style="margin-top: 1rem;">
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                                <span style="font-size: 0.85rem; color: #64748b;">Fortschritt</span>
                                                <span style="font-size: 0.85rem; font-weight: 600; color: #3b82f6;">
                                                    {{ goal.completed_subtasks }}/{{ goal.total_subtasks }} ({{ goal.progress }}%)
                                                </span>
                                            </div>
                                            <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                                                <div 
                                                    :style="{ 
                                                        background: '#3b82f6', 
                                                        width: goal.progress + '%', 
                                                        height: '100%',
                                                        transition: 'width 0.3s ease'
                                                    }"
                                                ></div>
                                            </div>
                                        </div>
                                        <p style="color: #3b82f6; font-size: 0.8rem; margin-top: 0.75rem;">
                                            <i class="fas fa-hand-pointer"></i> Klicken um Unterziele zu bearbeiten
                                        </p>
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
                                            <h3 style="margin: 0 0 0.5rem 0;">{{ goal.title }}</h3>
                                            <button class="btn btn-danger btn-sm" @click="deleteGoal(goal)" title="Ziel löschen" style="width: auto; padding: 0.25rem 0.5rem;">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <p style="color: #64748b; font-size: 0.9rem; margin: 0.25rem 0;">{{ goal.definition }}</p>
                                        <p style="color: #94a3b8; font-size: 0.8rem;">
                                            <i class="fas fa-folder"></i> {{ goal.category }}
                                        </p>
                                        <p style="color: #10b981; font-size: 0.85rem; margin-top: 0.5rem;">
                                            <i class="fas fa-trophy"></i> Abgeschlossen am {{ formatDate(goal.completed_at) }}
                                        </p>
                                        
                                        <div style="margin-top: 1rem;">
                                            <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                                                <div style="background: #10b981; width: 100%; height: 100%;"></div>
                                            </div>
                                            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #10b981;">
                                                <i class="fas fa-check"></i> Alle {{ goal.total_subtasks }} Unterziele erledigt
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Abgebrochene Ziele (zusammengeklappt) -->
                            <div v-if="cancelledGoals.length > 0" class="form-container" style="margin-top: 1.5rem;">
                                <h2 style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" 
                                    @click="showCancelledGoals = !showCancelledGoals">
                                    <span><i class="fas fa-times-circle" style="color: #ef4444;"></i> Abgebrochene Ziele ({{ cancelledGoals.length }})</span>
                                    <i :class="showCancelledGoals ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" style="color: #94a3b8;"></i>
                                </h2>
                                <div v-if="showCancelledGoals" class="nav-grid">
                                    <div 
                                        v-for="goal in cancelledGoals" 
                                        :key="goal.id" 
                                        class="nav-card"
                                        style="text-align: left; border-left: 4px solid #ef4444; opacity: 0.7;"
                                    >
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                            <h3 style="margin: 0 0 0.5rem 0; text-decoration: line-through;">{{ goal.title }}</h3>
                                            <div style="display: flex; gap: 0.35rem;">
                                                <button class="btn btn-success btn-sm" @click="resumeGoal(goal)" title="Ziel wiederaufnehmen" style="width: auto; padding: 0.25rem 0.5rem;">
                                                    <i class="fas fa-redo"></i>
                                                </button>
                                                <button class="btn btn-danger btn-sm" @click="deleteGoal(goal)" title="Ziel löschen" style="width: auto; padding: 0.25rem 0.5rem;">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <p style="color: #94a3b8; font-size: 0.8rem;">
                                            <i class="fas fa-folder"></i> {{ goal.category }}
                                        </p>
                                        <p style="color: #ef4444; font-size: 0.85rem;">
                                            <i class="fas fa-ban"></i> Abgebrochen
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            </div><!-- Ende v-else normale User-Ansicht -->
                        </div>
                    </div>
                </div>

                <!-- Ziel-Details Modal -->
                <div v-if="showGoalDetailsModal" class="modal-overlay" @click.self="showGoalDetailsModal = false">
                    <div class="modal-content form-container" style="max-width:500px;">
                        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h2><i class="fas fa-bullseye" style="color: #3b82f6;"></i> Unterziele</h2>
                            <button @click="showGoalDetailsModal = false" class="close-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div v-if="goalDetailsData">
                            <h3 style="margin: 0 0 0.5rem 0;">{{ goalDetailsData.title }}</h3>
                            <p style="color: #64748b; margin-bottom: 1rem;">{{ goalDetailsData.definition }}</p>
                            
                            <div v-if="goalSubtasks.length === 0" style="color:#64748b; padding: 1rem 0;">
                                Keine Unterziele vorhanden.
                            </div>
                            <div v-else>
                                <div v-for="subtask in goalSubtasks" :key="subtask.id" 
                                     style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid #e2e8f0; cursor: pointer;"
                                     @click="toggleSubtask(subtask)">
                                    <div :style="{
                                        width: '24px', height: '24px', borderRadius: '6px', 
                                        border: subtask.completed ? 'none' : '2px solid #cbd5e1',
                                        background: subtask.completed ? '#10b981' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }">
                                        <i v-if="subtask.completed" class="fas fa-check" style="color: white; font-size: 0.75rem;"></i>
                                    </div>
                                    <span :style="{ textDecoration: subtask.completed ? 'line-through' : 'none', color: subtask.completed ? '#94a3b8' : '#1e293b' }">
                                        {{ subtask.definition }}
                                    </span>
                                </div>
                            </div>
                            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                    <span style="font-weight: 600;">Fortschritt:</span>
                                    <span :style="{ color: goalDetailsProgress >= 100 ? '#10b981' : '#3b82f6', fontWeight: 600 }">
                                        {{ goalSubtasks.filter(s => s.completed).length }}/{{ goalSubtasks.length }} ({{ goalDetailsProgress }}%)
                                    </span>
                                </div>
                                <div style="background: #e5e7eb; height: 10px; border-radius: 5px; overflow: hidden;">
                                    <div :style="{ background: goalDetailsProgress >= 100 ? '#10b981' : '#3b82f6', width: goalDetailsProgress + '%', height: '100%', transition: 'width 0.3s ease' }"></div>
                                </div>
                                <p v-if="goalDetailsProgress >= 100" style="color: #10b981; text-align: center; margin-top: 1rem; font-weight: 600;">
                                    <i class="fas fa-trophy"></i> Ziel erreicht!
                                </p>
                            </div>
                        </div>
                        <div style="margin-top:1rem; display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary" @click="showGoalDetailsModal = false">Schließen</button>
                        </div>
                    </div>
                </div>

                <!-- Settings (nur Admin/Trainer) -->
                <div v-else-if="currentPage === 'settings' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')">
                    <div style="padding: 2rem 0;">
                        <div class="container">
                            <div class="page-header">
                                <button @click="goToDashboard" class="back-btn">
                                    <i class="fas fa-arrow-left"></i>
                                    Zurück
                                </button>
                                <h1>Settings</h1>
                            </div>

                            <!-- Tab-Switcher -->
                            <div class="preset-tabs" role="tablist" aria-label="Settings Kategorien">
                                <button 
                                    class="tab-btn" 
                                    :class="{ active: currentSettingsTab === 'certificates' }" 
                                    role="tab" 
                                    :aria-selected="(currentSettingsTab === 'certificates').toString()" 
                                    aria-controls="tab-certificates" 
                                    @click="setSettingsTab('certificates')"
                                >Urkunden</button>
                                
                                <button 
                                    class="tab-btn" 
                                    :class="{ active: currentSettingsTab === 'groups' }" 
                                    role="tab" 
                                    :aria-selected="(currentSettingsTab === 'groups').toString()" 
                                    aria-controls="tab-groups" 
                                    @click="setSettingsTab('groups')"
                                >Gruppen</button>
                                
                                <button 
                                    class="tab-btn" 
                                    :class="{ active: currentSettingsTab === 'goals' }" 
                                    role="tab" 
                                    :aria-selected="(currentSettingsTab === 'goals').toString()" 
                                    aria-controls="tab-goals" 
                                    @click="setSettingsTab('goals')"
                                >Ziele</button>
                                
                                <button 
                                    class="tab-btn" 
                                    :class="{ active: currentSettingsTab === 'grades' }" 
                                    role="tab" 
                                    :aria-selected="(currentSettingsTab === 'grades').toString()" 
                                    aria-controls="tab-grades" 
                                    @click="setSettingsTab('grades')"
                                >Grade</button>
                            </div>

                            <div v-show="currentSettingsTab === 'certificates'" id="tab-certificates" class="form-container" role="tabpanel">
                                <h2>Urkunden-Einstellungen</h2>
                                <p style="color: #64748b; margin-bottom: 1rem;">Passe die Texte an, die auf den Urkunden angezeigt werden.</p>
                                
                                <form @submit.prevent="saveCertificateSettings">
                                    <div class="form-group">
                                        <label>Titel der Urkunde</label>
                                        <input type="text" v-model="certificateSettings.certificate_title" class="form-control" placeholder="z.B. Urkunde">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Name der Schule/des Vereins</label>
                                        <input type="text" v-model="certificateSettings.certificate_school_name" class="form-control" placeholder="z.B. Kampfsport Akademie München">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Gratulationstext</label>
                                        <textarea v-model="certificateSettings.certificate_congratulation_text" class="form-control" rows="4" placeholder="z.B. Herzlichen Glückwunsch zur bestandenen Prüfung! Mit dieser Urkunde bestätigen wir..."></textarea>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Fußzeilen-Text</label>
                                        <input type="text" v-model="certificateSettings.certificate_footer_text" class="form-control" placeholder="z.B. Diese Urkunde wurde automatisch erstellt.">
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-save"></i> Einstellungen speichern
                                    </button>
                                </form>
                                
                                <!-- Vorschau -->
                                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                                    <h3>Vorschau</h3>
                                    <div style="background: #f8fafc; padding: 2rem; border-radius: 12px; text-align: center; border: 2px dashed #cbd5e1;">
                                        <h4 style="color: #64748b; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0.5rem;">{{ certificateSettings.certificate_school_name || 'Kampfsport Akademie' }}</h4>
                                        <h2 style="margin: 0 0 1rem; font-size: 1.8rem; color: #1e293b;">{{ certificateSettings.certificate_title || 'Urkunde' }}</h2>
                                        <p style="color: #64748b; margin-bottom: 0.5rem;">verliehen an</p>
                                        <h3 style="margin: 0 0 1rem; color: #1e293b;">[Schülername]</h3>
                                        <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; color: #475569; white-space: pre-line;">{{ certificateSettings.certificate_congratulation_text || 'Herzlichen Glückwunsch zur bestandenen Prüfung!' }}</div>
                                        <p style="color: #94a3b8; font-size: 0.85rem; font-style: italic;">{{ certificateSettings.certificate_footer_text || 'Diese Urkunde wurde automatisch erstellt.' }}</p>
                                    </div>
                                </div>
                            </div>

                            <div v-show="currentSettingsTab === 'groups'" id="tab-groups" class="form-container" role="tabpanel">
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
                            
                            <!-- Tab: Ziele (Goal Templates) -->
                            <div v-show="currentSettingsTab === 'goals'" id="tab-goals" class="form-container" role="tabpanel">
                                <h2><i class="fas fa-bullseye" style="color:#10b981;"></i> Ziel-Vorlagen</h2>
                                
                                <!-- Formular für neues Ziel -->
                                <form @submit.prevent="saveGoalTemplate">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Titel *</label>
                                            <input type="text" v-model="goalTemplateForm.title" class="form-control" placeholder="z.B. Gelber Gürtel" required>
                                        </div>
                                        <div class="form-group">
                                            <label>Kategorie</label>
                                            <input type="text" v-model="goalTemplateForm.category" class="form-control" placeholder="z.B. Gürtelprüfung" list="goal-categories">
                                            <datalist id="goal-categories">
                                                <option v-for="cat in goalCategories" :key="cat" :value="cat"></option>
                                            </datalist>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Beschreibung</label>
                                        <textarea v-model="goalTemplateForm.definition" class="form-control" rows="2" placeholder="Optionale Beschreibung des Ziels"></textarea>
                                    </div>
                                    
                                    <!-- Unterziele -->
                                    <div class="form-group">
                                        <label>Unterziele</label>
                                        <div style="display:flex; flex-direction:column; gap:0.5rem;">
                                            <div v-for="(subtask, index) in goalTemplateForm.subtasks" :key="index" style="display:flex; gap:0.5rem; align-items:center;">
                                                <span style="color:#64748b; min-width:24px;">{{ index + 1 }}.</span>
                                                <input type="text" v-model="goalTemplateForm.subtasks[index]" class="form-control" placeholder="Unterziel eingeben...">
                                                <button type="button" class="btn btn-danger btn-sm" @click="removeGoalSubtask(index)" title="Entfernen">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                            <button type="button" class="btn btn-secondary btn-sm" @click="addGoalSubtask" style="align-self:flex-start;">
                                                <i class="fas fa-plus"></i> Unterziel hinzufügen
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div style="margin-top:1rem; display:flex; gap:0.5rem;">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-save"></i> {{ goalTemplateForm.id ? 'Aktualisieren' : 'Erstellen' }}
                                        </button>
                                        <button type="button" class="btn btn-secondary" @click="resetGoalTemplateForm" v-if="goalTemplateForm.id">
                                            Abbrechen
                                        </button>
                                    </div>
                                </form>
                                
                                <!-- Vorhandene Ziel-Vorlagen als kompakte Tags -->
                                <h3 style="margin:1.5rem 0 .5rem; color:#1e293b;">
                                    Vorhandene Ziel-Vorlagen 
                                    <span style="color:#64748b; font-weight:normal; font-size:0.9rem;">({{ goalTemplates.length }})</span>
                                </h3>
                                <div v-if="goalTemplates.length === 0" style="color:#64748b;">Noch keine Ziel-Vorlagen erstellt.</div>
                                <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                                    <div 
                                        v-for="t in goalTemplates" 
                                        :key="t.id" 
                                        style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.5rem 0.75rem; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; font-size:0.9rem;"
                                        :style="{ background: goalTemplateForm.id === t.id ? '#dcfce7' : '#f0fdf4', borderColor: goalTemplateForm.id === t.id ? '#22c55e' : '#bbf7d0' }"
                                    >
                                        <div style="flex:1; min-width:0;">
                                            <span style="font-weight:600; color:#166534;">{{ t.title }}</span>
                                            <span v-if="t.category" style="color:#64748b; margin-left:0.35rem; font-size:0.8rem;">({{ t.category }})</span>
                                            <span style="color:#94a3b8; margin-left:0.25rem; font-size:0.75rem;">
                                                <i class="fas fa-list-check"></i> {{ t.subtask_count || 0 }}
                                            </span>
                                        </div>
                                        <button class="icon-btn" @click="editGoalTemplate(t)" title="Bearbeiten" style="padding:0.15rem 0.35rem; font-size:0.75rem;"><i class="fas fa-pen"></i></button>
                                        <button class="icon-btn" @click="deleteGoalTemplate(t)" title="Löschen" style="padding:0.15rem 0.35rem; font-size:0.75rem;"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Tab: Grade -->
                            <div v-show="currentSettingsTab === 'grades'" id="tab-grades" class="form-container" role="tabpanel">
                                <h2><i class="fas fa-medal" style="color:#f59e0b;"></i> Grade verwalten</h2>
                                <p style="color:#64748b; margin-bottom:1rem;">Grade (Gürtelgrade) werden in Prüfungen, Urkunden und Benutzerprofilen verwendet.</p>
                                
                                <!-- Formular für neuen Grad -->
                                <form @submit.prevent="saveGrade" v-if="currentUser && currentUser.role === 'admin'">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Name *</label>
                                            <input type="text" v-model="gradeForm.name" class="form-control" placeholder="z.B. Gelbgurt" required>
                                        </div>
                                        <div class="form-group">
                                            <label>Sortierung</label>
                                            <input type="number" v-model.number="gradeForm.sort_order" class="form-control" placeholder="1, 2, 3...">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Farbe (optional)</label>
                                        <input type="color" v-model="gradeForm.color" class="form-control" style="width: 100px; height: 40px; padding: 2px;">
                                    </div>
                                    <div style="margin-top:1rem; display:flex; gap:0.5rem;">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-save"></i> {{ gradeForm.id ? 'Aktualisieren' : 'Erstellen' }}
                                        </button>
                                        <button type="button" class="btn btn-secondary" @click="resetGradeForm" v-if="gradeForm.id">
                                            Abbrechen
                                        </button>
                                    </div>
                                </form>
                                
                                <!-- Vorhandene Grade -->
                                <h3 style="margin:1.5rem 0 .5rem; color:#1e293b;">
                                    Vorhandene Grade 
                                    <span style="color:#64748b; font-weight:normal; font-size:0.9rem;">({{ grades.length }})</span>
                                </h3>
                                <div v-if="grades.length === 0" style="color:#64748b;">Keine Grade vorhanden.</div>
                                <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                                    <div 
                                        v-for="g in grades" 
                                        :key="g.id" 
                                        style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.5rem 0.75rem; background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; font-size:0.9rem;"
                                        :style="{ borderLeftColor: g.color || '#fcd34d', borderLeftWidth: '4px' }"
                                    >
                                        <div style="flex:1; min-width:0;">
                                            <span style="font-weight:600; color:#92400e;">{{ g.name }}</span>
                                            <span style="color:#94a3b8; margin-left:0.35rem; font-size:0.75rem;">#{{ g.sort_order }}</span>
                                        </div>
                                        <button v-if="currentUser && currentUser.role === 'admin'" class="icon-btn" @click="editGrade(g)" title="Bearbeiten" style="padding:0.15rem 0.35rem; font-size:0.75rem;"><i class="fas fa-pen"></i></button>
                                        <button v-if="currentUser && currentUser.role === 'admin'" class="icon-btn" @click="deleteGrade(g)" title="Löschen" style="padding:0.15rem 0.35rem; font-size:0.75rem;"><i class="fas fa-trash"></i></button>
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
                                            <button v-else-if="(c.booking_status === 'confirmed' || c.booking_status === 'pending') && canCancelBooking(c)" class="btn btn-danger" @click="cancelBooking(c)">
                                                <i class="fas fa-times"></i> Abmelden
                                            </button>
                                            <span v-else-if="c.booking_status === 'pending'" style="color:#f59e0b; font-size:0.85rem;">
                                                <i class="fas fa-clock"></i> Anmeldung ausstehend
                                            </span>
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
                                    <input type="text" v-model="courseEditForm.date" class="form-control datepicker" placeholder="TT.MM.JJJJ" required>
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

                <!-- Teilnehmer Modal (erweitert für Admin/Trainer) -->
                <div v-if="showParticipantsModal" class="modal-overlay" @click.self="closeParticipantsModal">
                    <div class="modal-content form-container" style="max-width:550px;">
                        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
                            <h2><i class="fas fa-users"></i> Teilnehmer</h2>
                            <button @click="closeParticipantsModal" class="close-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <p v-if="participantsModalCourse" style="color:#64748b; margin-bottom:1rem;">
                            {{ participantsModalCourse.title }} — {{ participantsList.length }} / {{ participantsModalCourse.max_participants }} Teilnehmer
                        </p>
                        
                        <!-- Teilnehmer hinzufügen (Admin/Trainer) -->
                        <div v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')" style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <label style="font-weight: 600;">Teilnehmer hinzufügen:</label>
                                <button type="button" class="btn btn-success btn-sm" @click="participantsAddMode = !participantsAddMode">
                                    <i class="fas fa-plus"></i> Hinzufügen
                                </button>
                            </div>
                            <div v-if="participantsAddMode" style="padding: 0.75rem; background: #f1f5f9; border-radius: 8px;">
                                <input type="text" v-model="participantsSearchQuery" class="form-control" placeholder="Gruppe oder Schüler suchen..." @keydown.enter.prevent>
                                <div v-if="participantsSearchQuery && (filteredGroupsForCourse.length || filteredStudentsForCourse.length)" style="margin-top: 0.5rem; max-height: 200px; overflow: auto; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
                                    <!-- Gruppen -->
                                    <div v-for="g in filteredGroupsForCourse" :key="'g_'+g.id" style="padding: 0.5rem 0.75rem; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-weight: 600; background: #f8fafc;" @click="addGroupToCourse(g)">
                                        <i class="fas fa-users"></i> {{ g.name }} <span style="color: #64748b; font-weight: 400;">(Gruppe - {{ g.memberIds ? g.memberIds.length : 0 }} Mitglieder)</span>
                                    </div>
                                    <!-- Einzelne Schüler -->
                                    <div v-for="u in filteredStudentsForCourse" :key="u.id" style="padding: 0.5rem 0.75rem; cursor: pointer; border-bottom: 1px solid #f1f5f9;" @click="addParticipantToCourse(u)">
                                        {{ u.name }} <span style="color: #64748b;">(@{{ u.username }})</span>
                                    </div>
                                </div>
                                <div v-if="participantsSearchQuery && !filteredGroupsForCourse.length && !filteredStudentsForCourse.length" style="margin-top: 0.5rem; color: #64748b; font-size: 0.9rem;">Keine Gruppen oder Schüler gefunden</div>
                            </div>
                        </div>
                        
                        <!-- Teilnehmerliste -->
                        <div v-if="participantsList.length === 0" style="color:#64748b; text-align: center; padding: 1.5rem;">
                            Keine Teilnehmer angemeldet.
                        </div>
                        <div v-else style="max-height: 300px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <div v-for="p in participantsList" :key="p.id" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9;">
                                <div>
                                    <span style="font-weight: 500;">{{ p.name }}</span>
                                    <span style="color: #64748b; margin-left: 0.5rem;">(@{{ p.username }})</span>
                                    <div style="font-size: 0.8rem; color: #94a3b8;">{{ formatDateTime(p.booking_date) }}</div>
                                </div>
                                <button v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')" 
                                        @click="removeParticipantFromCourse(p.user_id)" 
                                        class="btn btn-danger btn-sm" title="Entfernen">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div style="margin-top:1rem; display: flex; justify-content: flex-end;">
                            <button class="btn btn-secondary" @click="closeParticipantsModal">Schließen</button>
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

                                <div class="admin-users-grid">
                                    <div v-for="user in adminFilteredUsers" :key="user.id" class="admin-user-card collapsible" :class="{ open: user._open }">
                                        <div class="collapsible-header" @click.stop="toggleUserCard(user)">
                                            <div class="user-header-content">
                                                <div class="role-emoji" aria-hidden="true">{{ roleEmoji(user.role) }}</div>
                                                <div class="header-text">
                                                    <div class="name">{{ user.name }}</div>
                                                    <div class="subtitle">{{ roleLabel(user.role) }}</div>
                                                </div>
                                            </div>
                                            <div class="caret" :class="{ open: user._open }"><i class="fas fa-chevron-down"></i></div>
                                        </div>
                                        <transition name="collapse">
                                            <div v-if="user._open" class="collapsible-body" @click.stop>
                                                <!-- Benutzer-Informationen -->
                                                <div class="user-info-section">
                                                    <!-- Read-Only Mode -->
                                                    <template v-if="!user._isEditing">
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-user"></i> Benutzername:</span>
                                                            <span class="info-value">
                                                                {{ user.username }}
                                                                <i class="fas fa-key" style="margin-left: 0.5rem; color: #94a3b8; font-size: 0.75rem;" title="Eindeutiger Identifikator"></i>
                                                            </span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-envelope"></i> E-Mail:</span>
                                                            <span class="info-value">
                                                                {{ user.email }}
                                                                <i class="fas fa-key" style="margin-left: 0.5rem; color: #94a3b8; font-size: 0.75rem;" title="Eindeutiger Identifikator"></i>
                                                            </span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-user-tag"></i> Rolle:</span>
                                                            <span class="info-value">{{ roleLabel(user.role) }}</span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-signature"></i> Vorname:</span>
                                                            <span class="info-value">
                                                                <span :class="{ 'empty-value': !user.firstName }">{{ user.firstName || '—' }}</span>
                                                                <i v-if="user.firstName" class="fas fa-key" style="margin-left: 0.5rem; color: #94a3b8; font-size: 0.75rem;" title="Eindeutiger Identifikator"></i>
                                                            </span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-signature"></i> Nachname:</span>
                                                            <span class="info-value">
                                                                <span :class="{ 'empty-value': !user.lastName }">{{ user.lastName || '—' }}</span>
                                                                <i v-if="user.lastName" class="fas fa-key" style="margin-left: 0.5rem; color: #94a3b8; font-size: 0.75rem;" title="Eindeutiger Identifikator"></i>
                                                            </span>
                                                        </div>
                                                        <div class="info-row" v-if="user.name">
                                                            <span class="info-label"><i class="fas fa-id-card"></i> Vollständiger Name:</span>
                                                            <span class="info-value">{{ user.name }}</span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-phone"></i> Telefon:</span>
                                                            <span class="info-value">
                                                                <span :class="{ 'empty-value': !user.phone }">{{ user.phone || '—' }}</span>
                                                            </span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-school"></i> Schule:</span>
                                                            <span class="info-value">
                                                                <span :class="{ 'empty-value': !user.school }">{{ user.school || '—' }}</span>
                                                            </span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-medal"></i> Gürtelgrad:</span>
                                                            <span class="info-value">
                                                                <span :class="{ 'empty-value': !user.beltLevel }">{{ user.beltLevel || '—' }}</span>
                                                            </span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-certificate"></i> Verifizierter Trainer:</span>
                                                            <span class="info-value">
                                                                <span v-if="user.verifiedTrainer" style="color: #10b981; font-weight: 600;">
                                                                    <i class="fas fa-check-circle"></i> Ja
                                                                </span>
                                                                <span v-else style="color: #64748b;">
                                                                    <i class="fas fa-times-circle"></i> Nein
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </template>
                                                    
                                                    <!-- Edit Mode -->
                                                    <template v-else>
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-envelope"></i> E-Mail *</label>
                                                            <input 
                                                                type="email" 
                                                                v-model="user._editForm.email" 
                                                                class="form-control"
                                                                :class="{ 'error': user._validationErrors.email }"
                                                                placeholder="E-Mail-Adresse"
                                                            >
                                                            <span v-if="user._validationErrors.email" class="error-message">{{ user._validationErrors.email }}</span>
                                                        </div>
                                                        
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-signature"></i> Vorname</label>
                                                            <input 
                                                                type="text" 
                                                                v-model="user._editForm.firstName" 
                                                                class="form-control"
                                                                placeholder="Vorname"
                                                            >
                                                        </div>
                                                        
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-signature"></i> Nachname</label>
                                                            <input 
                                                                type="text" 
                                                                v-model="user._editForm.lastName" 
                                                                class="form-control"
                                                                placeholder="Nachname"
                                                            >
                                                        </div>
                                                        
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-phone"></i> Telefon</label>
                                                            <input 
                                                                type="tel" 
                                                                v-model="user._editForm.phone" 
                                                                class="form-control"
                                                                placeholder="Telefonnummer"
                                                            >
                                                        </div>
                                                        
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-school"></i> Schule</label>
                                                            <input 
                                                                type="text" 
                                                                v-model="user._editForm.school" 
                                                                class="form-control"
                                                                placeholder="Schule"
                                                            >
                                                        </div>
                                                        
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-medal"></i> Gürtelgrad</label>
                                                            <select 
                                                                v-model="user._editForm.beltLevel" 
                                                                class="form-control"
                                                            >
                                                                <option value="">Bitte wählen</option>
                                                                <option v-for="grade in grades" :key="grade.id" :value="grade.name">{{ grade.name }}</option>
                                                            </select>
                                                        </div>
                                                        
                                                        <!-- Passwort-Änderung (über Rolle) -->
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-key"></i> Passwort ändern (optional)</label>
                                                            <input 
                                                                type="password" 
                                                                v-model="user._editForm.newPassword" 
                                                                class="form-control"
                                                                :class="{ 'error': user._validationErrors.newPassword }"
                                                                placeholder="Neues Passwort (leer lassen, um nicht zu ändern)"
                                                            >
                                                            <span v-if="user._validationErrors.newPassword" class="error-message">{{ user._validationErrors.newPassword }}</span>
                                                            <small style="color: #64748b; font-size: 0.8rem;">Mindestens 6 Zeichen, wenn angegeben</small>
                                                        </div>
                                                        
                                                        <!-- Rolle ändern -->
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-user-tag"></i> Rolle *</label>
                                                            <select v-model="user._editForm.role" class="form-control no-custom-select" :class="{ 'error': user._validationErrors.role }">
                                                                <option value="schueler">Schüler</option>
                                                                <option value="trainer">Trainer</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                            <span v-if="user._validationErrors.role" class="error-message">{{ user._validationErrors.role }}</span>
                                                        </div>
                                                        
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-certificate"></i> Verifizierter Trainer</label>
                                                            <select v-model="user._editForm.verifiedTrainer" class="form-control no-custom-select">
                                                                <option :value="false">Nein</option>
                                                                <option :value="true">Ja</option>
                                                            </select>
                                                        </div>
                                                    </template>
                                                </div>
                                                
                                                <!-- Aktions-Buttons -->
                                                <div class="actions">
                                                    <button 
                                                        class="btn btn-secondary btn-sm edit-toggle-btn" 
                                                        :class="{ 'btn-primary': user._isEditing, 'saving': user._isSaving }"
                                                        @click="user._isEditing ? saveUser(user) : startEditUser(user)"
                                                        :disabled="user._isSaving"
                                                    >
                                                        <i v-if="user._isSaving" class="fas fa-spinner fa-spin"></i>
                                                        <i v-else-if="user._isEditing" class="fas fa-save"></i>
                                                        <i v-else class="fas fa-edit"></i>
                                                        <span class="btn-text">{{ user._isSaving ? 'Speichert...' : (user._isEditing ? 'Speichern' : 'Ändern') }}</span>
                                                    </button>
                                                    <button 
                                                        v-if="user._isEditing" 
                                                        class="btn btn-secondary btn-sm" 
                                                        @click="cancelEditUser(user)"
                                                        :disabled="user._isSaving"
                                                    >
                                                        <i class="fas fa-times"></i> <span class="btn-text">Abbrechen</span>
                                                    </button>
                                                    <button 
                                                        class="btn btn-danger btn-sm" 
                                                        @click="deleteUser(user)" 
                                                        aria-label="Benutzer löschen"
                                                        :disabled="user._isEditing || user._isSaving"
                                                    >
                                                        <i class="fas fa-trash"></i> <span class="btn-text">Löschen</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </transition>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profil-Seite -->
                <div v-else-if="currentPage === 'profile' && currentUser">
                    <div style="padding: 2rem 0;">
                        <div class="container">
                            <div class="page-header">
                                <button @click="goToDashboard" class="back-btn">
                                    <i class="fas fa-arrow-left"></i>
                                    Zurück
                                </button>
                                <h1><i class="fas fa-user"></i> Mein Profil</h1>
                            </div>

                            <div class="form-container" style="max-width: 600px;">
                                <form @submit.prevent="saveProfile">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>Vorname *</label>
                                            <input type="text" v-model="profileForm.firstName" class="form-control" required>
                                        </div>
                                        <div class="form-group">
                                            <label>Nachname *</label>
                                            <input type="text" v-model="profileForm.lastName" class="form-control" required>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Benutzername</label>
                                        <input type="text" :value="currentUser.username" class="form-control" disabled style="background: #f1f5f9;">
                                        <small style="color: #64748b;">Benutzername kann nicht geändert werden</small>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>E-Mail *</label>
                                        <input type="email" v-model="profileForm.email" class="form-control" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Telefon</label>
                                        <input type="tel" v-model="profileForm.phone" class="form-control" placeholder="+49 123 456789">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Schule</label>
                                        <input type="text" v-model="profileForm.school" class="form-control" placeholder="z.B. Kampfsport Akademie Berlin">
                                    </div>
                                    
                                    <div class="form-group" v-if="currentUser && currentUser.role !== 'schueler'">
                                        <label>Gürtelgrad</label>
                                        <select v-model="profileForm.beltLevel" class="form-control">
                                            <option value="">Bitte wählen</option>
                                            <option v-for="grade in grades" :key="grade.id" :value="grade.name">{{ grade.name }}</option>
                                        </select>
                                    </div>
                                    <div class="form-group" v-else>
                                        <label>Gürtelgrad</label>
                                        <input type="text" :value="profileForm.beltLevel || 'Nicht zugewiesen'" class="form-control" disabled style="background:#1e293b; cursor:not-allowed;">
                                        <small style="color:#64748b;">Der Gürtelgrad kann nur von einem Trainer geändert werden.</small>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">
                                        <i class="fas fa-save"></i> Profil speichern
                                    </button>
                                </form>
                                
                                <!-- Passwort ändern -->
                                <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid #e2e8f0;">
                                    <h3 style="margin-bottom: 1rem;"><i class="fas fa-key"></i> Passwort ändern</h3>
                                    <form @submit.prevent="changePassword">
                                        <div class="form-group">
                                            <label>Aktuelles Passwort *</label>
                                            <input type="password" v-model="passwordForm.currentPassword" class="form-control" required>
                                        </div>
                                        <div class="form-group">
                                            <label>Neues Passwort *</label>
                                            <input type="password" v-model="passwordForm.newPassword" class="form-control" required minlength="4">
                                        </div>
                                        <div class="form-group">
                                            <label>Neues Passwort bestätigen *</label>
                                            <input type="password" v-model="passwordForm.confirmPassword" class="form-control" required>
                                        </div>
                                        <button type="submit" class="btn btn-secondary" :disabled="!passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword">
                                            <i class="fas fa-lock"></i> Passwort ändern
                                        </button>
                                        <p v-if="passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword" style="color: #ef4444; font-size: 0.9rem; margin-top: 0.5rem;">
                                            Passwörter stimmen nicht überein
                                        </p>
                                    </form>
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
                            <!-- Benutzername -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-user"></i> Benutzername *</label>
                                <input 
                                    type="text" 
                                    v-model="createUserForm.username" 
                                    class="form-control"
                                    :class="{ 'error': createUserForm._validationErrors?.username }"
                                    placeholder="Benutzername"
                                    required
                                >
                                <span v-if="createUserForm._validationErrors?.username" class="error-message">{{ createUserForm._validationErrors.username }}</span>
                            </div>
                            
                            <!-- E-Mail -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-envelope"></i> E-Mail *</label>
                                <input 
                                    type="email" 
                                    v-model="createUserForm.email" 
                                    class="form-control"
                                    :class="{ 'error': createUserForm._validationErrors?.email }"
                                    placeholder="E-Mail-Adresse"
                                    required
                                >
                                <span v-if="createUserForm._validationErrors?.email" class="error-message">{{ createUserForm._validationErrors.email }}</span>
                            </div>
                            
                            <!-- Passwort (über Rolle) -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-key"></i> Passwort *</label>
                                <input 
                                    type="password" 
                                    v-model="createUserForm.password" 
                                    class="form-control"
                                    :class="{ 'error': createUserForm._validationErrors?.password }"
                                    placeholder="Passwort"
                                    required
                                >
                                <span v-if="createUserForm._validationErrors?.password" class="error-message">{{ createUserForm._validationErrors.password }}</span>
                                <small style="color: #64748b; font-size: 0.8rem;">Mindestens 6 Zeichen</small>
                            </div>
                            
                            <!-- Rolle -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-user-tag"></i> Rolle *</label>
                                <select 
                                    v-model="createUserForm.role" 
                                    class="form-control no-custom-select"
                                    :class="{ 'error': createUserForm._validationErrors?.role }"
                                    required
                                >
                                    <option value="schueler">Schüler</option>
                                    <option value="trainer">Trainer</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <span v-if="createUserForm._validationErrors?.role" class="error-message">{{ createUserForm._validationErrors.role }}</span>
                            </div>
                            
                            <!-- Vorname -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-signature"></i> Vorname</label>
                                <input 
                                    type="text" 
                                    v-model="createUserForm.firstName" 
                                    class="form-control"
                                    placeholder="Vorname"
                                >
                            </div>
                            
                            <!-- Nachname -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-signature"></i> Nachname</label>
                                <input 
                                    type="text" 
                                    v-model="createUserForm.lastName" 
                                    class="form-control"
                                    placeholder="Nachname"
                                >
                            </div>
                            
                            <!-- Telefon -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-phone"></i> Telefon</label>
                                <input 
                                    type="tel" 
                                    v-model="createUserForm.phone" 
                                    class="form-control"
                                    placeholder="Telefonnummer"
                                >
                            </div>
                            
                            <!-- Schule -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-school"></i> Schule</label>
                                <input 
                                    type="text" 
                                    v-model="createUserForm.school" 
                                    class="form-control"
                                    placeholder="Schule"
                                >
                            </div>
                            
                            <!-- Gürtelgrad -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-medal"></i> Gürtelgrad</label>
                                <select 
                                    v-model="createUserForm.beltLevel" 
                                    class="form-control"
                                >
                                    <option value="">Bitte wählen</option>
                                    <option v-for="grade in grades" :key="grade.id" :value="grade.name">{{ grade.name }}</option>
                                </select>
                            </div>
                            
                            <!-- Verifizierter Trainer -->
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-certificate"></i> Verifizierter Trainer</label>
                                <select 
                                    v-model="createUserForm.verifiedTrainer" 
                                    class="form-control no-custom-select"
                                >
                                    <option :value="false">Nein</option>
                                    <option :value="true">Ja</option>
                                </select>
                            </div>
                            
                            <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                                <button 
                                    type="submit" 
                                    class="btn btn-primary"
                                    :disabled="createUserForm._isSaving"
                                >
                                    <i v-if="createUserForm._isSaving" class="fas fa-spinner fa-spin"></i>
                                    <i v-else class="fas fa-save"></i>
                                    <span class="btn-text">{{ createUserForm._isSaving ? 'Speichert...' : 'Speichern' }}</span>
                                </button>
                                <button 
                                    type="button" 
                                    class="btn btn-secondary" 
                                    @click="closeCreateUserModal"
                                    :disabled="createUserForm._isSaving"
                                >
                                    Abbrechen
                                </button>
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
                    await window.notify.alert(response.error || 'Login fehlgeschlagen');
                }
            } catch (error) {
                console.error('Login error:', error);
                await window.notify.alert('Login fehlgeschlagen');
            }
        },
        
        async handleRegister() {
            try {
                if (!this.validateEmail() || !this.validatePhone()) {
                    await window.notify.alert(this.validateEmail() ? this.t('phoneInvalid') : this.t('emailInvalid'));
                    return;
                }
                const payload = { ...this.authForm, role: 'schueler' };
                const response = await apiService.register(payload);
                if (response.success) {
                    await window.notify.alert('Registrierung erfolgreich! Sie können sich jetzt anmelden.');
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
                await window.notify.alert('Registrierung fehlgeschlagen');
            }
        },
        
        async logout() {
            // Backend-Logout aufrufen (Session löschen)
            try {
                await apiService.logout();
            } catch (e) {
                console.warn('Logout API error:', e);
            }
            
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
                window.notify.alert('PasskeyManager nicht verfügbar. Bitte laden Sie die Seite neu.');
                return;
            }
            
            try {
                const username = this.currentUser.username;
                const result = await window.passkeyManager.registerPasskey(username);
                
                if (result.success) {
                    window.notify.alert('Passkey erfolgreich registriert!');
                    this.closePasskeyModal();
                } else {
                    throw new Error('Passkey-Registrierung fehlgeschlagen');
                }
                
            } catch (error) {
                console.error('Passkey-Registrierung fehlgeschlagen:', error);
                window.notify.alert('Passkey-Registrierung fehlgeschlagen: ' + error.message);
            }
        },
        
        // Passkey entfernen
        async removePasskey(passkeyId) {
            const ok = await window.notify.confirm('Passkey wirklich entfernen?');
            if (!ok) return;

            try {
                const username = this.currentUser.username;
                window.passkeyManager.removePasskey(username);
                window.notify.alert('Passkey erfolgreich entfernt!');
            } catch (error) {
                console.error('Passkey-Entfernung fehlgeschlagen:', error);
                window.notify.alert('Passkey-Entfernung fehlgeschlagen: ' + error.message);
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
            // Diese Methode wird nicht mehr genutzt - Urkunden werden automatisch erstellt
            console.log('uploadCertificate() ist veraltet - Urkunden werden automatisch bei bestandenen Prüfungen erstellt');
        },
        
        async loadCertificates() {
            try {
                this.certificates = await apiService.getCertificates();
                // Lade auch die Urkunden-Einstellungen
                await this.loadCertificateSettings();
            } catch (error) {
                console.error('Load certificates error:', error);
            }
        },
        
        async loadCertificateSettings() {
            try {
                const response = await apiService.getCertificateSettings();
                if (response && response.success && response.settings) {
                    this.certificateSettings = response.settings;
                }
            } catch (error) {
                console.error('Load certificate settings error:', error);
            }
        },
        
        openCertificateDetail(cert) {
            this.selectedCertificate = cert;
            this.showCertificateDetailModal = true;
        },
        
        selectStudentForManualCertificate(user) {
            this.manualCertificateForm.studentId = user.id;
            this.manualCertificateForm.studentName = user.name;
            this.manualCertificateForm.studentQuery = '';
        },
        
        async createManualCertificate() {
            try {
                if (!this.manualCertificateForm.studentId) {
                    window.notify.alert('Bitte einen Schüler auswählen.');
                    return;
                }
                if (!this.manualCertificateForm.title || !this.manualCertificateForm.date || !this.manualCertificateForm.instructor) {
                    window.notify.alert('Bitte alle Pflichtfelder ausfüllen.');
                    return;
                }
                
                const result = await apiService.createManualCertificate({
                    title: this.manualCertificateForm.title,
                    date: this.manualCertificateForm.date,
                    level: this.manualCertificateForm.level,
                    instructor: this.manualCertificateForm.instructor,
                    userId: this.manualCertificateForm.studentId
                });
                
                if (result.success) {
                    window.notify.alert('Urkunde erfolgreich erstellt!');
                    this.manualCertificateForm = {
                        title: '',
                        date: '',
                        level: '',
                        instructor: '',
                        studentQuery: '',
                        studentId: null,
                        studentName: ''
                    };
                    this.showManualCertificateForm = false;
                    await this.loadCertificates();
                } else {
                    window.notify.alert(result.error || 'Fehler beim Erstellen der Urkunde');
                }
            } catch (error) {
                console.error('Create certificate error:', error);
                window.notify.alert('Fehler beim Erstellen der Urkunde');
            }
        },
        
        async deleteManualCertificate(id) {
            const ok = await window.notify.confirm('Möchten Sie diese Urkunde wirklich löschen?');
            if (!ok) return;
            
            try {
                const result = await apiService.deleteCertificate(id);
                if (result.success) {
                    window.notify.alert('Urkunde gelöscht.');
                    this.showCertificateDetailModal = false;
                    await this.loadCertificates();
                } else {
                    window.notify.alert(result.error || 'Fehler beim Löschen');
                }
            } catch (error) {
                console.error('Delete certificate error:', error);
                window.notify.alert('Fehler beim Löschen der Urkunde');
            }
        },
        
        async saveCertificateSettings() {
            try {
                const result = await apiService.saveCertificateSettings(this.certificateSettings);
                if (result.success) {
                    window.notify.alert('Urkunden-Einstellungen gespeichert!');
                } else {
                    window.notify.alert(result.error || 'Fehler beim Speichern');
                }
            } catch (error) {
                console.error('Save certificate settings error:', error);
                window.notify.alert('Fehler beim Speichern der Einstellungen');
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
                        window.notify.alert('Das Prüfungsdatum darf nicht in der Zukunft liegen.');
                        return;
                    }
                }
                const targetIds = (this.examForm.userIds && this.examForm.userIds.length)
                    ? this.examForm.userIds
                    : (this.examForm.userId ? [this.examForm.userId] : []);
                if (!targetIds.length) return window.notify.alert('Bitte mindestens einen Schüler auswählen.');
                for (const uid of targetIds) {
                    await apiService.addExam({ ...this.examForm, userId: uid });
                }
                const response = { success: true };
                if (response.success) {
                    window.notify.alert('Prüfung erfolgreich eingetragen!');
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
                window.notify.alert('Prüfungseintrag fehlgeschlagen');
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
            window.notify.alert('Bearbeiten (Platzhalter): ' + cert.title);
        },
        async deleteCertificate(cert) {
            const ok = await window.notify.confirm('Diese Urkunde löschen?');
            if (!ok) return;
            try {
                const res = await apiService.deleteCertificate(cert.id);
                if (res.success) {
                    this.certificates = this.certificates.filter(c => c.id !== cert.id);
                    window.notify.alert('Urkunde gelöscht!');
                } else {
                    window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
                }
            } catch (e) {
                console.error('Delete certificate error:', e);
                window.notify.alert('Fehler beim Löschen der Urkunde');
            }
        },
        editExam(exam) {
            this.examEditForm = {
                id: exam.id,
                date: this.toGermanDate(exam.date),
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
                // Konvertiere deutsches Datum zu ISO
                const isoDate = this.toISODate(this.examEditForm.date);
                
                // Prüfe ob Datum in der Zukunft liegt
                if (isoDate) {
                    const parts = isoDate.split('-');
                    const examDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    examDate.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (examDate > today) {
                        window.notify.alert('Das Prüfungsdatum darf nicht in der Zukunft liegen.');
                        return;
                    }
                }
                const res = await apiService.updateExam({
                    id: this.examEditForm.id,
                    userId: this.examEditForm.userId,
                    date: isoDate,
                    level: this.examEditForm.level,
                    category: this.examEditForm.category,
                    instructor: this.examEditForm.instructor,
                    comments: this.examEditForm.comments,
                    status: this.examEditForm.status
                });
                if (res.success) {
                    window.notify.alert('Prüfung erfolgreich aktualisiert!');
                    this.showExamEditModal = false;
                    await this.loadExams();
                } else {
                    window.notify.alert('Fehler beim Speichern: ' + (res.error || 'Unbekannter Fehler'));
                }
            } catch (e) {
                console.error('Update exam error:', e);
                window.notify.alert('Fehler beim Speichern der Prüfung');
            }
        },
        async deleteExam(exam) {
            const ok = await window.notify.confirm('Diesen Prüfungseintrag wirklich löschen?');
            if (!ok) return;
            try {
                const res = await apiService.deleteExam(exam.id);
                if (res.success) {
                    this.exams = this.exams.filter(e => e.id !== exam.id);
                } else {
                    window.notify.alert('Fehler beim Löschen');
                }
            } catch (e) {
                console.error('Delete exam error:', e);
                window.notify.alert('Fehler beim Löschen');
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
        // ISO-Datum (2025-12-31) zu deutschem Format (31.12.2025) konvertieren
        toGermanDate(dateStr) {
            if (!dateStr || dateStr === '0000-00-00') return '';
            // Bereits im deutschen Format?
            if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) return dateStr;
            // ISO-Format: YYYY-MM-DD
            const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (match) {
                return `${parseInt(match[3], 10)}.${parseInt(match[2], 10)}.${match[1]}`;
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
        
        // ========== NEUES ZIELE-SYSTEM (Template-basiert) ==========
        
        // Lade alle Ziel-Templates
        async loadGoalTemplates() {
            try {
                const templatesRes = await apiService.getGoalTemplates();
                this.goalTemplates = Array.isArray(templatesRes.templates) ? [...templatesRes.templates] : [];
                
                const categoriesRes = await apiService.getGoalCategories();
                this.goalCategories = Array.isArray(categoriesRes.categories) ? [...categoriesRes.categories] : [];
            } catch (error) {
                console.error('Load goal templates error:', error);
            }
        },
        
        // Lade User-Ziele (oder alle Ziele für Admin)
        async loadGoals() {
            try {
                if (this.currentUser && this.currentUser.role === 'admin') {
                    // Admin sieht alle Ziele aller User
                    const res = await apiService.getAllGoals();
                    this.allUsersGoals = res.goals || [];
                    this.goals = [];
                } else {
                    // Normale User sehen nur ihre eigenen
                    const userId = this.currentUser ? this.currentUser.id : null;
                    const res = await apiService.getGoals(userId);
                    this.goals = res.goals || [];
                    this.allUsersGoals = [];
                }
            } catch (error) {
                console.error('Load goals error:', error);
            }
        },
        
        // Ziel einem User zuweisen (sich selbst)
        async assignGoalToSelf() {
            if (!this.selectedTemplateId || !this.currentUser) return;
            
            try {
                // Datum von DD.MM.YYYY zu YYYY-MM-DD konvertieren (falls vom Datepicker)
                let targetDate = null;
                if (this.goalTargetDate) {
                    const match = this.goalTargetDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                    if (match) {
                        // Deutsches Format DD.MM.YYYY -> ISO Format YYYY-MM-DD
                        targetDate = `${match[3]}-${match[2]}-${match[1]}`;
                    } else {
                        // Falls bereits ISO Format oder anderes
                        targetDate = this.goalTargetDate;
                    }
                }
                const res = await apiService.assignGoal(this.selectedTemplateId, this.currentUser.id, targetDate);
                if (res.success) {
                    this.selectedTemplateId = null;
                    this.goalTargetDate = '';
                    await this.loadGoals();
                    window.notify.alert('Ziel erfolgreich gestartet!');
                } else {
                    window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
                }
            } catch (error) {
                console.error('Assign goal error:', error);
                window.notify.alert('Fehler beim Starten des Ziels');
            }
        },
        
        // Ziel-Details Modal öffnen
        async openGoalDetails(goal) {
            this.goalDetailsData = goal;
            try {
                const res = await apiService.getGoalProgress(goal.id);
                this.goalSubtasks = res.subtasks || [];
                this.showGoalDetailsModal = true;
            } catch (error) {
                console.error('Load goal progress error:', error);
                window.notify.alert('Fehler beim Laden der Unterziele');
            }
        },
        
        // Unterziel toggle (erledigt/nicht erledigt)
        async toggleSubtask(subtask) {
            if (!this.goalDetailsData) return;
            
            try {
                const newCompleted = !subtask.completed;
                const res = await apiService.toggleSubtask(this.goalDetailsData.id, subtask.subtask_id, newCompleted);
                
                if (res.success) {
                    // Lokal aktualisieren
                    subtask.completed = newCompleted;
                    
                    // Prüfen ob Ziel jetzt abgeschlossen ist
                    if (res.goalCompleted) {
                        window.notify.alert('Glückwunsch! Ziel erreicht! 🎉');
                        this.showGoalDetailsModal = false;
                    }
                    
                    // Ziele-Liste neu laden
                    await this.loadGoals();
                } else {
                    window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
                }
            } catch (error) {
                console.error('Toggle subtask error:', error);
                window.notify.alert('Fehler beim Aktualisieren');
            }
        },
        
        // Ziel abbrechen
        async cancelGoal(goal) {
            const ok = await window.notify.confirm('Dieses Ziel wirklich abbrechen?');
            if (!ok) return;
            
            try {
                const res = await apiService.cancelGoal(goal.id);
                if (res.success) {
                    await this.loadGoals();
                    window.notify.alert('Ziel abgebrochen');
                } else {
                    window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
                }
            } catch (error) {
                console.error('Cancel goal error:', error);
                window.notify.alert('Fehler beim Abbrechen des Ziels');
            }
        },
        
        // Ziel wiederaufnehmen
        async resumeGoal(goal) {
            const ok = await window.notify.confirm('Dieses Ziel wirklich wiederaufnehmen?');
            if (!ok) return;
            
            try {
                const res = await apiService.resumeGoal(goal.id);
                if (res.success) {
                    await this.loadGoals();
                    window.notify.alert('Ziel wiederaufgenommen');
                } else {
                    window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
                }
            } catch (error) {
                console.error('Resume goal error:', error);
                window.notify.alert('Fehler beim Wiederaufnehmen des Ziels');
            }
        },
        
        // Ziel löschen
        async deleteGoal(goal) {
            const ok = await window.notify.confirm('Dieses Ziel wirklich löschen? Dies kann nicht rückgängig gemacht werden.');
            if (!ok) return;
            
            try {
                const res = await apiService.deleteGoal(goal.id);
                if (res.success) {
                    this.goals = this.goals.filter(g => g.id !== goal.id);
                    window.notify.alert('Ziel gelöscht');
                } else {
                    window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
                }
            } catch (error) {
                console.error('Delete goal error:', error);
                window.notify.alert('Fehler beim Löschen des Ziels');
            }
        },
        
        // ========== ENDE ZIELE-SYSTEM ==========
        
        // Admin
        async loadUsers() {
            try {
                const users = await apiService.getUsers();
                // Prüfen ob es ein Array ist (bei 403 kommt ein Fehler-Objekt)
                if (!Array.isArray(users)) {
                    // Schüler haben keine Berechtigung - leere Liste ist OK
                    this.adminUserList = [];
                    return;
                }
                // Stelle sicher, dass jeder User die benötigten Properties hat
                this.adminUserList = users.map(user => ({
                    ...user,
                    _open: user._open || false,
                    _isEditing: user._isEditing || false,
                    _editForm: user._editForm || null,
                    _isSaving: user._isSaving || false,
                    _newPassword: user._newPassword || '',
                    _passwordChanged: user._passwordChanged || false,
                    _validationErrors: user._validationErrors || {}
                }));
            } catch (error) {
                // Bei 403 (keine Berechtigung) ist das OK - Schüler brauchen keine User-Liste
                this.adminUserList = [];
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
        startEditUser(user) {
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
        },
        cancelEditUser(user) {
            user._isEditing = false;
            user._editForm = null;
            user._validationErrors = {};
        },
        validateUserForm(user) {
            const errors = {};
            const form = user._editForm;
            
            // E-Mail Validierung
            if (!form.email || form.email.trim() === '') {
                errors.email = 'E-Mail ist erforderlich';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                errors.email = 'Ungültige E-Mail-Adresse';
            }
            
            // Rolle Validierung
            if (!form.role || !['schueler', 'trainer', 'admin'].includes(form.role)) {
                errors.role = 'Ungültige Rolle';
            }
            
            // Passwort Validierung (nur wenn angegeben)
            if (form.newPassword && form.newPassword.trim() !== '') {
                if (form.newPassword.length < 6) {
                    errors.newPassword = 'Passwort muss mindestens 6 Zeichen lang sein';
                }
            }
            
            user._validationErrors = errors;
            return Object.keys(errors).length === 0;
        },
        async saveUser(user) {
            if (!user._isEditing) {
                return;
            }
            
            // Validierung
            if (!this.validateUserForm(user)) {
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
                console.error('Save user error:', e);
                await window.notify.alert('Fehler beim Speichern: ' + (e.message || 'Unbekannter Fehler'));
            } finally {
                user._isSaving = false;
            }
        },
        validateCreateUserForm() {
            const errors = {};
            const form = this.createUserForm;
            
            // Benutzername Validierung
            if (!form.username || form.username.trim() === '') {
                errors.username = 'Benutzername ist erforderlich';
            } else if (form.username.trim().length < 3) {
                errors.username = 'Benutzername muss mindestens 3 Zeichen lang sein';
            }
            
            // E-Mail Validierung
            if (!form.email || form.email.trim() === '') {
                errors.email = 'E-Mail ist erforderlich';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                errors.email = 'Ungültige E-Mail-Adresse';
            }
            
            // Passwort Validierung (beim Create erforderlich)
            if (!form.password || form.password.trim() === '') {
                errors.password = 'Passwort ist erforderlich';
            } else if (form.password.length < 6) {
                errors.password = 'Passwort muss mindestens 6 Zeichen lang sein';
            }
            
            // Rolle Validierung
            if (!form.role || !['schueler', 'trainer', 'admin'].includes(form.role)) {
                errors.role = 'Ungültige Rolle';
            }
            
            this.createUserForm._validationErrors = errors;
            return Object.keys(errors).length === 0;
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
                phone: '',
                role: 'schueler',
                school: '',
                beltLevel: '',
                verifiedTrainer: false,
                _validationErrors: {},
                _isSaving: false
            };
        },
        async createUser() {
            // Client-Validierung
            if (!this.validateCreateUserForm()) {
                await window.notify.alert('Bitte korrigieren Sie die Fehler in den Feldern.');
                return;
            }
            
            this.createUserForm._isSaving = true;
            
            try {
                const form = this.createUserForm;
                
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
                            this.createUserForm._validationErrors = { username: 'Dieser Benutzername ist bereits vergeben' };
                        } else if (res.error.toLowerCase().includes('e-mail') || res.error.toLowerCase().includes('email')) {
                            this.createUserForm._validationErrors = { email: 'Diese E-Mail-Adresse ist bereits vergeben' };
                        } else {
                            this.createUserForm._validationErrors = { username: res.error };
                        }
                        await window.notify.alert('Bitte korrigieren Sie die Fehler in den Feldern.');
                        return;
                    }
                    throw new Error(res.error || 'Benutzer konnte nicht erstellt werden');
                }
                
                // Erfolg: Modal schließen und Liste neu laden
                this.closeCreateUserModal();
                
                // Benutzerliste neu laden, damit neue Kartei sofort erscheint
                await this.loadUsers();
                
                await window.notify.alert('Benutzer erfolgreich erstellt.');
                
            } catch (e) {
                console.error('Create user error:', e);
                await window.notify.alert('Fehler beim Erstellen des Benutzers: ' + (e.message || 'Unbekannter Fehler'));
            } finally {
                this.createUserForm._isSaving = false;
            }
        },
        addPasskey(user) {
            const key = (user._newPasskey || '').trim();
            if (!key) return;
            const current = Array.isArray(user.passkeys) ? user.passkeys : [];
            if (current.includes(key)) return window.notify.alert('Passkey existiert bereits.');
            user.passkeys = [...current, key];
            user._newPasskey = '';
        },
        removePasskey(user, key) {
            const current = Array.isArray(user.passkeys) ? user.passkeys : [];
            user.passkeys = current.filter(k => k !== key);
        },
        async deleteUser(user) {
            const ok = await window.notify.confirm('Benutzer wirklich löschen?');
            if (!ok) return;
            try {
                const res = await apiService.deleteUser(user.id);
                if (res.success) {
                    this.adminUserList = this.adminUserList.filter(u => u.id !== user.id);
                    await window.notify.alert('Benutzer erfolgreich gelöscht.');
                } else {
                    await window.notify.alert('Fehler beim Löschen: ' + (res.error || 'Unbekannter Fehler'));
                }
            } catch (e) {
                console.error('Delete user error:', e);
                await window.notify.alert('Fehler beim Löschen des Benutzers');
            }
        },
        async changeUserPassword(user) {
            if (!user._newPassword || user._newPassword.length < 3) {
                window.notify.alert('Passwort muss mindestens 3 Zeichen lang sein');
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
                console.error('Change password error:', e);
                window.notify.alert('Fehler beim Ändern des Passworts');
            }
        },
        
        // Profil speichern
        async saveProfile() {
            try {
                const res = await apiService.updateProfile(this.profileForm);
                if (res.success) {
                    // Lokale User-Daten aktualisieren
                    this.currentUser = {
                        ...this.currentUser,
                        ...this.profileForm
                    };
                    // LocalStorage aktualisieren
                    persistAuthState(this.currentUser);
                    await window.notify.alert('Profil erfolgreich gespeichert!');
                } else {
                    await window.notify.alert('Fehler: ' + (res.error || 'Profil konnte nicht gespeichert werden'));
                }
            } catch (e) {
                console.error('Save profile error:', e);
                await window.notify.alert('Fehler beim Speichern des Profils');
            }
        },
        
        // Eigenes Passwort ändern
        async changePassword() {
            if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
                await window.notify.alert('Die Passwörter stimmen nicht überein');
                return;
            }
            if (this.passwordForm.newPassword.length < 4) {
                await window.notify.alert('Das neue Passwort muss mindestens 4 Zeichen lang sein');
                return;
            }
            
            try {
                const res = await apiService.changeOwnPassword(
                    this.passwordForm.currentPassword,
                    this.passwordForm.newPassword
                );
                if (res.success) {
                    // Formular zurücksetzen
                    this.passwordForm = {
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    };
                    await window.notify.alert('Passwort erfolgreich geändert!');
                } else {
                    await window.notify.alert('Fehler: ' + (res.error || 'Passwort konnte nicht geändert werden'));
                }
            } catch (e) {
                console.error('Change password error:', e);
                await window.notify.alert('Fehler beim Ändern des Passworts');
            }
        },
        
        // Daten laden
        async loadPageData() {
            switch (this.currentPage) {
                case 'certificates':
                    await this.loadCertificates();
                    await this.loadUsers();
                    await this.loadGrades();
                    break;
                case 'exams':
                    await this.loadExams();
                    await this.loadGrades();
                    // Nur für Admin/Trainer Users und Gruppen laden (für Schüler-Zuweisung)
                    if (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'trainer')) {
                        await this.loadUsers();
                        await this.loadGroups();
                    }
                    break;
                case 'goals':
                    await this.loadGoalTemplates();
                    await this.loadGoals();
                    break;
                case 'trainingHistory':
                    try {
                        this.trainingHistory = await apiService.getTrainingHistory();
                    } catch (error) {
                        console.error('Load training history error:', error);
                    }
                    break;
                case 'courses':
                    await this.loadCourses();
                    // Für Admin/Trainer Users und Gruppen laden (für Schüler-Zuweisung)
                    if (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'trainer')) {
                        await this.loadUsers();
                        await this.loadGroups();
                    }
                    break;
                case 'admin':
                    await this.loadUsers();
                    await this.loadGrades();
                    break;
                case 'settings':
                    this.loadPresets();
                    await this.loadUsers();
                    await this.loadGroups();
                    await this.loadGoalTemplates();
                    await this.loadGrades();
                    await this.loadCertificateSettings();
                    break;
                case 'profile':
                    // Profil-Daten frisch aus der Datenbank laden
                    await this.loadGrades();
                    try {
                        const res = await apiService.getOwnProfile();
                        if (res.success && res.user) {
                            this.profileForm = {
                                firstName: res.user.firstName || '',
                                lastName: res.user.lastName || '',
                                email: res.user.email || '',
                                phone: res.user.phone || '',
                                school: res.user.school || '',
                                beltLevel: res.user.beltLevel || ''
                            };
                        }
                    } catch (e) {
                        console.error('Load profile error:', e);
                        // Fallback: currentUser verwenden
                        if (this.currentUser) {
                            this.profileForm = {
                                firstName: this.currentUser.firstName || '',
                                lastName: this.currentUser.lastName || '',
                                email: this.currentUser.email || '',
                                phone: this.currentUser.phone || '',
                                school: this.currentUser.school || '',
                                beltLevel: this.currentUser.beltLevel || ''
                            };
                        }
                    }
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
            if (!name) return window.notify.alert('Bitte einen Gruppennamen angeben.');
            if (!ids.length) return window.notify.alert('Mindestens einen Schüler auswählen.');
            
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
                    window.notify.alert(response.error || 'Fehler beim Erstellen');
                }
            } catch (e) {
                console.error('Save group error:', e);
                window.notify.alert('Fehler beim Speichern der Gruppe');
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
                window.notify.alert('Bitte einen Gruppennamen angeben.');
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
                    window.notify.alert(response.error || 'Fehler beim Speichern');
                }
            } catch (e) {
                console.error('Save group error:', e);
                window.notify.alert('Fehler beim Speichern der Gruppe');
            }
        },
        async removeGroup(grp) {
            const ok = await window.notify.confirm('Gruppe löschen?');
            if (!ok) return;
            
            try {
                const response = await apiService.deleteGroup(grp.id);
                if (response.success) {
                    await this.loadGroups();
                } else {
                    window.notify.alert(response.error || 'Fehler beim Löschen');
                }
            } catch (e) {
                console.error('Delete group error:', e);
                window.notify.alert('Fehler beim Löschen der Gruppe');
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
            const ok = await window.notify.confirm('Preset löschen?');
            if (!ok) return;
            this.certificatePresets = this.certificatePresets.filter(x => x.id !== preset.id);
            this.savePresets();
        },
        setSettingsTab(tab) {
            this.currentSettingsTab = tab;
            // Optional: Scroll to top on mobile for better UX
            try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}
        },
        
        // ========== GRADE CRUD ==========
        
        async loadGrades() {
            try {
                const res = await apiService.getGrades();
                if (res.success) {
                    this.grades = res.grades || [];
                }
            } catch (error) {
                console.error('Load grades error:', error);
            }
        },
        
        resetGradeForm() {
            this.gradeForm = {
                id: null,
                name: '',
                sort_order: this.grades.length + 1,
                color: '#FFEB3B'
            };
        },
        
        editGrade(grade) {
            this.gradeForm = {
                id: grade.id,
                name: grade.name,
                sort_order: grade.sort_order,
                color: grade.color || '#FFEB3B'
            };
        },
        
        async saveGrade() {
            const { id, name, sort_order, color } = this.gradeForm;
            
            try {
                let res;
                if (id) {
                    res = await apiService.updateGrade(id, name, sort_order, color);
                } else {
                    res = await apiService.createGrade(name, sort_order, color);
                }
                
                if (res.success) {
                    this.resetGradeForm();
                    await this.loadGrades();
                    window.notify.alert(id ? 'Grad aktualisiert' : 'Grad erstellt');
                } else {
                    window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
                }
            } catch (error) {
                console.error('Save grade error:', error);
                window.notify.alert('Fehler beim Speichern des Grads');
            }
        },
        
        async deleteGrade(grade) {
            const ok = await window.notify.confirm('Diesen Grad wirklich löschen?');
            if (!ok) return;
            
            try {
                const res = await apiService.deleteGrade(grade.id);
                if (res.success) {
                    await this.loadGrades();
                    window.notify.alert('Grad gelöscht');
                } else {
                    window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
                }
            } catch (error) {
                console.error('Delete grade error:', error);
                window.notify.alert('Fehler beim Löschen des Grads');
            }
        },
        
        // ========== GOAL TEMPLATE CRUD ==========
        
        addGoalSubtask() {
            this.goalTemplateForm.subtasks.push('');
        },
        
        removeGoalSubtask(index) {
            this.goalTemplateForm.subtasks.splice(index, 1);
        },
        
        resetGoalTemplateForm() {
            this.goalTemplateForm = {
                id: null,
                title: '',
                definition: '',
                category: '',
                subtasks: []
            };
        },
        
        async saveGoalTemplate() {
            const { id, title, definition, category, subtasks } = this.goalTemplateForm;
            
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
                    this.resetGoalTemplateForm();
                    await this.loadGoalTemplates();
                    window.notify.alert(id ? 'Ziel-Vorlage aktualisiert!' : 'Ziel-Vorlage erstellt!');
                } else {
                    window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
                }
            } catch (error) {
                console.error('Save goal template error:', error);
                window.notify.alert('Fehler beim Speichern');
            }
        },
        
        async editGoalTemplate(template) {
            try {
                // Details mit Unterzielen laden
                const res = await apiService.getTemplateDetails(template.id);
                if (res.success && res.template) {
                    this.goalTemplateForm = {
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
                console.error('Edit goal template error:', error);
                window.notify.alert('Fehler beim Laden');
            }
        },
        
        async deleteGoalTemplate(template) {
            const ok = await window.notify.confirm(`Ziel-Vorlage "${template.title}" wirklich löschen?\n\nHinweis: Vorlagen können nur gelöscht werden, wenn sie nicht mehr von Schülern verwendet werden.`);
            if (!ok) return;
            
            try {
                const res = await apiService.deleteGoalTemplate(template.id);
                if (res.success) {
                    window.notify.alert('Ziel-Vorlage gelöscht!');
                    await this.loadGoalTemplates();
                } else {
                    // Bessere Fehlermeldung für "wird noch verwendet"
                    if (res.error && res.error.includes('verwendet')) {
                        window.notify.alert('Diese Vorlage kann nicht gelöscht werden, da sie noch von Schülern verwendet wird. Bitte beenden Sie zuerst alle zugewiesenen Ziele.');
                    } else {
                        window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
                    }
                }
            } catch (error) {
                console.error('Delete goal template error:', error);
                window.notify.alert('Fehler beim Löschen');
            }
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
                    window.notify.alert('Kurs erstellt.');
                    this.courseForm = { 
                        title: '', date: '', instructor: '', duration: '', 
                        max_participants: 20, price: '', description: '', 
                        status: 'approved', userId: null, userIds: [], 
                        studentQuery: '', selectedStudents: [] 
                    };
                    await this.loadCourses();
                } else {
                    window.notify.alert('Fehler: ' + (res.error || 'Unbekannt'));
                }
            } catch (e) {
                console.error('Add course error:', e);
                window.notify.alert('Kurs konnte nicht erstellt werden.');
            }
        },
        editCourse(course) {
            // Modal öffnen mit Kursdaten
            // Ungültige Daten (0000-00-00) als leer behandeln, sonst ins deutsche Format konvertieren
            let courseDate = course.date || '';
            if (courseDate === '0000-00-00') {
                courseDate = '';
            } else if (courseDate) {
                courseDate = this.toGermanDate(courseDate);
            }
            
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
                // Konvertiere deutsches Datum zu ISO
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
                    window.notify.alert('Fehler beim Speichern: ' + (res.error || 'Unbekannt'));
                }
            } catch (e) {
                console.error('Update course error:', e);
                window.notify.alert('Kurs konnte nicht aktualisiert werden.');
            }
        },
        async removeCourse(course) {
            const ok = await window.notify.confirm('Diesen Kurs wirklich löschen?');
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
            this.participantsAddMode = false;
            this.participantsSearchQuery = '';
            this.showParticipantsModal = true;
            try {
                const participants = await apiService.getCourseParticipants(course.id);
                this.participantsList = Array.isArray(participants) ? participants : [];
            } catch (e) {
                console.error('Load participants error:', e);
            }
        },
        
        closeParticipantsModal() {
            this.showParticipantsModal = false;
            this.participantsModalCourse = null;
            this.participantsList = [];
            this.participantsAddMode = false;
            this.participantsSearchQuery = '';
        },
        
        async addParticipantToCourse(user) {
            if (!this.participantsModalCourse) return;
            try {
                const res = await apiService.addCourseParticipant(this.participantsModalCourse.id, user.id);
                if (res.success) {
                    // Teilnehmerliste neu laden
                    const participants = await apiService.getCourseParticipants(this.participantsModalCourse.id);
                    this.participantsList = Array.isArray(participants) ? participants : [];
                    this.participantsAddMode = false;
                    this.participantsSearchQuery = '';
                    // Kursliste aktualisieren für korrekte Teilnehmerzahl
                    await this.loadCourses();
                } else {
                    window.notify.alert(res.error || 'Fehler beim Hinzufügen');
                }
            } catch (e) {
                console.error('Add participant error:', e);
                window.notify.alert('Fehler beim Hinzufügen des Teilnehmers');
            }
        },
        
        async addGroupToCourse(group) {
            if (!this.participantsModalCourse) return;
            if (!group.memberIds || group.memberIds.length === 0) {
                window.notify.alert('Diese Gruppe hat keine Mitglieder');
                return;
            }
            
            // Bereits vorhandene Teilnehmer IDs sammeln
            const currentIds = this.participantsList.map(p => p.user_id);
            // Nur neue Mitglieder hinzufügen
            const newMemberIds = group.memberIds.filter(id => !currentIds.includes(id));
            
            if (newMemberIds.length === 0) {
                window.notify.alert('Alle Mitglieder dieser Gruppe sind bereits im Kurs');
                return;
            }
            
            let added = 0;
            let failed = 0;
            
            for (const userId of newMemberIds) {
                try {
                    const res = await apiService.addCourseParticipant(this.participantsModalCourse.id, userId);
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
            const participants = await apiService.getCourseParticipants(this.participantsModalCourse.id);
            this.participantsList = Array.isArray(participants) ? participants : [];
            this.participantsAddMode = false;
            this.participantsSearchQuery = '';
            // Kursliste aktualisieren für korrekte Teilnehmerzahl
            await this.loadCourses();
            
            if (failed > 0) {
                window.notify.alert(`${added} Mitglieder hinzugefügt, ${failed} fehlgeschlagen (evtl. bereits angemeldet oder Kurs voll)`);
            } else {
                await window.notify.alert(`${added} Mitglieder aus "${group.name}" hinzugefügt`);
            }
        },
        
        async removeParticipantFromCourse(userId) {
            if (!this.participantsModalCourse) return;
            const ok = await window.notify.confirm('Teilnehmer wirklich entfernen?');
            if (!ok) return;
            try {
                const res = await apiService.removeCourseParticipant(this.participantsModalCourse.id, userId);
                if (res.success) {
                    // Teilnehmer aus Liste entfernen
                    this.participantsList = this.participantsList.filter(p => p.user_id !== userId);
                    // Kursliste aktualisieren für korrekte Teilnehmerzahl
                    await this.loadCourses();
                } else {
                    window.notify.alert(res.error || 'Fehler beim Entfernen');
                }
            } catch (e) {
                console.error('Remove participant error:', e);
                window.notify.alert('Fehler beim Entfernen des Teilnehmers');
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
                    window.notify.alert('Erfolgreich angemeldet!');
                    await this.loadCourses();
                } else {
                    window.notify.alert('Anmeldung fehlgeschlagen: ' + (res.error || 'Unbekannt'));
                }
            } catch (e) {
                console.error('Book course error:', e);
                window.notify.alert('Anmeldung fehlgeschlagen.');
            }
        },
        
        // Schüler: Von Kurs abmelden
        async cancelBooking(course) {
            const ok = await window.notify.confirm('Wirklich vom Kurs abmelden?');
            if (!ok) return;
            try {
                const res = await apiService.cancelCourseBooking(course.id);
                if (res.success) {
                    window.notify.alert('Erfolgreich abgemeldet.');
                    await this.loadCourses();
                } else {
                    window.notify.alert('Abmeldung fehlgeschlagen: ' + (res.error || 'Unbekannt'));
                }
            } catch (e) {
                console.error('Cancel booking error:', e);
                window.notify.alert('Abmeldung fehlgeschlagen.');
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
                await this.loadGrades();
            } else {
                // Fallback zu altem System
                const savedUsername = getCachedUsername();
                if (savedUsername) {
                    this.isLoggedIn = true;
                    this.currentUser = demoData.user;
                    await this.loadExams();
                    await this.loadCourses();
                    await this.loadGrades();
                }
            }
        }
});

// Globale Komponenten registrieren
registerGlobalComponents(app);

// Starte Anwendung
app.mount('#app');