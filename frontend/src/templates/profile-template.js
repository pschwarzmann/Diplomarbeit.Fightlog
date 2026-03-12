/**
 * Profile Page Template
 * Enthält das Template für die Profil-Seite
 */

export const profileTemplate = `
                <div v-else-if="currentPage === 'profile' && currentUser">
                    <div class="page-content">
                        <div class="container">
                            <div class="page-header">
                                <div class="page-header-main">
                                    <button @click="goToDashboard" class="back-btn" aria-label="Zurück zum Dashboard">
                                        <i class="fas fa-arrow-left" aria-hidden="true"></i>
                                        Zurück
                                    </button>
                                    <h1 class="m-0"><i class="fas fa-user" aria-hidden="true"></i> Mein Profil</h1>
                                </div>
                            </div>

                            <div class="form-container profile-form-container">
                                <form @submit.prevent="saveProfile" class="profile-form-grid">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="profile-firstname">Vorname *</label>
                                            <input id="profile-firstname" type="text" v-model="profileForm.firstName" class="form-control" required autocomplete="given-name" aria-required="true">
                                        </div>
                                        <div class="form-group">
                                            <label for="profile-lastname">Nachname *</label>
                                            <input id="profile-lastname" type="text" v-model="profileForm.lastName" class="form-control" required autocomplete="family-name" aria-required="true">
                                        </div>
                                    </div>
                                    
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="profile-username">Benutzername</label>
                                            <input id="profile-username" type="text" :value="currentUser.username" class="form-control input-disabled" disabled aria-label="Benutzername (nicht änderbar)">
                                            <small class="text-muted">Benutzername kann nicht geändert werden</small>
                                        </div>
                                        <div class="form-group">
                                            <label for="profile-email">E-Mail *</label>
                                            <input id="profile-email" type="email" v-model="profileForm.email" class="form-control" required autocomplete="email" aria-required="true">
                                        </div>
                                    </div>
                                    
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="profile-phone">Telefon</label>
                                            <input id="profile-phone" type="tel" v-model="profileForm.phone" class="form-control" placeholder="+49 123 456789" autocomplete="tel">
                                        </div>
                                        <div class="form-group">
                                            <label for="profile-school">Schule</label>
                                            <input id="profile-school" type="text" v-model="profileForm.school" class="form-control" placeholder="z.B. Kampfsport Akademie Berlin" autocomplete="organization">
                                        </div>
                                    </div>
                                    
                                    <div class="form-row form-row-single" v-if="currentUser && currentUser.role !== 'schueler'">
                                        <div class="form-group">
                                            <label for="profile-belt-level">Gürtelgrad</label>
                                            <select id="profile-belt-level" v-model="profileForm.beltLevel" class="form-control" aria-label="Gürtelgrad auswählen">
                                                <option value="">Bitte wählen</option>
                                                <option v-for="grade in grades" :key="grade.id" :value="grade.name">{{ grade.name }}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="form-row form-row-single" v-else>
                                        <div class="form-group">
                                            <label for="profile-belt-level-readonly">Gürtelgrad</label>
                                            <input id="profile-belt-level-readonly" type="text" :value="profileForm.beltLevel || 'Nicht zugewiesen'" class="form-control" disabled 
                                                :style="{ 
                                                    backgroundColor: grades.find(g => g.name === profileForm.beltLevel)?.color || '#1e293b',
                                                    color: ['#FFFFFF', '#FFEB3B', '#FFC107', '#FF9800'].includes(grades.find(g => g.name === profileForm.beltLevel)?.color) ? '#1e293b' : '#fff',
                                                    border: grades.find(g => g.name === profileForm.beltLevel)?.color === '#FFFFFF' ? '2px solid #94a3b8' : 'none',
                                                    cursor: 'not-allowed',
                                                    fontWeight: '600'
                                                }" 
                                                aria-label="Gürtelgrad (nur Trainer kann ändern)">
                                            <small class="text-muted">Der Gürtelgrad kann nur von einem Trainer geändert werden.</small>
                                        </div>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary mt-md">
                                        <i class="fas fa-save" aria-hidden="true"></i> Profil speichern
                                    </button>
                                </form>
                                
                                <!-- Passwort ändern -->
                                <div class="profile-password-section">
                                    <h3 class="mb-md"><i class="fas fa-key" aria-hidden="true"></i> Passwort ändern</h3>
                                    <form @submit.prevent="changePassword" class="profile-form-grid">
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="current-password">Aktuelles Passwort *</label>
                                                <input id="current-password" type="password" v-model="passwordForm.currentPassword" class="form-control" required autocomplete="current-password" aria-required="true">
                                            </div>
                                            <div class="form-group">
                                                <label for="new-password">Neues Passwort *</label>
                                                <input id="new-password" type="password" v-model="passwordForm.newPassword" class="form-control" required :minlength="generalSettings?.password_min_length || 8" autocomplete="new-password" aria-required="true" :aria-describedby="generalSettings?.password_min_length ? 'password-help' : undefined">
                                                <small v-if="generalSettings?.password_min_length" id="password-help" class="text-muted">Mindestlänge: {{ generalSettings.password_min_length }} Zeichen</small>
                                            </div>
                                        </div>
                                        <div class="form-row form-row-single">
                                            <div class="form-group">
                                                <label for="confirm-password">Neues Passwort bestätigen *</label>
                                                <input id="confirm-password" type="password" v-model="passwordForm.confirmPassword" class="form-control" required autocomplete="new-password" aria-required="true">
                                            </div>
                                        </div>
                                        <button type="submit" class="btn btn-secondary" :disabled="!passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword" aria-label="Passwort ändern">
                                            <i class="fas fa-lock" aria-hidden="true"></i> Passwort ändern
                                        </button>
                                        <p v-if="passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword" class="text-danger mt-sm" role="alert" aria-live="polite">
                                            Passwörter stimmen nicht überein
                                        </p>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`;
