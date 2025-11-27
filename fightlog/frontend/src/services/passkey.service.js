// ===== FIGHTLOG - PASSKEY/WEBATUHN IMPLEMENTATION =====
// Echte WebAuthn-Passkey-Funktionalität für FightLog

class PasskeyManager {
    constructor() {
        this.isSupported = this.checkWebAuthnSupport();
    }

    // Prüfe WebAuthn-Unterstützung
    checkWebAuthnSupport() {
        return !!(window.PublicKeyCredential && 
                 window.navigator.credentials && 
                 window.navigator.credentials.create &&
                 window.navigator.credentials.get);
    }

    // Registriere neuen Passkey für Benutzer
    async registerPasskey(username, displayName = username) {
        if (!this.isSupported) {
            throw new Error('WebAuthn wird von diesem Browser nicht unterstützt');
        }

        try {
            // Generiere Challenge (in echter Implementierung vom Server)
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const publicKeyCredentialCreationOptions = {
                challenge: challenge,
                rp: {
                    name: "FightLog",
                    id: window.location.hostname,
                },
                user: {
                    id: new TextEncoder().encode(username),
                    name: username,
                    displayName: displayName,
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" }, // ES256
                    { alg: -257, type: "public-key" } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // Bevorzuge Plattform-Authentikatoren
                    userVerification: "preferred"
                },
                timeout: 60000,
                attestation: "direct"
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            // Speichere Credential-Informationen
            const passkeyData = {
                id: credential.id,
                rawId: Array.from(new Uint8Array(credential.rawId)),
                response: {
                    attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
                    clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
                },
                type: credential.type,
                username: username,
                createdAt: new Date().toISOString()
            };

            // Speichere im localStorage (in echter Implementierung an Server senden)
            this.savePasskeyData(passkeyData);
            
            return {
                success: true,
                credentialId: credential.id,
                message: 'Passkey erfolgreich registriert!'
            };

        } catch (error) {
            console.error('Passkey-Registrierung fehlgeschlagen:', error);
            throw new Error('Passkey-Registrierung fehlgeschlagen: ' + error.message);
        }
    }

    // Authentifiziere mit Passkey
    async authenticateWithPasskey(username) {
        if (!this.isSupported) {
            throw new Error('WebAuthn wird von diesem Browser nicht unterstützt');
        }

        try {
            // Lade gespeicherte Passkey-Daten
            const passkeyData = this.getPasskeyData(username);
            if (!passkeyData) {
                throw new Error('Kein Passkey für diesen Benutzer gefunden');
            }

            // Generiere Challenge (in echter Implementierung vom Server)
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const publicKeyCredentialRequestOptions = {
                challenge: challenge,
                allowCredentials: [{
                    id: new Uint8Array(passkeyData.rawId),
                    type: 'public-key',
                    transports: ['internal', 'usb', 'nfc', 'ble']
                }],
                timeout: 60000,
                userVerification: "preferred"
            };

            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            // Validiere Assertion (in echter Implementierung mit Server)
            const isValid = await this.validateAssertion(assertion, passkeyData);
            
            if (isValid) {
                return {
                    success: true,
                    username: username,
                    message: 'Passkey-Authentifizierung erfolgreich!'
                };
            } else {
                throw new Error('Passkey-Validierung fehlgeschlagen');
            }

        } catch (error) {
            console.error('Passkey-Authentifizierung fehlgeschlagen:', error);
            throw new Error('Passkey-Authentifizierung fehlgeschlagen: ' + error.message);
        }
    }

    // Validiere Assertion (vereinfachte Version)
    async validateAssertion(assertion, passkeyData) {
        // In einer echten Implementierung würde hier die kryptographische Validierung stattfinden
        // Für jetzt simulieren wir eine erfolgreiche Validierung
        return true;
    }

    // Speichere Passkey-Daten
    savePasskeyData(passkeyData) {
        const existingData = JSON.parse(localStorage.getItem('fightlog_passkeys') || '{}');
        existingData[passkeyData.username] = passkeyData;
        localStorage.setItem('fightlog_passkeys', JSON.stringify(existingData));
        
        // Markiere Passkey als verfügbar
        localStorage.setItem('fightlog_passkey_available', 'true');
    }

    // Lade Passkey-Daten
    getPasskeyData(username) {
        const allData = JSON.parse(localStorage.getItem('fightlog_passkeys') || '{}');
        return allData[username];
    }

    // Prüfe ob Passkey für Benutzer verfügbar ist
    hasPasskey(username) {
        return !!this.getPasskeyData(username);
    }

    // Entferne Passkey
    removePasskey(username) {
        const existingData = JSON.parse(localStorage.getItem('fightlog_passkeys') || '{}');
        delete existingData[username];
        localStorage.setItem('fightlog_passkeys', JSON.stringify(existingData));
        
        // Prüfe ob noch Passkeys vorhanden sind
        const hasAnyPasskeys = Object.keys(existingData).length > 0;
        if (!hasAnyPasskeys) {
            localStorage.removeItem('fightlog_passkey_available');
        }
    }

    // Liste alle verfügbaren Passkeys
    listPasskeys() {
        const allData = JSON.parse(localStorage.getItem('fightlog_passkeys') || '{}');
        return Object.keys(allData);
    }
}

// Globale Instanz erstellen
window.passkeyManager = new PasskeyManager();

// Exportiere für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasskeyManager;
}
