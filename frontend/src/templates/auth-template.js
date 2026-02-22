/**
 * Auth (Login/Registrierung) Template
 * Enthält das Template für Login und Registrierung
 */

export const authTemplate = `
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
                                        autocomplete="username"
                                        aria-required="true"
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
                                            autocomplete="given-name"
                                            aria-required="true"
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
                                            autocomplete="family-name"
                                            aria-required="true"
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
                                        autocomplete="email"
                                        aria-required="true"
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
                                        autocomplete="tel"
                                        aria-required="true"
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
                                            :autocomplete="showRegister ? 'new-password' : 'current-password'"
                                            aria-required="true"
                                        >
                                        <button 
                                            type="button" 
                                            @click="togglePassword" 
                                            class="password-toggle"
                                            :aria-label="showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'"
                                            :aria-pressed="showPassword.toString()"
                                        >
                                            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" aria-hidden="true"></i>
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
                                            :aria-label="authForm.stayLoggedIn ? 'Angemeldet bleiben aktiviert' : 'Angemeldet bleiben deaktiviert'"
                                            role="switch"
                                        >
                                            <span class="toggle-knob" aria-hidden="true"></span>
                                        </button>
                                        <label for="stay-logged-in" class="toggle-label">{{ t('stayLoggedIn') }}</label>
                                    </div>
                                </div>
                                
                                <button type="submit" class="btn btn-primary btn-full">
                                    {{ showRegister ? t('register') : t('login') }}
                                </button>
                            </form>
                            
                            <!-- Registrierung nur für Admin verfügbar -->
                            <p v-if="currentUser && currentUser.role === 'admin'" class="text-center mt-md">
                                <button type="button" class="btn btn-secondary btn-full" @click.prevent="showRegister = !showRegister" :aria-label="showRegister ? 'Zur Anmeldung wechseln' : 'Zur Registrierung wechseln'">
                                    {{ showRegister ? t('login') : t('register') }}
                                </button>
                            </p>
                            <p v-else-if="!isLoggedIn" class="text-center mt-md text-muted" style="font-size: 0.9rem;">
                                Registrierung nur für Administratoren verfügbar
                            </p>
                        </div>
                    </div>
                </div>
`;
