/**
 * Modals Template
 * Enthält alle Modals der Anwendung
 */

export const modalsTemplate = `
                <!-- Kurs bearbeiten Modal -->
                <div v-if="showCourseEditModal" class="modal-overlay modal-overlay-standard" @click.self="showCourseEditModal = false" role="dialog" aria-labelledby="course-edit-title" aria-modal="true">
                    <div class="modal-content form-container modal-sm">
                        <h2 id="course-edit-title">Kurs bearbeiten</h2>
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
                            <div class="flex gap-md mt-md">
                                <button type="submit" class="btn btn-primary" aria-label="Kurs speichern">Speichern</button>
                                <button type="button" class="btn btn-secondary" @click="showCourseEditModal = false" aria-label="Abbrechen">Abbrechen</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Teilnehmer Modal (erweitert für Admin/Trainer) -->
                <div v-if="showParticipantsModal" class="modal-overlay modal-overlay-standard" @click.self="closeParticipantsModal" role="dialog" aria-labelledby="participants-modal-title" aria-modal="true">
                    <div class="modal-content form-container modal-md">
                        <div class="modal-header flex-between">
                            <h2 id="participants-modal-title"><i class="fas fa-users" aria-hidden="true"></i> Teilnehmer</h2>
                            <button @click="closeParticipantsModal" class="close-btn modal-close-btn" aria-label="Modal schließen">
                                <i class="fas fa-times" aria-hidden="true"></i>
                            </button>
                        </div>
                        <p v-if="participantsModalCourse" class="text-muted mb-md">
                            {{ participantsModalCourse.title }} — {{ participantsList.length }} / {{ participantsModalCourse.max_participants }} Teilnehmer
                        </p>
                        
                        <!-- Teilnehmer hinzufügen (Admin/Trainer) -->
                        <div v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')" class="mb-md">
                            <div class="flex-between mb-sm">
                                <label class="fw-600">Teilnehmer hinzufügen:</label>
                                <button type="button" class="btn btn-success btn-sm" @click="participantsAddMode = !participantsAddMode">
                                    <i class="fas fa-plus"></i> Hinzufügen
                                </button>
                            </div>
                            <div v-if="participantsAddMode" class="participants-add-box">
                                <input type="text" v-model="participantsSearchQuery" class="form-control" placeholder="Gruppe oder Schüler suchen..." @keydown.enter.prevent>
                                <div v-if="participantsSearchQuery && (filteredGroupsForCourse.length || filteredStudentsForCourse.length)" class="mt-sm participants-search-results">
                                    <!-- Gruppen -->
                                    <div v-for="g in filteredGroupsForCourse" :key="'g_'+g.id" class="participants-option participants-option-group" @click="addGroupToCourse(g)">
                                        <i class="fas fa-users"></i> {{ g.name }} <span class="text-muted fw-400">(Gruppe - {{ g.memberIds ? g.memberIds.length : 0 }} Mitglieder)</span>
                                    </div>
                                    <!-- Einzelne Schüler -->
                                    <div v-for="u in filteredStudentsForCourse" :key="u.id" class="participants-option" @click="addParticipantToCourse(u)">
                                        {{ u.name }} <span class="text-muted">(@{{ u.username }})</span>
                                    </div>
                                </div>
                                <div v-if="participantsSearchQuery && !filteredGroupsForCourse.length && !filteredStudentsForCourse.length" class="mt-sm text-muted" style="font-size: 0.9rem;">Keine Gruppen oder Schüler gefunden</div>
                            </div>
                        </div>
                        
                        <!-- Teilnehmerliste -->
                        <div v-if="participantsList.length === 0" class="text-muted text-center p-lg">
                            Keine Teilnehmer angemeldet.
                        </div>
                        <div v-else class="participants-list">
                            <div v-for="p in participantsList" :key="p.id" class="participants-list-item">
                                <div>
                                    <span class="fw-500">{{ p.name }}</span>
                                    <span class="text-muted ml-sm">(@{{ p.username }})</span>
                                    <div class="text-tertiary" style="font-size: 0.8rem;">{{ formatDateTime(p.booking_date) }}</div>
                                </div>
                                <button v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')" 
                                        @click="removeParticipantFromCourse(p.user_id)" 
                                        class="btn btn-danger btn-sm" title="Entfernen">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="mt-md flex flex-end">
                            <button class="btn btn-secondary" @click="closeParticipantsModal" aria-label="Modal schließen">Schließen</button>
                        </div>
                    </div>
                </div>

                <!-- Modal: Benutzer erstellen (nur Admin) -->
                <div v-if="showCreateUserModal" class="modal-overlay modal-overlay-standard" @click.self="closeCreateUserModal" role="dialog" aria-labelledby="create-user-title" aria-modal="true">
                    <div class="modal-content form-container modal-sm modal-scroll" @click.stop>
                        <div class="modal-header flex-between mb-lg">
                            <h2 id="create-user-title"><i class="fas fa-user-plus" aria-hidden="true"></i> Benutzer anlegen</h2>
                            <button @click="closeCreateUserModal" class="close-btn modal-close-btn" aria-label="Modal schließen">
                                <i class="fas fa-times" aria-hidden="true"></i>
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
                                <small style="color: #64748b; font-size: 0.8rem;">Mindestens {{ generalSettings?.password_min_length || 8 }} Zeichen</small>
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
                            
                            <div class="flex gap-md mt-lg">
                                <button 
                                    type="submit" 
                                    class="btn btn-primary"
                                    :disabled="createUserForm._isSaving"
                                    aria-label="Benutzer speichern"
                                >
                                    <i v-if="createUserForm._isSaving" class="fas fa-spinner fa-spin" aria-hidden="true"></i>
                                    <i v-else class="fas fa-save" aria-hidden="true"></i>
                                    <span class="btn-text">{{ createUserForm._isSaving ? 'Speichert...' : 'Speichern' }}</span>
                                </button>
                                <button 
                                    type="button" 
                                    class="btn btn-secondary" 
                                    @click="closeCreateUserModal"
                                    :disabled="createUserForm._isSaving"
                                    aria-label="Abbrechen"
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
`;

