/**
 * UI-Manipulations-Funktionen für FightLog
 * Enthält Funktionen für UI-Interaktionen, Navigation, Modals
 */

import { useDarkMode } from '../composables/useDarkMode.js';
// persistLanguage wird nicht mehr direkt importiert, sondern über ctx.setLanguage() verwendet

/**
 * Navigation zu einer Seite
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} page - Seitenname
 */
export function navigateTo(ctx, page) {
    ctx.currentPage = page;
    ctx.loadPageData();
}

/**
 * Navigation zum Dashboard
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export function goToDashboard(ctx) {
    ctx.currentPage = 'dashboard';
}

/**
 * Dark Mode umschalten
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export function toggleDarkMode(ctx) {
    const darkMode = useDarkMode();
    darkMode.toggle();
    ctx.darkModeEnabled = darkMode.isDarkMode();
}

/**
 * Passwort-Sichtbarkeit umschalten
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export function togglePassword(ctx) {
    ctx.showPassword = !ctx.showPassword;
}

/**
 * Sprache setzen (nur Deutsch)
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} lang - Sprache (wird ignoriert, immer 'de')
 * @param {Function} persistLanguageFn - persistLanguage Funktion (wird von main.js übergeben)
 */
export function setLanguage(ctx, lang, persistLanguageFn) {
    ctx.currentLanguage = 'de'; // Immer Deutsch
    if (persistLanguageFn) {
        persistLanguageFn('de');
    }
}

/**
 * Hilfsfunktion: API-Basis-URL wie in simple.html
 */
function getApiBase() {
    if (typeof window !== 'undefined' && window.FIGHTLOG_API_URL) {
        return window.FIGHTLOG_API_URL;
    }
    return '../backend/api';
}

