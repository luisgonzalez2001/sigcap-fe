"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/context/NotificationsContext";
import type { Notification, NotificationType } from "@/types/Notification";

// PrimeReact
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { OverlayPanel } from "primereact/overlaypanel";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tooltip } from "primereact/tooltip";

/**
 * Obtener icono según tipo de notificación
 */
function getNotificationIcon(tipo: NotificationType | string): string {
  switch (tipo) {
    case "abono_semanal":
      return "pi pi-wallet";
    case "abono_prestamo":
      return "pi pi-dollar";
    case "prestamo_aprobado":
      return "pi pi-check-circle";
    case "prestamo_rechazado":
      return "pi pi-times-circle";
    case "recordatorio_pago":
      return "pi pi-clock";
    case "prestamo_vencido":
      return "pi pi-exclamation-triangle";
    case "socio_aprobado":
      return "pi pi-user-plus";
    case "sistema":
      return "pi pi-info-circle";
    default:
      return "pi pi-bell";
  }
}

/**
 * Obtener color de fondo según tipo de notificación
 */
function getNotificationBgColor(tipo: NotificationType | string): string {
  switch (tipo) {
    case "abono_semanal":
      return "bg-green-100";
    case "abono_prestamo":
      return "bg-blue-100";
    case "prestamo_aprobado":
      return "bg-teal-100";
    case "prestamo_rechazado":
      return "bg-red-100";
    case "recordatorio_pago":
      return "bg-orange-100";
    case "prestamo_vencido":
      return "bg-red-200";
    case "socio_aprobado":
      return "bg-purple-100";
    case "sistema":
      return "bg-indigo-100";
    default:
      return "bg-gray-100";
  }
}

/**
 * Obtener color de icono según tipo de notificación
 */
