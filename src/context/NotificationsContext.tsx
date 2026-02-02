"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { notificationsSocket } from "@/services/notifications-socket";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/services/notifications-api";
import type { Notification, NotificationFilters } from "@/types/Notification";
import { Toast } from "primereact/toast";

// ==================== CONSTANTS ====================

const MAX_RETRIES = 5;
const RETRY_DELAYS = [5000, 10000, 20000, 30000, 60000]; // Delays progresivos en ms

// ==================== HELPERS ====================

function isTimeoutError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const err = error as {
      message?: string;
      code?: string;
      response?: { status?: number };
    };
    return (
      err.message?.includes("timeout") ||
      err.message?.includes("ECONNABORTED") ||
      err.message?.includes("Network Error") ||
      err.code === "ETIMEDOUT" ||
      err.code === "ECONNABORTED" ||
      err.response?.status === 408 ||
      err.response?.status === 504
    );
  }
  return false;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes("timeout") ||
      error.message.includes("ECONNABORTED")
    ) {
      return "El servicio está iniciando, esto puede tomar unos segundos...";
    }
    if (error.message.includes("Network Error")) {
      return "Error de red. Verificando conexión...";
    }
    return error.message;
  }
  return "Ocurrió un error desconocido";
}

// ==================== INTERFACES ====================

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  isReconnecting: boolean;
  error: string | null;
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  clearError: () => void;
  retryConnection: () => void;
}

// ==================== CONTEXT ====================

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

