// utils/auth.utils.ts - Utilidades para manejo de tokens y autenticación

import type { LoginResponse, RefreshResponse, UserResponse } from "@/types/Auth";

// Claves de almacenamiento
const TOKEN_KEYS = {
    ACCESS_TOKEN: "sigcap_access_token",
    REFRESH_TOKEN: "sigcap_refresh_token",
    USER: "sigcap_user",
    SOCIO_EXTRA: "sigcap_socio_extra",
} as const;

// Interfaz para socio extra
export interface SocioExtra {
    id: string;
    n_socio: number;
    monto_semanal: number;
}

// ==================== GUARDAR DATOS ====================

/**
 * Guarda todos los datos de autenticación después del login
 */
export function saveAuthData(loginResponse: LoginResponse): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, loginResponse.accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, loginResponse.refreshToken);
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(loginResponse.user));
}

/**
 * Guarda datos extra del socio
 */
export function saveSocioExtra(socioExtra: SocioExtra | null): void {
    if (typeof window === "undefined") return;

    if (socioExtra) {
        localStorage.setItem(TOKEN_KEYS.SOCIO_EXTRA, JSON.stringify(socioExtra));
    } else {
        localStorage.removeItem(TOKEN_KEYS.SOCIO_EXTRA);
    }
}

/**
 * Actualiza los tokens después de un refresh
 */
export function updateTokens(refreshResponse: RefreshResponse): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, refreshResponse.accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshResponse.refreshToken);
}

// ==================== OBTENER DATOS ====================

/**
 * Obtiene el access token
 */
export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
}

/**
 * Obtiene el refresh token
 */
export function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
}

/**
 * Obtiene los datos del usuario
 */
export function getUser(): UserResponse | null {
    if (typeof window === "undefined") return null;

    const user = localStorage.getItem(TOKEN_KEYS.USER);
    try {
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

/**
 * Obtiene los datos extra del socio
 */
export function getSocioExtra(): SocioExtra | null {
    if (typeof window === "undefined") return null;

    const socioExtra = localStorage.getItem(TOKEN_KEYS.SOCIO_EXTRA);
    try {
        return socioExtra ? JSON.parse(socioExtra) : null;
    } catch {
        return null;
    }
}

// ==================== VERIFICACIONES ====================

/**
 * Verifica si hay una sesión activa
 */
export function isAuthenticated(): boolean {
    return !!getAccessToken();
}

/**
 * Obtiene el rol del usuario
 */
export function getUserRole(): "admin" | "socio" | null {
    const user = getUser();
    return user?.rol ?? null;
}

/**
 * Verifica si el usuario es admin
 */
export function isAdmin(): boolean {
    return getUserRole() === "admin";
}

/**
 * Verifica si el usuario es socio
 */
export function isSocio(): boolean {
    return getUserRole() === "socio";
}

// ==================== LIMPIAR DATOS ====================

/**
 * Limpia todos los datos de autenticación (logout)
 */
export function clearAuthData(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.USER);
    localStorage.removeItem(TOKEN_KEYS.SOCIO_EXTRA);

    // También limpiar los tokens antiguos si existen
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("socioExtra");
}

/**
 * Actualiza los datos del usuario en localStorage
 */
export function updateUser(user: UserResponse): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
}

// ==================== BROADCAST CHANNEL ====================

/**
 * Canal para sincronizar logout entre tabs
 */
let authChannel: BroadcastChannel | null = null;

export function getAuthChannel(): BroadcastChannel | null {
    if (typeof window === "undefined") return null;

    if (!authChannel) {
        try {
            authChannel = new BroadcastChannel("sigcap_auth");
        } catch {
            // BroadcastChannel no soportado
            return null;
        }
    }
    return authChannel;
}

/**
 * Notifica logout a otras tabs
 */
export function broadcastLogout(): void {
    const channel = getAuthChannel();
    if (channel) {
        channel.postMessage({ type: "logout" });
    }
}

/**
 * Escucha eventos de logout de otras tabs
 */
export function onLogoutBroadcast(callback: () => void): () => void {
    const channel = getAuthChannel();
    if (!channel) return () => { };

    const handler = (event: MessageEvent) => {
        if (event.data?.type === "logout") {
            callback();
        }
    };

    channel.addEventListener("message", handler);
    return () => channel.removeEventListener("message", handler);
}
