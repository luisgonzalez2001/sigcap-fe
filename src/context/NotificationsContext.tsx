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

// ==================== INTERFACES ====================

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  clearError: () => void;
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
  const [error, setError] = useState<string | null>(null);

  const toastRef = useRef<Toast>(null);

  // ==================== FETCH NOTIFICATIONS ====================

  const fetchNotifications = useCallback(
    async (filters: NotificationFilters = {}) => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await getNotifications(user.id, {
          limit: 50,
          ...filters,
        });
        setNotifications(response.data);
      } catch (err) {
        console.error("Error al obtener notificaciones:", err);
        setError("Error al cargar las notificaciones");
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id],
  );

  // ==================== FETCH UNREAD COUNT ====================

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error("Error al obtener contador de no leídas:", err);
    }
  }, [user?.id]);

  // ==================== MARK AS READ ====================

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;

      try {
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

        // También notificar via WebSocket
        notificationsSocket.markAsRead(notificationId);
      } catch (err) {
        console.error("Error al marcar notificación como leída:", err);
        setError("Error al marcar como leída");
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

    // Escuchar errores
    const unsubscribeError = notificationsSocket.onError((errorMessage) => {
      console.error("Error de WebSocket:", errorMessage);
      setError(errorMessage);
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

  // ==================== VALUE ====================

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearError,
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
