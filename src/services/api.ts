// services/api.ts - Cliente HTTP con interceptores para refresh automático de tokens

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
    getAccessToken,
    getRefreshToken,
    updateTokens,
    clearAuthData,
    broadcastLogout,
} from "@/utils/auth.utils";
import type { RefreshResponse } from "@/types/Auth";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Crear instancia de Axios
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Flag para evitar múltiples refreshes simultáneos
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
}> = [];

// Procesar cola de peticiones fallidas
const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
    /^\/auth\/login/,
    /^\/auth\/signup/,
    /^\/auth\/recover-account/,
    /^\/auth\/recover$/,
    /^\/auth\/verify/,
    /^\/auth\/refresh/,
];

function isPublicRoute(url: string): boolean {
    return PUBLIC_ROUTES.some((route) => route.test(url));
}

// REQUEST INTERCEPTOR: Agregar token a cada petición
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // No agregar token a rutas públicas
        if (config.url && isPublicRoute(config.url)) {
            return config;
        }

        const token = getAccessToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Manejar 401 y refresh automático
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // Manejar errores de red (sin respuesta del servidor)
        if (!error.response) {
            console.warn("[API] Error de red:", error.message);
            // No hacer nada especial, dejar que el componente maneje el error
            return Promise.reject(error);
        }

        // Si no hay config o no es 401, rechazar normalmente
        if (!originalRequest || error.response?.status !== 401) {
            return Promise.reject(error);
        }

        // Si ya es un retry, rechazar
        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        // Evitar refresh en endpoints de auth
        if (originalRequest.url && isPublicRoute(originalRequest.url)) {
            return Promise.reject(error);
        }

        // Si ya se está haciendo refresh, encolar esta petición
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = getRefreshToken();

            if (!refreshToken) {
                throw new Error("No refresh token available");
            }

            // Usar axios puro para evitar el interceptor (evita loop infinito)
            const { data } = await axios.post<RefreshResponse>(
                `${API_BASE_URL}/auth/refresh`,
                { refreshToken }
            );

            // Guardar nuevos tokens
            updateTokens(data);

            // Procesar peticiones encoladas con el nuevo token
            processQueue(null, data.accessToken);

            // Reintentar petición original con nuevo token
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            // Refresh falló, limpiar y notificar
            processQueue(refreshError as Error, null);
            clearAuthData();
            broadcastLogout();

            // Redirigir a login (solo en cliente)
            if (typeof window !== "undefined") {
                window.location.href = "/auth/login";
            }

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
export { API_BASE_URL };
