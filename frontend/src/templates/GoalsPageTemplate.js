/**
 * Goals Page Template Fragment
 * Enthält das Template für die Ziele-Seite
 */

export const GoalsPageTemplate = `
                 <div v-else-if="currentPage === 'goals'">
                     <div style="padding: 2rem 0;">
                         <div class="container">
                             <div class="page-header">
                                 <button @click="goToDashboard" class="back-btn" aria-label="Zurück zum Dashboard">
                                     <i class="fas fa-arrow-left" aria-hidden="true"></i>
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
                <div v-if="showGoalDetailsModal" class="modal-overlay modal-overlay-standard" @click.self="showGoalDetailsModal = false" role="dialog" aria-labelledby="goal-details-title" aria-modal="true">
                    <div class="modal-content form-container" style="max-width:500px;">
                        <div class="modal-header flex-between mb-md">
                            <h2 id="goal-details-title"><i class="fas fa-bullseye" style="color: #3b82f6;" aria-hidden="true"></i> Unterziele</h2>
                            <button @click="showGoalDetailsModal = false" class="close-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;" aria-label="Modal schließen">
                                <i class="fas fa-times" aria-hidden="true"></i>
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
                        <div class="mt-md flex gap-md">
                            <button class="btn btn-secondary" @click="showGoalDetailsModal = false" aria-label="Modal schließen">Schließen</button>
                        </div>
                    </div>
                </div>
`;