function getNotificationIconColor(tipo: NotificationType | string): string {
  switch (tipo) {
    case "abono_semanal":
      return "text-green-600";
    case "abono_prestamo":
      return "text-blue-600";
    case "prestamo_aprobado":
      return "text-teal-600";
    case "prestamo_rechazado":
      return "text-red-600";
    case "recordatorio_pago":
      return "text-orange-600";
    case "prestamo_vencido":
      return "text-red-700";
    case "socio_aprobado":
      return "text-purple-600";
    case "sistema":
      return "text-indigo-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Obtener clase de borde según prioridad
 */
function getPriorityBorderClass(prioridad: string): string {
  switch (prioridad) {
    case "alta":
      return "border-left-3 border-red-500";
    case "media":
      return "border-left-3 border-yellow-500";
    case "baja":
      return "border-left-3 border-green-500";
    default:
      return "border-left-3 border-gray-300";
  }
}

/**
 * Formatear tiempo relativo
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Componente de item de notificación
 */
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const bgColor = getNotificationBgColor(notification.tipo);
  const iconColor = getNotificationIconColor(notification.tipo);
  const icon = getNotificationIcon(notification.tipo);
  const priorityBorder = getPriorityBorderClass(notification.prioridad);

  return (
    <div
      className={`p-3 cursor-pointer transition-colors transition-duration-200 hover:surface-100 ${priorityBorder} ${
        !notification.leida ? "surface-50" : ""
      }`}
      onClick={() => {
        if (!notification.leida) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      <div className="flex gap-3">
        {/* Icono */}
        <div
          className={`flex-shrink-0 flex align-items-center justify-content-center border-circle ${bgColor}`}
          style={{ width: "40px", height: "40px" }}
        >
          <i
            className={`${icon} ${iconColor}`}
            style={{ fontSize: "1.1rem" }}
          />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex align-items-start justify-content-between gap-2">
            <p
              className={`m-0 text-sm line-height-3 ${
                !notification.leida ? "font-semibold text-900" : "text-700"
              }`}
            >
              {notification.titulo}
            </p>
            {!notification.leida && (
              <span
                className="flex-shrink-0 border-circle bg-primary"
                style={{ width: "8px", height: "8px", marginTop: "6px" }}
              />
            )}
          </div>
          <p className="m-0 mt-1 text-sm text-600 line-height-3 white-space-normal">
            {notification.mensaje}
          </p>
          <div className="flex align-items-center justify-content-between mt-2">
            <span className="text-xs text-400">
              {formatTimeAgo(notification.fecha_creacion)}
            </span>
            <Button
              icon="pi pi-trash"
              rounded
              text
              severity="danger"
              size="small"
              className="p-0"
              style={{ width: "24px", height: "24px" }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              tooltip="Eliminar"
              tooltipOptions={{ position: "left" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de campana de notificaciones
 */
export function NotificationsBell() {
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    fetchNotifications,
  } = useNotifications();

  const overlayRef = useRef<OverlayPanel>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Recargar notificaciones al abrir el panel
  useEffect(() => {
    if (isOpen && isConnected) {
      fetchNotifications();
    }
  }, [isOpen, isConnected, fetchNotifications]);

  const handleToggle = (e: React.MouseEvent) => {
    overlayRef.current?.toggle(e);
    setIsOpen(!isOpen);
  };

  const handleHide = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Botón de campana */}
      <Button
        icon="pi pi-bell"
        rounded
        text
        severity="secondary"
        onClick={handleToggle}
        className="relative p-overlay-badge"
        style={{ width: "2.5rem", height: "2.5rem" }}
        data-pr-tooltip={
          isConnected ? "Notificaciones" : "Sin conexión a notificaciones"
        }
      >
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <Badge
            value={unreadCount > 99 ? "99+" : unreadCount.toString()}
            severity="danger"
            className="absolute"
            style={{ top: "-4px", right: "-4px", fontSize: "0.65rem" }}
          />
        )}
      </Button>

      {/* Indicador de conexión */}
      <span
        className={`absolute border-circle border-2 border-white`}
        style={{
          width: "10px",
          height: "10px",
          bottom: "2px",
          right: "2px",
          backgroundColor: isConnected ? "#22c55e" : "#9ca3af",
        }}
        data-pr-tooltip={isConnected ? "Conectado" : "Desconectado"}
      />
      <Tooltip target=".relative span[data-pr-tooltip]" position="bottom" />

      {/* Panel de notificaciones */}
      <OverlayPanel
        ref={overlayRef}
        onHide={handleHide}
        className="shadow-4"
        style={{ width: "380px", maxWidth: "95vw" }}
      >
        {/* Header */}
        <div className="flex align-items-center justify-content-between px-3 py-2 surface-50 border-round-top">
          <div className="flex align-items-center gap-2">
            <h3 className="m-0 text-lg font-semibold text-800">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <Badge
                value={unreadCount.toString()}
                severity="info"
                className="text-xs"
              />
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              label="Marcar todas"
              icon="pi pi-check-circle"
              text
              size="small"
              onClick={markAllAsRead}
              className="p-button-sm"
            />
          )}
        </div>

        <Divider className="my-0" />

        {/* Lista de notificaciones */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "400px", minHeight: "100px" }}
        >
          {isLoading ? (
            <div className="flex align-items-center justify-content-center py-6">
              <ProgressSpinner
                style={{ width: "40px", height: "40px" }}
                strokeWidth="4"
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-column align-items-center justify-content-center py-6 text-center">
              <i
                className="pi pi-bell-slash text-4xl text-300 mb-3"
                style={{ fontSize: "3rem" }}
              />
              <p className="m-0 text-600">No tienes notificaciones</p>
              <p className="m-0 mt-1 text-sm text-400">
                Las nuevas notificaciones aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="flex flex-column">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={removeNotification}
                  />
                  {index < notifications.length - 1 && (
                    <Divider className="my-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Divider className="my-0" />
            <div className="px-3 py-2 surface-50 border-round-bottom text-center">
              <Button
                label="Ver todas las notificaciones"
                link
                className="p-button-sm text-primary"
                onClick={() => {
                  // TODO: Navegar a página de notificaciones
                  console.log("Ver todas las notificaciones");
                }}
              />
            </div>
          </>
        )}

        {/* Estado de conexión */}
        {!isConnected && (
          <div
            className="px-3 py-2 text-orange-700 text-sm flex align-items-center gap-2"
            style={{ backgroundColor: "rgba(250, 204, 21, 0.1)" }}
          >
            <i className="pi pi-exclamation-triangle" />
            <span>Sin conexión en tiempo real</span>
          </div>
        )}
      </OverlayPanel>
    </div>
  );
}

export default NotificationsBell;
