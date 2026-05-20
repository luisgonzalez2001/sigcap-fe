// services/notifications-api.ts - Cliente REST para notificaciones
import axios from "axios";
import type {
    Notification,
    NotificationsResponse,
    UnreadCountResponse,
    NotificationFilters,
    NotificationApiResponse,
} from "@/types/Notification";
import { getAccessToken } from "@/utils/auth.utils";

const NOTIFICATIONS_API_URL =
    process.env.NEXT_PUBLIC_NOTIFICATIONS_API ||
    "http://localhost:3001/api/v1/notifications";

// Timeout más largo para cold starts del backend (60 segundos)
const COLD_START_TIMEOUT = 60000;

// Crear instancia de axios para el servicio de notificaciones
const notificationsApi = axios.create({
    baseURL: NOTIFICATIONS_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: COLD_START_TIMEOUT, // Timeout generoso para cold starts
});

// Interceptor para agregar token de autenticación
notificationsApi.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar errores de forma silenciosa
notificationsApi.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log del error pero no bloquear la UI
        if (error.code === 'ECONNABORTED') {
            console.warn('[NotificationsAPI] Timeout - el servicio puede estar iniciando');
        } else if (!error.response) {
            console.warn('[NotificationsAPI] Error de red:', error.message);
        }
        return Promise.reject(error);
    }
);

/**
 * Obtener notificaciones del usuario
 */
export async function getNotifications(
    userId: string,
    filters: NotificationFilters = {}
): Promise<NotificationsResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.leida !== undefined)
        params.append("leida", filters.leida.toString());
    if (filters.tipo) params.append("tipo", filters.tipo);
    if (filters.prioridad) params.append("prioridad", filters.prioridad);
    if (filters.desde) params.append("desde", filters.desde);
    if (filters.hasta) params.append("hasta", filters.hasta);

    const queryString = params.toString();
    const url = `/user/${userId}${queryString ? `?${queryString}` : ""}`;

    const { data } = await notificationsApi.get<NotificationsResponse>(url);
    return data;
}

/**
 * Obtener contador de notificaciones no leídas
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const { data } = await notificationsApi.get<UnreadCountResponse>(
        `/user/${userId}/unread-count`
    );
    return data.data.count;
}

/**
 * Marcar notificación como leída
 */
export async function markNotificationAsRead(
    notificationId: string,
    userId: string
): Promise<Notification> {
    const { data } = await notificationsApi.patch<
        NotificationApiResponse<Notification>
    >(`/${notificationId}/read`, {}, {
        headers: {
            "x-user-id": userId,
        },
    });

    if (!data.success || !data.data) {
        throw new Error("Error al marcar notificación como leída");
    }

    return data.data;
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function markAllNotificationsAsRead(
    userId: string
): Promise<number> {
    const { data } = await notificationsApi.patch<
        NotificationApiResponse<{ affected: number }>
    >(`/user/${userId}/read-all`);

    if (!data.success || !data.data) {
        throw new Error("Error al marcar notificaciones como leídas");
    }

    return data.data.affected;
}

/**
 * Eliminar notificación
 */
export async function deleteNotification(
    notificationId: string,
    userId: string
): Promise<void> {
    await notificationsApi.delete(`/${notificationId}`, {
        headers: {
            "x-user-id": userId,
        },
    });
}

/**
 * Crear/enviar una notificación a un usuario
 */
export async function createNotification(payload: {
    usuario_id: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    prioridad?: "baja" | "media" | "alta";
    datos_json?: Record<string, unknown>;
}): Promise<void> {
    await notificationsApi.post("/", payload);
}

/**
 * Health check del servicio de notificaciones
 */
export async function checkNotificationsHealth(): Promise<boolean> {
    try {
        const { data } = await notificationsApi.get("/health");
        return data.success === true;
    } catch {
        return false;
    }
}

export default notificationsApi;
