/**
 * Certificates Page Template
 * Enthält das Template für die Urkunden-Seite
 */

export const certificatesTemplate = `
                <!-- Urkunden -->
                <div v-else-if="currentPage === 'certificates'">
                    <div class="p-xl">
                        <div class="container">
                            <div class="page-header">
                                <button @click="goToDashboard" class="back-btn" aria-label="Zurück zum Dashboard">
                                    <i class="fas fa-arrow-left" aria-hidden="true"></i>
                                    Zurück
                                </button>
                                <h1><i class="fas fa-certificate" aria-hidden="true"></i> Meine Urkunden</h1>
                            </div>
                            
                            <!-- Trainer/Admin: Manuelle Urkunde hinzufügen (z-index damit Dropdown über Kacheln) -->
                            <div v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')" class="form-container mb-lg certificate-form-above-grid">
                                <div class="flex-between">
                                    <h3 style="margin: 0;"><i class="fas fa-plus-circle" aria-hidden="true"></i> Manuelle Urkunde erstellen</h3>
                                    <button :class="['btn', 'btn-sm', showManualCertificateForm ? 'btn-secondary' : 'btn-primary']" @click="showManualCertificateForm = !showManualCertificateForm" :aria-expanded="showManualCertificateForm.toString()" aria-label="Formular zum Erstellen einer manuellen Urkunde {{ showManualCertificateForm ? 'ausblenden' : 'anzeigen' }}">
                                        <i v-if="!showManualCertificateForm" class="fas fa-plus" aria-hidden="true"></i>
                                        <i v-else class="fas fa-chevron-up" aria-hidden="true"></i>
                                        {{ showManualCertificateForm ? 'Ausblenden' : 'Hinzufügen' }}
                                    </button>
                                </div>
                                <form v-if="showManualCertificateForm" @submit.prevent="createManualCertificate" class="mt-md">
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
                                        <label for="manual-cert-student">Schüler auswählen *</label>
                                        <div class="position-relative">
                                            <input id="manual-cert-student" type="text" v-model="manualCertificateForm.studentQuery" class="form-control" placeholder="Schüler suchen..." autocomplete="off" aria-autocomplete="list" :aria-expanded="(manualCertificateForm.studentQuery && studentMatches(manualCertificateForm.studentQuery).length > 0).toString()">
                                            <div v-if="manualCertificateForm.studentQuery && studentMatches(manualCertificateForm.studentQuery).length" class="form-container autocomplete-dropdown" role="listbox" aria-label="Schüler-Ergebnisse">
                                                <div v-for="u in studentMatches(manualCertificateForm.studentQuery)" :key="u.id" class="p-sm" style="padding:.4rem 1rem; cursor:pointer;" role="option" @click="selectStudentForManualCertificate(u)" @keydown.enter="selectStudentForManualCertificate(u)" tabindex="0">
                                                    {{ u.name }} <span class="text-muted">(@{{ u.username }})</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="manualCertificateForm.studentName" class="mt-sm" style="color:#10b981; font-size:.9rem;" role="status" aria-live="polite">
                                            <i class="fas fa-check" aria-hidden="true"></i> Ausgewählt: {{ manualCertificateForm.studentName }}
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-primary" aria-label="Manuelle Urkunde speichern">
                                        <i class="fas fa-save" aria-hidden="true"></i> Urkunde erstellen
                                    </button>
                                </form>
                            </div>
                            
                            <!-- Info-Text -->
                            <div v-if="certificates.length === 0" class="form-container empty-state">
                                <i class="fas fa-certificate empty-state-icon" aria-hidden="true"></i>
                                <h3 class="empty-state-title">Noch keine Urkunden vorhanden</h3>
                                <p class="empty-state-text">Urkunden werden automatisch erstellt, wenn du Prüfungen bestehst.</p>
                            </div>
                            
                            <!-- Urkunden-Kacheln -->
                            <div v-else class="certificates-grid">
                                <div 
                                    v-for="cert in displayedCertificates" 
                                    :key="cert.id" 
                                    class="certificate-card certificate-tile position-relative"
                                    :class="{ 'certificate-card-light-grade': isLightGradeColor(cert.gradeColor) }"
                                    @click="openCertificateDetail(cert)"
                                    @keydown.enter="openCertificateDetail(cert)"
                                    role="button"
                                    tabindex="0"
                                    :aria-label="'Urkunde anzeigen: ' + cert.title"
                                >
                                    <!-- Gürtelgrad-Farbband (bei Weißgurt: sichtbarer grauer Streifen) -->
                                    <div v-if="cert.gradeColor || cert.gradeName" class="position-absolute certificate-strip" style="top: 0; left: 0; right: 0; height: 12px; border-radius: 16px 16px 0 0;" :style="getCertGradeStyles(cert).strip" aria-hidden="true"></div>
                                    
                                    <!-- Manuell-Badge -->
                                    <div v-if="cert.isManual" class="position-absolute" style="top: 12px; right: 12px;">
                                        <span class="badge badge-manual" aria-label="Manuell erstellte Urkunde">MANUELL</span>
                                    </div>
                                    
                                    <div class="certificate-card-body text-center">
                                        <!-- Oberer Bereich: Icon, Titel, Gürtelgrad, Details -->
                                        <div class="certificate-card-main">
                                            <div class="flex-center mb-md certificate-icon" style="width: 70px; height: 70px; margin: 0 auto 1rem; border-radius: 50%; font-size: 2rem; box-sizing: border-box;" :style="getCertGradeStyles(cert).icon" aria-hidden="true">
                                                <i class="fas fa-award"></i>
                                            </div>
                                            <h4 style="margin: 0 0 0.5rem; font-size: 1.1rem; color: #1e293b;">{{ cert.title }}</h4>
                                            <div v-if="cert.gradeName" class="mb-md" style="margin-bottom: 0.75rem;">
                                                <span class="badge certificate-grade-badge" style="padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; box-sizing: border-box;" :style="getCertGradeStyles(cert).badge">
                                                    {{ cert.gradeName }}
                                                </span>
                                            </div>
                                            <div class="text-muted" style="font-size: 0.9rem;">
                                                <p style="margin: 0.25rem 0;"><i class="fas fa-calendar-alt" style="width: 20px;" aria-hidden="true"></i> {{ formatDate(cert.date) }}</p>
                                                <p style="margin: 0.25rem 0;"><i class="fas fa-user-tie" style="width: 20px;" aria-hidden="true"></i> {{ cert.instructor }}</p>
                                                <p v-if="cert.category" style="margin: 0.25rem 0;"><i class="fas fa-tag" style="width: 20px;" aria-hidden="true"></i> {{ cert.category }}</p>
                                            </div>
                                        </div>
                                        <!-- Schülername fixiert am unteren Rand (einheitlich bei fehlenden Daten) -->
                                        <div v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer') && cert.ownerName" class="certificate-card-owner text-muted">
                                            <i class="fas fa-user-graduate" aria-hidden="true"></i> {{ cert.ownerName }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Urkunden-Detail-Modal -->
                <div v-if="showCertificateDetailModal" class="modal-overlay modal-overlay-standard" @click.self="showCertificateDetailModal = false" role="dialog" aria-labelledby="certificate-detail-title" aria-modal="true">
                    <div class="modal-content form-container" style="max-width: 600px; text-align: center;">
                        <button @click="showCertificateDetailModal = false" class="close-btn position-absolute" style="top: 1rem; right: 1rem;" aria-label="Modal schließen">
                            <i class="fas fa-times" aria-hidden="true"></i>
                        </button>
                        
                        <!-- Farbband oben (bei Weißgurt: sichtbarer grauer Streifen) -->
                        <div v-if="selectedCertificate && (selectedCertificate.gradeColor || selectedCertificate.gradeName)" class="position-absolute certificate-strip" style="top: 0; left: 0; right: 0; height: 14px; border-radius: 14px 14px 0 0; box-sizing: border-box;" :style="getCertGradeStyles(selectedCertificate).strip" aria-hidden="true"></div>
                        
                        <div v-if="selectedCertificate" class="p-xl" style="padding: 2rem 1rem;">
                            <!-- Großes Urkunden-Icon (bei Weißgurt: sichtbarer Rahmen) -->
                            <div class="flex-center mb-lg" style="width: 100px; height: 100px; margin: 0 auto 1.5rem; border-radius: 50%; font-size: 3rem; box-sizing: border-box;" :style="getCertGradeStyles(selectedCertificate).icon" aria-hidden="true">
                                <i class="fas fa-award"></i>
                            </div>
                            
                            <!-- Schultitel -->
                            <h2 id="certificate-detail-title" class="text-muted mb-sm" style="margin: 0 0 0.5rem; font-size: 1rem; text-transform: uppercase; letter-spacing: 2px;">{{ certificateSettings.certificate_school_name || 'Kampfsport Akademie' }}</h2>
                            
                            <!-- Urkunde Titel -->
                            <h1 class="mb-md" style="margin: 0 0 1rem; font-size: 2rem; color: #1e293b;">{{ certificateSettings.certificate_title || 'Urkunde' }}</h1>
                            
                            <!-- Empfänger -->
                            <p class="text-muted mb-sm" style="font-size: 1.1rem; margin-bottom: 0.5rem;">verliehen an</p>
                            <h3 class="mb-lg" style="margin: 0 0 1.5rem; font-size: 1.5rem; color: #1e293b;">{{ selectedCertificate.ownerName || 'Unbekannt' }}</h3>
                            
                            <!-- Gürtelgrad (bei Weißgurt: sichtbarer Rahmen + dunkle Schrift) -->
                            <div v-if="selectedCertificate.gradeName" class="mb-lg">
                                <span class="badge" style="padding: 8px 24px; border-radius: 25px; font-size: 1.1rem; font-weight: 600; box-sizing: border-box;" :style="getCertGradeStyles(selectedCertificate).badge">
                                    {{ selectedCertificate.gradeName }}
                                </span>
                            </div>
                            
                            <!-- Prüfungstitel -->
                            <h4 class="mb-lg" style="margin: 0 0 1.5rem; color: #475569;">{{ selectedCertificate.title }}</h4>
                            
                            <!-- Gratulationstext -->
                            <div class="mb-lg" style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; white-space: pre-line; color: #475569; line-height: 1.6;">
                                {{ certificateSettings.certificate_congratulation_text || 'Herzlichen Glückwunsch zur bestandenen Prüfung!' }}
                            </div>
                            
                            <!-- Details -->
                            <div class="flex-center flex-wrap gap-lg mb-lg text-muted">
                                <div>
                                    <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                                    <strong style="margin-left: 0.5rem;">{{ formatDate(selectedCertificate.date) }}</strong>
                                </div>
                                <div>
                                    <i class="fas fa-user-tie" aria-hidden="true"></i>
                                    <strong style="margin-left: 0.5rem;">{{ selectedCertificate.instructor }}</strong>
                                </div>
                                <div v-if="selectedCertificate.category">
                                    <i class="fas fa-tag" aria-hidden="true"></i>
                                    <strong style="margin-left: 0.5rem;">{{ selectedCertificate.category }}</strong>
                                </div>
                            </div>
                            
                            <!-- Footer -->
                            <p class="text-tertiary" style="font-size: 0.85rem; font-style: italic;">
                                {{ certificateSettings.certificate_footer_text || 'Diese Urkunde wurde automatisch erstellt.' }}
                            </p>
                            
                            <!-- Löschen-Button für manuelle Urkunden (nur Admin) -->
                            <div v-if="selectedCertificate.isManual && currentUser && currentUser.role === 'admin'" class="mt-lg" style="padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                                <button class="btn btn-danger" @click="deleteManualCertificate(selectedCertificate.id)" aria-label="Urkunde löschen">
                                    <i class="fas fa-trash" aria-hidden="true"></i> Urkunde löschen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
`;
