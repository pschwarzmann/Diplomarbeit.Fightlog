/**
 * Exams Page Template
 * Enthält das Template für die Prüfungsseite
 */

export const examsTemplate = `
                                 <!-- Prüfungen -->
                 <div v-else-if="currentPage === 'exams'">
                     <div class="page-content">
                         <div class="container">
                             <div class="page-header">
                                 <button @click="goToDashboard" class="back-btn" aria-label="Zurück zum Dashboard">
                                     <i class="fas fa-arrow-left" aria-hidden="true"></i>
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
                                            <label for="exam-date">{{ t('examDate') }}</label>
                                            <input id="exam-date" type="date" v-model="examForm.date" class="form-control" required aria-required="true">
                                        </div>
                                        
                                        <div class="form-group">
                                            <label for="exam-level">{{ t('examLevel') }}</label>
                                            <select id="exam-level" v-model="examForm.level" class="form-control" required aria-required="true">
                                                <option value="">{{ t('examLevel') }}</option>
                                                <option v-for="grade in grades" :key="grade.id" :value="grade.name">{{ grade.name }}</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    
                                    <div class="form-row">
                                        <div class="form-group position-relative z-1000">
                                            <label for="exam-category">{{ t('examCategory') }}</label>
                                            <select id="exam-category" v-model="examForm.category" class="form-control" required aria-required="true">
                                                <option value="">{{ t('examCategory') }}</option>
                                                <option value="Technik">Technik</option>
                                                <option value="Kampf">Kampf</option>
                                                <option value="Theorie">Theorie</option>
                                                <option value="Kata">Kata</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="exam-instructor">{{ t('examInstructor') }}</label>
                                            <input id="exam-instructor" type="text" v-model="examForm.instructor" class="form-control" required aria-required="true">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="exam-student-query">Schüler zuordnen</label>
                                        <div class="position-relative">
                                            <input id="exam-student-query" type="text" v-model="examForm.studentQuery" class="form-control" placeholder="Gruppe oder Schüler suchen" @keydown.enter.prevent autocomplete="off" aria-autocomplete="list" :aria-expanded="(examForm.studentQuery && (groupMatches(examForm.studentQuery).length > 0 || studentMatches(examForm.studentQuery).length > 0)).toString()">
                                            <div v-if="examForm.studentQuery" class="form-container position-absolute autocomplete-dropdown autocomplete-dropdown-lg" role="listbox" aria-label="Schüler- und Gruppen-Ergebnisse">
                                                <div v-for="g in groupMatches(examForm.studentQuery)" :key="'g_'+g.id" class="p-sm autocomplete-option-sm fw-600" role="option" @click="applyGroupObjectTo('exam', g)" @keydown.enter="applyGroupObjectTo('exam', g)" tabindex="0">
                                                    {{ g.name }} <span class="text-muted fw-500">(Gruppe)</span>
                                                </div>
                                                <div v-for="u in studentMatches(examForm.studentQuery)" :key="u.id" class="p-sm autocomplete-option-sm" role="option" @click="tapSelectStudent('exam', u)" @keydown.enter="tapSelectStudent('exam', u)" tabindex="0">
                                                    {{ u.name }} <span class="text-muted">(@{{ u.username }})</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="examForm.userIds.length" class="mt-sm flex flex-wrap gap-sm">
                                            <span v-for="sid in examForm.userIds" :key="sid" class="btn btn-secondary btn-sm cursor-default" role="status">
                                                {{ displayUserName(sid) }}
                                                <button type="button" class="btn btn-danger btn-sm mr-sm" @click="removeSelected('exam', sid)" :aria-label="displayUserName(sid) + ' entfernen'"><i class="fas fa-times" aria-hidden="true"></i></button>
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="exam-comments">{{ t('examComments') }}</label>
                                        <textarea id="exam-comments" v-model="examForm.comments" class="form-control" rows="4" aria-label="Kommentare zur Prüfung"></textarea>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary" aria-label="Prüfung speichern">{{ t('submit') }}</button>
                                </form>
                            </div>
                            <div v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')" class="form-container">
                                <h2>{{ t('filter') }}</h2>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="exam-search">{{ t('search') }}</label>
                                        <input id="exam-search" type="text" v-model="examSearch" class="form-control" placeholder="Level/Prüfer/Kategorie/Schüler" aria-label="Prüfungen durchsuchen">
                                    </div>
                                    <div class="form-group form-group-end">
                                        <button class="btn btn-secondary" @click="clearExamSearch" aria-label="Filter zurücksetzen">{{ t('clearFilter') }}</button>
                                    </div>
                                </div>
                                <div class="timeline">
                                    <div v-for="exam in filteredExams" :key="exam.id" class="timeline-item">
                                        <div class="timeline-content">
                                            <h4>{{ exam.level }} - {{ exam.category }}</h4>
                                            <p><strong>Schüler:</strong> {{ exam.studentName || 'Unbekannt' }} <span v-if="exam.studentUsername" class="text-muted">(@{{ exam.studentUsername }})</span></p>
                                            <p><strong>Datum:</strong> {{ formatDate(exam.date) }}</p>
                                            <p><strong>Prüfer:</strong> {{ exam.instructor }}</p>
                                            <p><strong>Status:</strong> <span :class="'status-' + exam.status">{{ exam.status }}</span></p>
                                            <p v-if="exam.comments"><strong>Kommentare:</strong> {{ exam.comments }}</p>
                                            <div class="exam-actions">
                                                <button class="exam-action-btn exam-action-edit" @click="editExam(exam)" :aria-label="'Prüfung ' + exam.level + ' - ' + exam.category + ' bearbeiten'"><i class="fas fa-pen" aria-hidden="true"></i></button>
                                                <button class="exam-action-btn exam-action-delete" @click="deleteExam(exam)" :aria-label="'Prüfung ' + exam.level + ' - ' + exam.category + ' löschen'"><i class="fas fa-trash" aria-hidden="true"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else>
                                <div v-if="ownExams.length === 0" class="form-container empty-state empty-state-compact">
                                    <i class="fas fa-clipboard-list empty-state-icon" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                                    <h3 class="empty-state-title">Noch keine Prüfungen</h3>
                                    <p class="empty-state-text">Du hast noch keine Prüfungen abgeschlossen. Dein Trainer wird deine Prüfungsergebnisse hier eintragen.</p>
                                </div>
                                <div v-else class="timeline">
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
                            <div v-if="showExamEditModal" class="modal-overlay modal-overlay-standard" @click="closeExamEditModal" role="dialog" aria-labelledby="exam-edit-title" aria-modal="true">
                                <div class="modal-content modal-lg" @click.stop>
                                    <div class="modal-header">
                                        <h2 id="exam-edit-title"><i class="fas fa-edit" aria-hidden="true"></i> Prüfung bearbeiten</h2>
                                        <button @click="closeExamEditModal" class="close-btn" aria-label="Modal schließen">
                                            <i class="fas fa-times" aria-hidden="true"></i>
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
                                                    <label>Prüfer</label>
                                                    <input type="text" v-model="examEditForm.instructor" class="form-control" required>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label>Status</label>
                                                <select v-model="examEditForm.status" class="form-control" required>
                                                    <option value="passed">Bestanden</option>
                                                    <option value="failed">Nicht bestanden</option>
                                                    <option value="pending">Ausstehend</option>
                                                </select>
                                            </div>
                                            <div class="form-group">
                                                <label>Schüler</label>
                                                <div class="position-relative">
                                                    <input type="text" v-model="examEditForm.studentQuery" class="form-control" placeholder="Schüler suchen...">
                                                    <div v-if="examEditForm.studentQuery && studentMatches(examEditForm.studentQuery).length" class="form-container autocomplete-dropdown">
                                                        <div v-for="u in studentMatches(examEditForm.studentQuery)" :key="u.id" class="autocomplete-option" @click="selectStudentForExamEdit(u)">
                                                            {{ u.name }} <span class="text-muted">(@{{ u.username }})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div v-if="examEditForm.studentName" class="mt-sm text-muted" style="font-size:.9rem;">Ausgewählt: {{ examEditForm.studentName }}</div>
                                            </div>
                                            <div class="form-group">
                                                <label>Kommentar</label>
                                                <textarea v-model="examEditForm.comments" class="form-control" rows="3"></textarea>
                                            </div>
                                            <div class="flex flex-end gap-md">
                                                <button type="button" class="btn btn-secondary" @click="closeExamEditModal" aria-label="Bearbeitung abbrechen">Abbrechen</button>
                                                <button type="submit" class="btn btn-primary" aria-label="Änderungen speichern">Speichern</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
`;