// ==================== PROVIDER ====================

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toastRef = useRef<Toast>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // ==================== FETCH NOTIFICATIONS CON RETRY ====================

  const fetchNotifications = useCallback(
    async (filters: NotificationFilters = {}) => {
      if (!user?.id) return;

      setIsLoading(true);
      // No limpiamos el error aquí para mantenerlo visible durante reintentos

      try {
        const response = await getNotifications(user.id, {
          limit: 50,
          ...filters,
        });
        setNotifications(response.data);
        setError(null); // Solo limpiamos el error si la petición fue exitosa
        retryCountRef.current = 0; // Resetear contador de reintentos
      } catch (err) {
        console.error("Error al obtener notificaciones:", err);
        // Solo mostrar error si no estamos reconectando
        if (!isReconnecting) {
          const errorMessage = getErrorMessage(err);
          if (isTimeoutError(err)) {
            setError("Conectando al servicio de notificaciones...");
          } else {
            setError(errorMessage);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, isReconnecting],
  );

  // ==================== FETCH UNREAD COUNT ====================

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error("Error al obtener contador de no leídas:", err);
      // No mostrar error para esto, es menos crítico
    }
  }, [user?.id]);

  // ==================== MARK AS READ ====================

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;

      try {
        // Marcar como leída via REST API (incluye header x-user-id)
        await markNotificationAsRead(notificationId, user.id);

        // Actualizar estado local
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, leida: true, fecha_lectura: new Date().toISOString() }
              : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // NOTA: No usamos WebSocket para marcar como leída porque
        // el backend requiere el header HTTP x-user-id que solo
        // está disponible en peticiones REST, no en eventos WebSocket
      } catch (err) {
        console.error("Error al marcar notificación como leída:", err);
        setError("Error al marcar como leída");

        // Mostrar el error específico si está disponible
        if (err instanceof Error) {
          console.error("Detalle del error:", err.message);
        }
      }
    },
    [user?.id],
  );

  // ==================== MARK ALL AS READ ====================

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      await markAllNotificationsAsRead(user.id);

      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          leida: true,
          fecha_lectura: n.fecha_lectura || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err);
      setError("Error al marcar todas como leídas");
    }
  }, [user?.id]);

  // ==================== REMOVE NOTIFICATION ====================

  const removeNotification = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;

      try {
        await deleteNotification(notificationId, user.id);

        // Actualizar estado local
        const notification = notifications.find((n) => n.id === notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

        if (notification && !notification.leida) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error("Error al eliminar notificación:", err);
        setError("Error al eliminar la notificación");
      }
    },
    [user?.id, notifications],
  );

  // ==================== CLEAR ERROR ====================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==================== SHOW TOAST FOR NEW NOTIFICATION ====================

  const showNotificationToast = useCallback((notification: Notification) => {
    if (toastRef.current) {
      const severity =
        notification.prioridad === "alta"
          ? "warn"
          : notification.prioridad === "media"
            ? "info"
            : "success";

      toastRef.current.show({
        severity,
        summary: notification.titulo,
        detail: notification.mensaje,
        life: 5000,
        closable: true,
      });
    }
  }, []);

  // ==================== CONNECT WEBSOCKET ====================

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // Desconectar si no está autenticado
      notificationsSocket.disconnect();
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Conectar WebSocket
    notificationsSocket.connect(user.id);

    // Escuchar cambios de conexión
    const unsubscribeConnection = notificationsSocket.onConnectionChange(
      (connected) => {
        setIsConnected(connected);
        if (connected) {
          // Cargar notificaciones al conectar
          fetchNotifications();
          fetchUnreadCount();
        }
      },
    );

    // Escuchar nuevas notificaciones
    const unsubscribeNotification = notificationsSocket.onNotification(
      (notification) => {
        // Agregar al inicio de la lista
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Mostrar toast
        showNotificationToast(notification);
      },
    );

    // Escuchar actualizaciones de contador
    const unsubscribeUnreadCount = notificationsSocket.onUnreadCountUpdate(
      () => {
        fetchUnreadCount();
      },
    );

    // Escuchar errores - manejar de forma silenciosa durante reconexión
    const unsubscribeError = notificationsSocket.onError((errorMessage) => {
      console.warn("[NotificationsContext] Error de WebSocket:", errorMessage);

      // Si el error es de conexión/timeout, mostrar mensaje amigable
      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("conexión") ||
        errorMessage.includes("connection") ||
        errorMessage.includes("ECONNREFUSED")
      ) {
        // No mostrar error agresivo, solo un mensaje informativo
        setError("Conectando al servicio de notificaciones...");
      } else {
        // Para otros errores, mostrar el mensaje
        setError(errorMessage);
      }
    });

    // Cleanup
    return () => {
      unsubscribeConnection();
      unsubscribeNotification();
      unsubscribeUnreadCount();
      unsubscribeError();
      notificationsSocket.disconnect();
    };
  }, [
    isAuthenticated,
    user?.id,
    fetchNotifications,
    fetchUnreadCount,
    showNotificationToast,
  ]);

  // ==================== RETRY CONNECTION ====================

  const retryConnection = useCallback(() => {
    if (!user?.id) return;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setIsReconnecting(true);
    setError("Reconectando al servicio de notificaciones...");

    // Incrementar contador de reintentos
    const currentRetry = retryCountRef.current;
    const delay = RETRY_DELAYS[Math.min(currentRetry, RETRY_DELAYS.length - 1)];
    retryCountRef.current++;

    if (currentRetry >= MAX_RETRIES) {
      setError(
        "No se pudo conectar al servicio de notificaciones. Recarga la página para intentar de nuevo.",
      );
      setIsReconnecting(false);
      return;
    }

    // Usar un nuevo timeout para la reconexión
    retryTimeoutRef.current = setTimeout(() => {
      notificationsSocket.connect(user.id);
      fetchNotifications();
      fetchUnreadCount();
    }, delay);
  }, [user?.id, fetchNotifications, fetchUnreadCount]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // ==================== VALUE ====================

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    isReconnecting,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearError,
    retryConnection,
  };

  return (
    <NotificationsContext.Provider value={value}>
      <Toast ref={toastRef} position="top-right" />
      {children}
    </NotificationsContext.Provider>
  );
}

// ==================== HOOK ====================

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
}

export default NotificationsContext;