export const modalsOutsideMainTemplate = `
            <!-- Gruppen-Bearbeitungs-Modal -->
            <div v-if="showGroupEditModal" class="modal-overlay modal-overlay-standard" @click="closeGroupEditModal" role="dialog" aria-labelledby="group-edit-title" aria-modal="true">
                <div class="modal-content modal-md" @click.stop>
                    <div class="modal-header">
                        <h2 id="group-edit-title"><i class="fas fa-users-cog" aria-hidden="true"></i> Gruppe bearbeiten</h2>
                        <button @click="closeGroupEditModal" class="close-btn modal-close-btn" aria-label="Modal schließen">
                            <i class="fas fa-times" aria-hidden="true"></i>
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
                                <label class="flex-between">
                                    <span>Mitglieder</span>
                                    <button type="button" class="btn btn-success btn-sm" @click="groupEditForm.showAddMember = !groupEditForm.showAddMember">
                                        <i class="fas fa-plus"></i> Hinzufügen
                                    </button>
                                </label>
                                
                                <!-- Mitglied hinzufügen -->
                                <div v-if="groupEditForm.showAddMember" class="mt-sm participants-add-box">
                                    <input type="text" v-model="groupEditForm.memberQuery" class="form-control" placeholder="Schüler suchen..." @keydown.enter.prevent>
                                    <div v-if="groupEditForm.memberQuery && filteredStudentsForGroupEdit.length" class="mt-sm participants-search-results" style="max-height: 150px;">
                                        <div v-for="u in filteredStudentsForGroupEdit" :key="u.id" class="participants-option" @click="addMemberToGroupEdit(u)">
                                            {{ u.name }} <span class="text-muted">(@{{ u.username }})</span>
                                        </div>
                                    </div>
                                    <div v-if="groupEditForm.memberQuery && !filteredStudentsForGroupEdit.length" class="mt-sm text-muted" style="font-size: 0.9rem;">Keine Schüler gefunden</div>
                                </div>
                                
                                <!-- Mitglieder-Liste -->
                                <div class="mt-sm participants-list" style="max-height: 200px;">
                                    <div v-if="groupEditForm.members.length === 0" class="text-muted text-center p-lg">
                                        Keine Mitglieder
                                    </div>
                                    <div v-for="member in groupEditForm.members" :key="member.id" class="participants-list-item">
                                        <span>{{ member.name }}</span>
                                        <button type="button" @click="removeMemberFromGroupEdit(member.id)" class="btn btn-danger btn-sm">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex flex-end gap-md mt-md">
                                <button type="button" class="btn btn-secondary" @click="closeGroupEditModal" aria-label="Abbrechen">Abbrechen</button>
                                <button type="submit" class="btn btn-primary" aria-label="Gruppe speichern">Speichern</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Passkey-Verwaltungsmodal -->
            <div v-if="showPasskeyModal" class="modal-overlay modal-overlay-standard" @click="closePasskeyModal" role="dialog" aria-labelledby="passkey-modal-title" aria-modal="true">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h2 id="passkey-modal-title"><i class="fas fa-key" aria-hidden="true"></i> Passkey-Verwaltung</h2>
                        <button @click="closePasskeyModal" class="close-btn modal-close-btn" aria-label="Modal schließen">
                            <i class="fas fa-times" aria-hidden="true"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <p v-if="passkeysError" class="text-danger mb-md">
                            {{ passkeysError }}
                        </p>

                        <div class="passkey-section">
                            <h3>Neuen Passkey registrieren</h3>
                            <p>Registrieren Sie einen neuen Passkey für schnelle und sichere Anmeldung.</p>
                            <button @click="registerPasskey" class="btn btn-primary" aria-label="Neuen Passkey registrieren">
                                <i class="fas fa-plus" aria-hidden="true"></i> Passkey hinzufügen
                            </button>
                        </div>
                        
                        <div class="passkey-section" v-if="getAvailablePasskeys().length > 0">
                            <h3>Registrierte Passkeys</h3>
                            <div class="passkey-list" role="list" aria-label="Registrierte Passkeys">
                                <div
                                    v-for="p in getAvailablePasskeys()"
                                    :key="p.id"
                                    class="passkey-item"
                                    role="listitem"
                                >
                                    <div class="passkey-info">
                                        <i class="fas fa-key" aria-hidden="true"></i>
                                        <div>
                                            <span class="passkey-name">{{ p.friendlyName || 'Passkey' }}</span>
                                            <div class="text-muted" style="font-size: 0.8rem; margin-top: 2px;">
                                                <span v-if="p.lastUsedAt">
                                                    Zuletzt verwendet: {{ formatDateTime(p.lastUsedAt) }}
                                                </span>
                                                <span v-else>
                                                    Erstellt am: {{ formatDateTime(p.createdAt) }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="passkey-actions">
                                        <button
                                            @click="renamePasskey(p)"
                                            class="btn btn-secondary btn-sm"
                                            :aria-label="'Passkey ' + (p.friendlyName || p.id) + ' umbenennen'"
                                        >
                                            <i class="fas fa-pen" aria-hidden="true"></i>
                                        </button>
                                        <button
                                            @click="removeOwnPasskey(p.id)"
                                            class="btn btn-danger btn-sm"
                                            :aria-label="'Passkey ' + (p.friendlyName || p.id) + ' entfernen'"
                                        >
                                            <i class="fas fa-trash" aria-hidden="true"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="passkey-section" v-else>
                            <p class="text-muted">Noch keine Passkeys registriert.</p>
                        </div>
                    </div>
                </div>
            </div>
`;