/**
 * Server-Passkeys für aktuellen Benutzer laden
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
async function loadServerPasskeys(ctx) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        return;
    }

    try {
        ctx.passkeysLoading = true;
        ctx.passkeysError = null;

        const API_BASE = getApiBase();
        const url = `${API_BASE}/passkeys.php?token=${encodeURIComponent(token)}`;
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Authorization': `Bearer ${token}`,
            },
        });

        const contentType = response.headers.get('content-type') || '';
        let data = null;
        if (contentType.includes('application/json')) {
            data = await response.json();
        }

        if (!response.ok || !data || !data.success) {
            throw new Error((data && data.error) || 'Passkeys konnten nicht geladen werden');
        }

        ctx.passkeys = Array.isArray(data.passkeys) ? data.passkeys : [];
        ctx.passkeysLoading = false;
    } catch (error) {
        console.error('[FightLog] Passkeys konnten nicht geladen werden:', error);
        ctx.passkeysLoading = false;
        ctx.passkeysError = error.message || 'Passkeys konnten nicht geladen werden';
        try {
            await window.notify.alert('Passkeys konnten nicht geladen werden: ' + ctx.passkeysError);
        } catch (e) {
            // ignore
        }
    }
}

/**
 * Passkey-Verwaltung anzeigen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function showPasskeyManagement(ctx) {
    ctx.showPasskeyModal = true;
    await loadServerPasskeys(ctx);
}

/**
 * Passkey-Modal schließen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export function closePasskeyModal(ctx) {
    ctx.showPasskeyModal = false;
}

/**
 * Passkey registrieren (serverbasiert über passkeys.php)
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function registerPasskey(ctx) {
    try {
        if (!ctx.currentUser || !ctx.currentUser.username) {
            await window.notify.alert('Benutzerdaten nicht gefunden. Bitte melden Sie sich erneut an.');
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
            await window.notify.alert('Keine aktive Sitzung gefunden. Bitte melden Sie sich neu an.');
            return;
        }

        // API-Basis wie im Login (simple.html)
        const API_BASE = getApiBase();
        const url = `${API_BASE}/passkeys.php?token=${encodeURIComponent(token)}`;

        // 1) Registrierung starten: Challenge + Optionen holen
        const beginResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ action: 'register' }),
        });

        if (!beginResponse.ok) {
            throw new Error('Server-Fehler bei Passkey-Registrierung (Start)');
        }

        const beginContentType = beginResponse.headers.get('content-type') || '';
        if (!beginContentType.includes('application/json')) {
            const text = await beginResponse.text();
            console.error('Non-JSON response (passkeys.php register):', text.substring(0, 500));
            throw new Error('Server returned non-JSON response');
        }

        const registerData = await beginResponse.json();

        if (
            !registerData.success ||
            !registerData.challenge ||
            !registerData.rp ||
            !registerData.user
        ) {
            throw new Error(registerData.error || 'Passkey-Registrierung nicht möglich');
        }

        // Challenge + Optionen für WebAuthn vorbereiten (wie in simple.html)
        function base64ToUint8Array(base64) {
            const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
            const binaryString = atob(normalized);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }

        const publicKeyOptions = {
            challenge: base64ToUint8Array(registerData.challenge),
            rp: registerData.rp,
            user: {
                ...registerData.user,
                id: base64ToUint8Array(registerData.user.id),
            },
            pubKeyCredParams: registerData.pubKeyCredParams,
            authenticatorSelection: registerData.authenticatorSelection,
            timeout: registerData.timeout,
            attestation: registerData.attestation,
        };

        // 2) Browser-WebAuthn-Aufruf
        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions,
        });

        // 3) Registrierung beim Server verifizieren
        const verifyResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'verify',
                credential: {
                    id: credential.id,
                    rawId: Array.from(new Uint8Array(credential.rawId)),
                    response: {
                        attestationObject: Array.from(
                            new Uint8Array(credential.response.attestationObject)
                        ),
                        clientDataJSON: Array.from(
                            new Uint8Array(credential.response.clientDataJSON)
                        ),
                    },
                    type: credential.type,
                },
                challenge: registerData.challenge,
                friendlyName: 'FightLog Passkey',
            }),
        });

        if (!verifyResponse.ok) {
            throw new Error('Server-Fehler bei Passkey-Verifizierung');
        }

        const verifyContentType = verifyResponse.headers.get('content-type') || '';
        if (!verifyContentType.includes('application/json')) {
            const text = await verifyResponse.text();
            console.error('Non-JSON response (passkeys.php verify):', text.substring(0, 500));
            throw new Error('Server returned non-JSON response');
        }

        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
            throw new Error(verifyData.error || 'Passkey-Verifizierung fehlgeschlagen');
        }

        try {
            localStorage.setItem('fightlog_passkey_available', 'true');
        } catch (e) {
            // nur ein UI-Hinweis, kein harter Fehler
        }

        await window.notify.alert(
            'Passkey erfolgreich registriert! Sie können sich jetzt mit dem Passkey anmelden.'
        );
        await loadServerPasskeys(ctx);
        closePasskeyModal(ctx);
    } catch (error) {
        if (window.FightLogLogger) {
            window.FightLogLogger.error('Passkey-Registrierung fehlgeschlagen:', error);
        } else {
            console.error('[FightLog] Passkey-Registrierung fehlgeschlagen:', error);
        }
        await window.notify.alert('Passkey-Registrierung fehlgeschlagen: ' + error.message);
    }
}

/**
 * Passkey entfernen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} passkeyId - Passkey-ID
 */
