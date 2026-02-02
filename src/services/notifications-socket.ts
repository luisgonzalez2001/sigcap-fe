// services/notifications-socket.ts - Cliente de WebSocket para notificaciones
import { io, Socket } from "socket.io-client";
import type {
    Notification,
    SocketConnectedEvent,
    SocketAuthenticatedEvent,
    NotificationSocketEvent,
    UnreadCountUpdateEvent,
} from "@/types/Notification";

const NOTIFICATIONS_URL =
    process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || "http://localhost:3001";

// Timeouts más largos para cold starts
const CONNECTION_TIMEOUT = 60000; // 60 segundos para conexión inicial
const RECONNECTION_DELAY = 2000;
const MAX_RECONNECTION_DELAY = 30000;

type NotificationCallback = (notification: Notification) => void;
type UnreadCountCallback = () => void;
type ConnectionCallback = (isConnected: boolean) => void;
type ErrorCallback = (error: string) => void;

class NotificationsSocket {
    private socket: Socket | null = null;
    private userId: string | null = null;
    private notificationCallbacks: NotificationCallback[] = [];
    private unreadCountCallbacks: UnreadCountCallback[] = [];
    private connectionCallbacks: ConnectionCallback[] = [];
    private errorCallbacks: ErrorCallback[] = [];
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    /**
     * Conecta al servidor de notificaciones
     */
    connect(userId: string): Socket | null {
        // Si ya está conectado con el mismo usuario, no reconectar
        if (this.socket?.connected && this.userId === userId) {
            console.log("[NotificationsSocket] Ya conectado con el mismo usuario");
            return this.socket;
        }

        // Desconectar socket anterior si existe
        if (this.socket) {
            this.disconnect();
        }

        this.userId = userId;

        try {
            this.socket = io(`${NOTIFICATIONS_URL}/notifications`, {
                transports: ["websocket"],
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: RECONNECTION_DELAY,
                reconnectionDelayMax: MAX_RECONNECTION_DELAY,
                timeout: CONNECTION_TIMEOUT,
            });

            this.setupEventListeners();
            console.log("[NotificationsSocket] Intentando conectar...");

            return this.socket;
        } catch (error) {
            console.error("[NotificationsSocket] Error al crear socket:", error);
            return null;
        }
    }

    /**
     * Configura los listeners de eventos del socket
     */
    private setupEventListeners(): void {
        if (!this.socket) return;

        // Evento de conexión exitosa
        this.socket.on("connected", (data: SocketConnectedEvent) => {
            console.log("[NotificationsSocket] Conectado:", data);
            this.reconnectAttempts = 0;

            // Autenticar después de conectar
            if (this.userId) {
                this.socket?.emit("authenticate", { userId: this.userId });
            }
        });

        // Evento de autenticación
        this.socket.on("authenticated", (data: SocketAuthenticatedEvent) => {
            console.log("[NotificationsSocket] Autenticado:", data);
            if (data.success) {
                this.notifyConnectionChange(true);
            }
        });

        // Nueva notificación
        this.socket.on("notification", (event: NotificationSocketEvent) => {
            console.log("[NotificationsSocket] Nueva notificación:", event);
            this.notificationCallbacks.forEach((callback) => callback(event.data));
        });

        // Actualización de contador de no leídas
        this.socket.on("unreadCountUpdate", (event: UnreadCountUpdateEvent) => {
            console.log("[NotificationsSocket] Actualización de contador:", event);
            this.unreadCountCallbacks.forEach((callback) => callback());
        });

        // Eventos de conexión/desconexión
        this.socket.on("connect", () => {
            console.log("[NotificationsSocket] Socket conectado");
        });

        this.socket.on("disconnect", (reason) => {
            console.log("[NotificationsSocket] Desconectado:", reason);
            this.notifyConnectionChange(false);
        });

        this.socket.on("connect_error", (error) => {
            console.error("[NotificationsSocket] Error de conexión:", error);
            this.reconnectAttempts++;
            this.errorCallbacks.forEach((callback) =>
                callback(`Error de conexión: ${error.message}`)
            );
        });

        // Respuesta a ping
        this.socket.on("pong", (data: { timestamp: string }) => {
            console.log("[NotificationsSocket] Pong recibido:", data);
        });

        // Errores del servidor
        this.socket.on("error", (data: { message: string }) => {
            console.error("[NotificationsSocket] Error del servidor:", data);
            this.errorCallbacks.forEach((callback) => callback(data.message));
        });
    }

    /**
     * Desconecta del servidor de notificaciones
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.userId = null;
        this.notifyConnectionChange(false);
        console.log("[NotificationsSocket] Desconectado");
    }

    /**
     * Verifica si está conectado
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Suscribirse a nuevas notificaciones
     */
    onNotification(callback: NotificationCallback): () => void {
        this.notificationCallbacks.push(callback);
        return () => {
            this.notificationCallbacks = this.notificationCallbacks.filter(
                (cb) => cb !== callback
            );
        };
    }

    /**
     * Suscribirse a actualizaciones de contador de no leídas
     */
    onUnreadCountUpdate(callback: UnreadCountCallback): () => void {
        this.unreadCountCallbacks.push(callback);
        return () => {
            this.unreadCountCallbacks = this.unreadCountCallbacks.filter(
                (cb) => cb !== callback
            );
        };
    }

    /**
     * Suscribirse a cambios de conexión
     */
    onConnectionChange(callback: ConnectionCallback): () => void {
        this.connectionCallbacks.push(callback);
        return () => {
            this.connectionCallbacks = this.connectionCallbacks.filter(
                (cb) => cb !== callback
            );
        };
    }

    /**
     * Suscribirse a errores
     */
    onError(callback: ErrorCallback): () => void {
        this.errorCallbacks.push(callback);
        return () => {
            this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
        };
    }

    /**
     * Notificar cambio de conexión
     */
    private notifyConnectionChange(isConnected: boolean): void {
        this.connectionCallbacks.forEach((callback) => callback(isConnected));
    }

    /**
     * Marcar notificación como leída via WebSocket
     */
    markAsRead(notificationId: string): void {
        if (this.socket?.connected) {
            this.socket.emit("markAsRead", { notificationId });
        }
    }

    /**
     * Enviar ping para mantener conexión viva
     */
    ping(): void {
        if (this.socket?.connected) {
            this.socket.emit("ping", {});
        }
    }
}

// Exportar instancia singleton
export const notificationsSocket = new NotificationsSocket();

export default notificationsSocket;
