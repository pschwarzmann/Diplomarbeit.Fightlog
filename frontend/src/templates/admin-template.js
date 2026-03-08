/**
 * Admin Page Template
 * Enthält das Template für die Admin-Seite
 */

export const adminTemplate = `
                <div v-else-if="currentPage === 'admin' && currentUser && currentUser.role === 'admin'">
                    <div style="padding: 2rem 0;">
                        <div class="container">
                            <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <button @click="goToDashboard" class="back-btn" aria-label="Zurück zum Dashboard">
                                        <i class="fas fa-arrow-left" aria-hidden="true"></i>
                                        Zurück
                                    </button>
                                    <h1 style="margin: 0;">{{ t('adminPanel') }}</h1>
                                </div>
                                <button @click="showCreateUserModal = true" class="btn btn-primary btn-auto" aria-label="Neuen Benutzer anlegen">
                                    <i class="fas fa-user-plus" aria-hidden="true"></i> Benutzer anlegen
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
                                            <div class="caret" :class="{ open: user._open }"><i class="fas fa-chevron-down" aria-hidden="true"></i></div>
                                        </div>
                                        <transition name="collapse">
                                            <div v-if="user._open" class="collapsible-body" @click.stop>
                                                <!-- Benutzer-Informationen -->
                                                <div class="user-info-section">
                                                    <!-- Read-Only Mode -->
                                                    <template v-if="!user._isEditing">
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-user" aria-hidden="true"></i> Benutzername:</span>
                                                            <span class="info-value">
                                                                {{ user.username }}
                                                                <i class="fas fa-key" style="margin-left: 0.5rem; color: #94a3b8; font-size: 0.75rem;" title="Eindeutiger Identifikator" aria-hidden="true"></i>
                                                            </span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-envelope" aria-hidden="true"></i> E-Mail:</span>
                                                            <span class="info-value">
                                                                {{ user.email }}
                                                                <i class="fas fa-key" style="margin-left: 0.5rem; color: #94a3b8; font-size: 0.75rem;" title="Eindeutiger Identifikator" aria-hidden="true"></i>
                                                            </span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-user-tag" aria-hidden="true"></i> Rolle:</span>
                                                            <span class="info-value">{{ roleLabel(user.role) }}</span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-signature" aria-hidden="true"></i> Vorname:</span>
                                                            <span class="info-value">
                                                                <span :class="{ 'empty-value': !user.firstName }">{{ user.firstName || '—' }}</span>
                                                                <i v-if="user.firstName" class="fas fa-key" style="margin-left: 0.5rem; color: #94a3b8; font-size: 0.75rem;" title="Eindeutiger Identifikator" aria-hidden="true"></i>
                                                            </span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-signature" aria-hidden="true"></i> Nachname:</span>
                                                            <span class="info-value">
                                                                <span :class="{ 'empty-value': !user.lastName }">{{ user.lastName || '—' }}</span>
                                                                <i v-if="user.lastName" class="fas fa-key" style="margin-left: 0.5rem; color: #94a3b8; font-size: 0.75rem;" title="Eindeutiger Identifikator" aria-hidden="true"></i>
                                                            </span>
                                                        </div>
                                                        <div class="info-row" v-if="user.name">
                                                            <span class="info-label"><i class="fas fa-id-card" aria-hidden="true"></i> Vollständiger Name:</span>
                                                            <span class="info-value">{{ user.name }}</span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-phone" aria-hidden="true"></i> Telefon:</span>
                                                            <span class="info-value">
                                                                <span :class="{ 'empty-value': !user.phone }">{{ user.phone || '—' }}</span>
                                                            </span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-school" aria-hidden="true"></i> Schule:</span>
                                                            <span class="info-value">
                                                                <span :class="{ 'empty-value': !user.school }">{{ user.school || '—' }}</span>
                                                            </span>
                                                        </div>
                                                        <div class="info-row">
                                                            <span class="info-label"><i class="fas fa-medal" aria-hidden="true"></i> Gürtelgrad:</span>
                                                            <span class="info-value">
                                                                <span :class="{ 'empty-value': !user.beltLevel }">{{ user.beltLevel || '—' }}</span>
                                                            </span>
                                                        </div>
                                                    </template>
                                                    
                                                    <!-- Edit Mode -->
                                                    <template v-else>
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-envelope" aria-hidden="true"></i> E-Mail *</label>
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
                                                            <label class="form-label"><i class="fas fa-signature" aria-hidden="true"></i> Vorname</label>
                                                            <input 
                                                                type="text" 
                                                                v-model="user._editForm.firstName" 
                                                                class="form-control"
                                                                placeholder="Vorname"
                                                            >
                                                        </div>
                                                        
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-signature" aria-hidden="true"></i> Nachname</label>
                                                            <input 
                                                                type="text" 
                                                                v-model="user._editForm.lastName" 
                                                                class="form-control"
                                                                placeholder="Nachname"
                                                            >
                                                        </div>
                                                        
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-phone" aria-hidden="true"></i> Telefon</label>
                                                            <input 
                                                                type="tel" 
                                                                v-model="user._editForm.phone" 
                                                                class="form-control"
                                                                placeholder="Telefonnummer"
                                                            >
                                                        </div>
                                                        
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-school" aria-hidden="true"></i> Schule</label>
                                                            <input 
                                                                type="text" 
                                                                v-model="user._editForm.school" 
                                                                class="form-control"
                                                                placeholder="Schule"
                                                            >
                                                        </div>
                                                        
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-medal" aria-hidden="true"></i> Gürtelgrad</label>
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
                                                            <label class="form-label"><i class="fas fa-key" aria-hidden="true"></i> Passwort ändern (optional)</label>
                                                            <input 
                                                                type="password" 
                                                                v-model="user._editForm.newPassword" 
                                                                class="form-control"
                                                                :class="{ 'error': user._validationErrors.newPassword }"
                                                                placeholder="Neues Passwort (leer lassen, um nicht zu ändern)"
                                                            >
                                                            <span v-if="user._validationErrors.newPassword" class="error-message">{{ user._validationErrors.newPassword }}</span>

                                                        </div>
                                                        
                                                        <!-- Rolle ändern -->
                                                        <div class="form-group">
                                                            <label class="form-label"><i class="fas fa-user-tag" aria-hidden="true"></i> Rolle *</label>
                                                            <select v-model="user._editForm.role" class="form-control no-custom-select" :class="{ 'error': user._validationErrors.role }">
                                                                <option value="schueler">Schüler</option>
                                                                <option value="trainer">Trainer</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                            <span v-if="user._validationErrors.role" class="error-message">{{ user._validationErrors.role }}</span>
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
                                                        <i v-if="user._isSaving" class="fas fa-spinner fa-spin" aria-hidden="true"></i>
                                                        <i v-else-if="user._isEditing" class="fas fa-save" aria-hidden="true"></i>
                                                        <i v-else class="fas fa-edit" aria-hidden="true"></i>
                                                        <span class="btn-text">{{ user._isSaving ? 'Speichert...' : (user._isEditing ? 'Speichern' : 'Ändern') }}</span>
                                                    </button>
                                                    <button 
                                                        v-if="user._isEditing" 
                                                        class="btn btn-secondary btn-sm" 
                                                        @click="cancelEditUser(user)"
                                                        :disabled="user._isSaving"
                                                    >
                                                        <i class="fas fa-times" aria-hidden="true"></i> <span class="btn-text">Abbrechen</span>
                                                    </button>
                                                    <button 
                                                        class="btn btn-danger btn-sm" 
                                                        @click="deleteUser(user)" 
                                                        aria-label="Benutzer löschen"
                                                        :disabled="user._isEditing || user._isSaving"
                                                    >
                                                        <i class="fas fa-trash" aria-hidden="true"></i> <span class="btn-text">Löschen</span>
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
`;
