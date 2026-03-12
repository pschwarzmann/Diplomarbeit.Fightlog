/**
 * Settings Page Template
 * Enthält das Template für die Settings-Seite (Admin/Trainer)
 */

export const settingsTemplate = `
                <div v-else-if="currentPage === 'settings' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')">
                    <div class="page-content">
                        <div class="container">
                            <div class="page-header">
                                <div class="page-header-main">
                                    <button @click="goToDashboard" class="back-btn" aria-label="Zurück zum Dashboard">
                                        <i class="fas fa-arrow-left" aria-hidden="true"></i>
                                        Zurück
                                    </button>
                                    <h1 class="m-0"><i class="fas fa-sliders" aria-hidden="true"></i> Settings</h1>
                                </div>
                            </div>

                            <!-- Tab-Switcher -->
                            <div class="preset-tabs" role="tablist" aria-label="Settings Kategorien">
                                <button 
                                    class="tab-btn" 
                                    :class="{ active: currentSettingsTab === 'general' }" 
                                    role="tab" 
                                    :aria-selected="(currentSettingsTab === 'general').toString()" 
                                    aria-controls="tab-general" 
                                    @click="setSettingsTab('general')"
                                    v-if="currentUser && currentUser.role === 'admin'"
                                >Allgemein</button>
                                
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

                            <!-- Tab: Allgemein (nur Admin) -->
                            <div v-show="currentSettingsTab === 'general' && currentUser && currentUser.role === 'admin'" id="tab-general" class="form-container" role="tabpanel">
                                <h2>Allgemeine Einstellungen</h2>
                                <p class="text-muted mb-md">Systemweite Einstellungen verwalten.</p>
                                
                                <form @submit.prevent="saveGeneralSettings">
                                    <div class="form-group">
                                        <label for="password-min-length">Passwort Mindestlänge</label>
                                        <input 
                                            id="password-min-length"
                                            type="number" 
                                            v-model.number="generalSettings.password_min_length" 
                                            class="form-control" 
                                            min="4" 
                                            max="128" 
                                            required
                                            placeholder="z.B. 8"
                                            aria-required="true"
                                            aria-describedby="password-min-length-help"
                                        >
                                        <small id="password-min-length-help" class="text-muted mt-sm d-block">Mindestlänge: 4, Maximallänge: 128</small>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary" :disabled="savingGeneralSettings" aria-label="Allgemeine Einstellungen speichern">
                                        <i class="fas fa-save" aria-hidden="true"></i> 
                                        <span v-if="savingGeneralSettings">Speichern...</span>
                                        <span v-else>Einstellungen speichern</span>
                                    </button>
                                    
                                    <div v-if="generalSettingsError" class="mt-md p-md alert-error" role="alert" aria-live="assertive">
                                        <i class="fas fa-exclamation-circle" aria-hidden="true"></i> {{ generalSettingsError }}
                                    </div>
                                </form>
                            </div>

                            <div v-show="currentSettingsTab === 'certificates'" id="tab-certificates" class="form-container" role="tabpanel" aria-labelledby="tab-certificates-btn">
                                <h2>Urkunden-Einstellungen</h2>
                                <p class="text-muted mb-md">Passe die Texte an, die auf den Urkunden angezeigt werden.</p>
                                
                                <form @submit.prevent="saveCertificateSettings">
                                    <div class="form-group">
                                        <label for="cert-title">Titel der Urkunde</label>
                                        <input id="cert-title" type="text" v-model="certificateSettings.certificate_title" class="form-control" placeholder="z.B. Urkunde" aria-label="Titel der Urkunde">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="cert-school-name">Name der Schule/des Vereins</label>
                                        <input id="cert-school-name" type="text" v-model="certificateSettings.certificate_school_name" class="form-control" placeholder="z.B. Kampfsport Akademie München" aria-label="Name der Schule oder des Vereins">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="cert-congratulation">Gratulationstext</label>
                                        <textarea id="cert-congratulation" v-model="certificateSettings.certificate_congratulation_text" class="form-control" rows="4" placeholder="z.B. Herzlichen Glückwunsch zur bestandenen Prüfung! Mit dieser Urkunde bestätigen wir..." aria-label="Gratulationstext für Urkunden"></textarea>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="cert-footer">Fußzeilen-Text</label>
                                        <input id="cert-footer" type="text" v-model="certificateSettings.certificate_footer_text" class="form-control" placeholder="z.B. Diese Urkunde wurde automatisch erstellt." aria-label="Fußzeilen-Text für Urkunden">
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary" aria-label="Urkunden-Einstellungen speichern">
                                        <i class="fas fa-save" aria-hidden="true"></i> Einstellungen speichern
                                    </button>
                                </form>
                                
                                <!-- Vorschau -->
                                <div class="form-section-divider">
                                    <h3>Vorschau</h3>
                                    <div class="text-center p-xl" style="background: #f8fafc; border-radius: 12px; border: 2px dashed #cbd5e1;" role="region" aria-label="Urkunden-Vorschau">
                                        <h4 class="text-muted mb-sm" style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px;">{{ certificateSettings.certificate_school_name || 'Kampfsport Akademie' }}</h4>
                                        <h2 class="mb-md" style="margin: 0 0 1rem; font-size: 1.8rem; color: #1e293b;">{{ certificateSettings.certificate_title || 'Urkunde' }}</h2>
                                        <p class="text-muted mb-sm">verliehen an</p>
                                        <h3 class="mb-md" style="margin: 0 0 1rem; color: #1e293b;">[Schülername]</h3>
                                        <div class="mb-md" style="background: white; padding: 1rem; border-radius: 8px; color: #475569; white-space: pre-line;">{{ certificateSettings.certificate_congratulation_text || 'Herzlichen Glückwunsch zur bestandenen Prüfung!' }}</div>
                                        <p class="text-tertiary" style="font-size: 0.85rem; font-style: italic;">{{ certificateSettings.certificate_footer_text || 'Diese Urkunde wurde automatisch erstellt.' }}</p>
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
                                                <button type="button" class="btn btn-danger btn-sm" style="margin-left:.35rem;" @click="removeGroupStudent(sid)"><i class="fas fa-times" aria-hidden="true"></i></button>
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
                                <div class="groups-grid">
                                    <div v-for="g in studentGroups" :key="g.id" class="group-card">
                                        <div class="group-card-content">
                                            <h4 class="group-card-title">{{ g.name }}</h4>
                                            <p v-if="g.description" class="group-card-description">{{ g.description }}</p>
                                            <p class="group-card-members">{{ g.member_count || g.userIds.length }} Mitglieder</p>
                                        </div>
                                        <div class="group-card-actions">
                                            <button class="course-action-btn course-action-btn--primary" @click="showGroupMembers(g)" title="Mitglieder anzeigen">
                                                <i class="fas fa-users" aria-hidden="true"></i>
                                                <span>Mitglieder</span>
                                            </button>
                                            <button class="course-action-btn course-action-btn--edit" @click="editGroup(g)" title="Bearbeiten">
                                                <i class="fas fa-pen" aria-hidden="true"></i>
                                            </button>
                                            <button class="course-action-btn course-action-btn--delete" @click="removeGroup(g)" title="Löschen">
                                                <i class="fas fa-trash" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Tab: Ziele (Goal Templates) -->
                            <div v-show="currentSettingsTab === 'goals'" id="tab-goals" class="form-container" role="tabpanel">
                                <h2>Ziel-Vorlagen</h2>
                                
                                <h3 class="settings-section-title">Neue Ziel-Vorlage erstellen</h3>
                                <form @submit.prevent="saveGoalTemplate" class="mb-lg">
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
                                        <textarea v-model="goalTemplateForm.definition" class="form-control form-control--no-resize" rows="3" placeholder="Optionale Beschreibung des Ziels"></textarea>
                                    </div>
                                    
                                    <!-- Unterziele -->
                                    <div class="form-group">
                                        <label>Unterziele</label>
                                        <div style="display:flex; flex-direction:column; gap:0.5rem;">
                                            <div v-for="(subtask, index) in goalTemplateForm.subtasks" :key="index" style="display:flex; gap:0.5rem; align-items:center;">
                                                <span style="color:#64748b; min-width:24px;">{{ index + 1 }}.</span>
                                                <input type="text" v-model="goalTemplateForm.subtasks[index]" class="form-control" placeholder="Unterziel eingeben...">
                                                <button type="button" class="btn btn-danger btn-sm" @click="removeGoalSubtask(index)" title="Entfernen">
                                                    <i class="fas fa-times" aria-hidden="true"></i>
                                                </button>
                                            </div>
                                            <button type="button" class="btn btn-secondary btn-sm" @click="addGoalSubtask" style="align-self:flex-start;">
                                                <i class="fas fa-plus" aria-hidden="true"></i> Unterziel hinzufügen
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div style="margin-top:1rem; display:flex; gap:0.5rem;">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-save" aria-hidden="true"></i> Erstellen
                                        </button>
                                    </div>
                                </form>
                                
                                <!-- Vorhandene Ziel-Vorlagen -->
                                <h3 class="settings-section-title">
                                    Vorhandene Ziel-Vorlagen 
                                    <span class="settings-section-count">({{ goalTemplates.length }})</span>
                                </h3>
                                <div v-if="goalTemplates.length === 0" class="text-muted">Noch keine Ziel-Vorlagen erstellt.</div>
                                <div class="goal-templates-grid">
                                    <div 
                                        v-for="t in goalTemplates" 
                                        :key="t.id" 
                                        class="goal-template-card"
                                    >
                                        <div class="goal-template-card-content">
                                            <h4 class="goal-template-card-title">{{ t.title }}</h4>
                                            <p v-if="t.category" class="goal-template-card-category">{{ t.category }}</p>
                                            <p class="goal-template-card-meta">
                                                <i class="fas fa-list-check" aria-hidden="true"></i>
                                                {{ t.subtask_count || 0 }} Unterziele
                                            </p>
                                        </div>
                                        <div class="goal-template-card-actions">
                                            <button class="course-action-btn course-action-btn--edit" @click="editGoalTemplate(t)" title="Bearbeiten">
                                                <i class="fas fa-pen" aria-hidden="true"></i>
                                            </button>
                                            <button class="course-action-btn course-action-btn--delete" @click="deleteGoalTemplate(t)" title="Löschen">
                                                <i class="fas fa-trash" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Tab: Grade -->
                            <div v-show="currentSettingsTab === 'grades'" id="tab-grades" class="form-container" role="tabpanel">
                                <h2>Grade verwalten</h2>
                                <p style="color:#64748b; margin-bottom:1rem;">Grade (Gürtelgrade) werden in Prüfungen, Urkunden und Benutzerprofilen verwendet.</p>
                                
                                <h3 class="settings-section-title">Neuen Grad erstellen</h3>
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
                                        <div class="grade-color-picker">
                                            <input type="color" v-model="gradeForm.color" id="grade-color-input" class="grade-color-input" title="Farbe wählen">
                                            <span class="grade-color-preview" :style="{ backgroundColor: gradeForm.color || '#FFEB3B' }"></span>
                                        </div>
                                    </div>
                                    <div style="margin-top:1rem; display:flex; gap:0.5rem;">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-save" aria-hidden="true"></i> Erstellen
                                        </button>
                                    </div>
                                </form>
                                
                                <!-- Vorhandene Grade -->
                                <h3 class="settings-section-title">
                                    Vorhandene Grade 
                                    <span class="settings-section-count">({{ grades.length }})</span>
                                </h3>
                                <div v-if="grades.length === 0" class="text-muted">Keine Grade vorhanden.</div>
                                <div class="grades-grid">
                                    <div 
                                        v-for="g in grades" 
                                        :key="g.id" 
                                        class="grade-card"
                                        :class="{ 'grade-card--light': isLightGradeColor(g.color) }"
                                        :style="{ '--grade-accent': g.color || '#fcd34d' }"
                                    >
                                        <div class="grade-card-content">
                                            <h4 class="grade-card-title">{{ g.name }}&nbsp;&nbsp;<span class="grade-card-sort">#{{ g.sort_order }}</span></h4>
                                        </div>
                                        <div v-if="currentUser && currentUser.role === 'admin'" class="grade-card-actions">
                                            <button class="course-action-btn course-action-btn--edit" @click="editGrade(g)" title="Bearbeiten">
                                                <i class="fas fa-pen" aria-hidden="true"></i>
                                            </button>
                                            <button class="course-action-btn course-action-btn--delete" @click="deleteGrade(g)" title="Löschen">
                                                <i class="fas fa-trash" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
`;