export async function removePasskey(ctx, passkeyId) {
    const ok = await window.notify.confirm('Passkey wirklich entfernen?');
    if (!ok) return;

    try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            await window.notify.alert('Keine aktive Sitzung gefunden. Bitte melden Sie sich neu an.');
            return;
        }

        const API_BASE = getApiBase();
        const url = `${API_BASE}/passkeys.php?token=${encodeURIComponent(token)}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ id: passkeyId }),
        });

        const contentType = response.headers.get('content-type') || '';
        let data = null;
        if (contentType.includes('application/json')) {
            data = await response.json();
        }

        if (!response.ok || !data || !data.success) {
            throw new Error((data && data.error) || 'Passkey konnte nicht gelöscht werden');
        }

        // Lokale Liste aktualisieren
        if (Array.isArray(ctx.passkeys)) {
            ctx.passkeys = ctx.passkeys.filter(p => p.id !== passkeyId);
        }

        await window.notify.alert('Passkey erfolgreich gelöscht!');
    } catch (error) {
        console.error('Passkey-Entfernung fehlgeschlagen:', error);
        await window.notify.alert('Passkey-Entfernung fehlgeschlagen: ' + error.message);
    }
}

/**
 * Passkey umbenennen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Object} passkey - Passkey-Objekt
 */
export async function renamePasskey(ctx, passkey) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        await window.notify.alert('Keine aktive Sitzung gefunden. Bitte melden Sie sich neu an.');
        return;
    }

    const currentName = passkey.friendlyName || 'Passkey';
    const newName = await window.notify.prompt(
        'Neuen Namen für diesen Passkey eingeben:',
        currentName
    );
    if (newName === null) return;

    const trimmed = String(newName).trim();
    if (!trimmed) {
        await window.notify.alert('Der Name darf nicht leer sein.');
        return;
    }

    try {
        const API_BASE = getApiBase();
        const url = `${API_BASE}/passkeys.php?token=${encodeURIComponent(token)}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'rename',
                id: passkey.id,
                friendlyName: trimmed,
            }),
        });

        const contentType = response.headers.get('content-type') || '';
        let data = null;
        if (contentType.includes('application/json')) {
            data = await response.json();
        }

        if (!response.ok || !data || !data.success) {
            throw new Error((data && data.error) || 'Passkey konnte nicht umbenannt werden');
        }

        // Lokale Liste aktualisieren
        if (Array.isArray(ctx.passkeys)) {
            ctx.passkeys = ctx.passkeys.map(p =>
                p.id === passkey.id ? { ...p, friendlyName: trimmed } : p
            );
        }

        await window.notify.alert('Passkey-Name wurde aktualisiert.');
    } catch (error) {
        console.error('Passkey-Umbenennung fehlgeschlagen:', error);
        await window.notify.alert('Passkey-Umbenennung fehlgeschlagen: ' + error.message);
    }
}

/**
 * Verfügbare Passkeys abrufen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @returns {Array} Liste der Passkeys
 */
export function getAvailablePasskeys(ctx) {
    // Liste der vom Server geladenen Passkeys für das aktuelle Konto
    return Array.isArray(ctx.passkeys) ? ctx.passkeys : [];
}

/**
 * Initiales Laden der Passkeys nach Login
 * @param {Object} ctx - Vue-Komponenten-Kontext
 */
export async function initPasskeys(ctx) {
    await loadServerPasskeys(ctx);
}

/**
 * Urkunden-Detail-Modal öffnen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Object} cert - Urkunden-Objekt
 */
export function openCertificateDetail(ctx, cert) {
    ctx.selectedCertificate = cert;
    ctx.showCertificateDetailModal = true;
}

/**
 * Schüler für manuelle Urkunde auswählen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {Object} user - User-Objekt
 */
export function selectStudentForManualCertificate(ctx, user) {
    ctx.manualCertificateForm.studentId = user.id;
    ctx.manualCertificateForm.studentName = user.name;
    ctx.manualCertificateForm.studentQuery = '';
}

/**
 * Suchfelder leeren
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} type - Typ ('certificate', 'exam', 'course')
 */
export function clearSearch(ctx, type) {
    if (type === 'certificate') {
        ctx.certificateSearch = '';
    } else if (type === 'exam') {
        ctx.examSearch = '';
    } else if (type === 'course') {
        ctx.courseSearch = '';
    }
}

/**
 * Settings-Tab setzen
 * @param {Object} ctx - Vue-Komponenten-Kontext
 * @param {string} tab - Tab-Name
 */
export function setSettingsTab(ctx, tab) {
    ctx.currentSettingsTab = tab;
    // Optional: Scroll to top on mobile for better UX
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}
}
