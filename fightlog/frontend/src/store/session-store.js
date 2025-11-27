// src/store/session-store.js

const STORAGE_KEYS = {
    username: 'fightlog_username',
    authenticated: 'fightlog_authenticated',
    user: 'fightlog_user',
    language: 'fightlog_language'
};

function safeSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.warn('Storage write blocked:', key, error);
    }
}

function safeGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.warn('Storage read blocked:', key, error);
        return null;
    }
}

function safeRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Storage remove blocked:', key, error);
    }
}

export function cacheUsername(username) {
    if (username) {
        safeSet(STORAGE_KEYS.username, username);
    }
}

export function getCachedUsername() {
    return safeGet(STORAGE_KEYS.username);
}

export function clearUsernameCache() {
    safeRemove(STORAGE_KEYS.username);
}

export function persistAuthState(user) {
    if (!user) return;
    safeSet(STORAGE_KEYS.authenticated, 'true');
    safeSet(STORAGE_KEYS.user, JSON.stringify(user));
}

export function readAuthSnapshot() {
    const isAuthenticated = safeGet(STORAGE_KEYS.authenticated) === 'true';
    let user = null;

    const rawUser = safeGet(STORAGE_KEYS.user);
    if (rawUser) {
        try {
            user = JSON.parse(rawUser);
        } catch (error) {
            console.warn('Stored user data invalid:', error);
        }
    }

    return { isAuthenticated, user };
}

export function clearAuthState() {
    safeRemove(STORAGE_KEYS.authenticated);
    safeRemove(STORAGE_KEYS.user);
}

export function persistLanguage(lang = 'de') {
    safeSet(STORAGE_KEYS.language, lang);
}

export function readLanguage(defaultLang = 'de') {
    return safeGet(STORAGE_KEYS.language) || defaultLang;
}


