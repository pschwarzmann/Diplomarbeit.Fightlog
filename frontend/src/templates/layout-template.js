/**
 * Layout Template
 * Enthält Header-Navigation und Session-Warnung
 */

export const layoutTemplate = `
            <!-- Header Navigation -->
            <header v-if="isLoggedIn" class="header">
                <div class="container">
                    <nav class="nav">
                        <a href="#" @click.prevent="goToDashboard" class="logo">
                            FightLog
                        </a>
                        
                        <div class="user-info">
                            <button @click="showPasskeyManagement" class="btn btn-secondary btn-auto btn-compact mr-md" aria-label="Passkey-Verwaltung öffnen">
                                <i class="fas fa-key" aria-hidden="true"></i> <span class="btn-text">Passkey verwalten</span>
                            </button>
                            <button @click="logout" class="btn btn-secondary btn-auto btn-compact" aria-label="Abmelden">
                                <i class="fas fa-right-from-bracket" aria-hidden="true"></i> <span class="btn-text">{{ t('logout') }}</span>
                            </button>
                        </div>
                    </nav>
                </div>
            </header>
            
            <!-- Session-Timeout-Warnung Modal -->
            <div v-if="sessionTimeoutWarning && !sessionExpired" class="modal-overlay modal-overlay-standard" role="dialog" aria-labelledby="session-warning-title" aria-modal="true">
                <div class="modal-content modal-content-standard">
                    <h3 id="session-warning-title" class="mb-md m-0">Session läuft bald ab</h3>
                    <p class="text-muted mb-lg">
                        Ihre Session läuft in {{ Math.max(0, sessionRemainingSeconds) }} Sekunden ab. Möchten Sie die Session verlängern?
                    </p>
                    <div class="flex flex-end gap-md">
                        <button @click="logout" class="btn btn-secondary btn-auto" aria-label="Abmelden">
                            Abmelden
                        </button>
                        <button @click="extendSession" class="btn btn-primary btn-auto" aria-label="Session verlängern">
                            Session verlängern
                        </button>
                    </div>
                </div>
            </div>
`;
