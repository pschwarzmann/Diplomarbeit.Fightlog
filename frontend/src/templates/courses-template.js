/**
 * Courses Page Template
 * Enthält das Template für die Kursseite
 */

export const coursesTemplate = `
                <!-- Kurse -->
                <div v-else-if="currentPage === 'courses'">
                    <div style="padding: 2rem 0;">
                        <div class="container">
                            <div class="page-header">
                                <button @click="goToDashboard" class="back-btn" aria-label="Zurück zum Dashboard">
                                    <i class="fas fa-arrow-left" aria-hidden="true"></i>
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
                                                    <button type="button" class="btn btn-danger btn-sm" style="margin-left:.35rem;" @click="removeSelected('course', sid)"><i class="fas fa-times" aria-hidden="true"></i></button>
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
                                                    <i class="fas fa-users" aria-hidden="true"></i> Teilnehmer
                                                </button>
                                                <button class="btn btn-secondary btn-sm" @click="editCourse(c)" title="Bearbeiten">
                                                    <i class="fas fa-pen" aria-hidden="true"></i>
                                                </button>
                                                <button class="btn btn-danger btn-sm" @click="removeCourse(c)" title="Löschen">
                                                    <i class="fas fa-trash" aria-hidden="true"></i>
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
                                            <i class="fas fa-check" aria-hidden="true"></i> Angemeldet
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
                                                <i class="fas fa-plus" aria-hidden="true"></i> Anmelden
                                            </button>
                                            <button v-else-if="(c.booking_status === 'confirmed' || c.booking_status === 'pending') && canCancelBooking(c)" class="btn btn-danger" @click="cancelBooking(c)">
                                                <i class="fas fa-times" aria-hidden="true"></i> Abmelden
                                            </button>
                                            <span v-else-if="c.booking_status === 'pending'" style="color:#f59e0b; font-size:0.85rem;">
                                                <i class="fas fa-clock" aria-hidden="true"></i> Anmeldung ausstehend
                                            </span>
                                            <span v-else-if="c.booking_status === 'confirmed'" style="color:#64748b; font-size:0.85rem;">
                                                <i class="fas fa-info-circle" aria-hidden="true"></i> Abmeldung nicht mehr möglich
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p v-if="upcomingCourses.length === 0" style="color:#64748b;">Keine anstehenden Kurse verfügbar.</p>
                            </div>
                        </div>
                    </div>
                </div>
`;
