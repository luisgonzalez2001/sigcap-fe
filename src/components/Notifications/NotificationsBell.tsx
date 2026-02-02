"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/context/NotificationsContext";
import { useToast } from "@/context/ToastContext";
import api from "@/services/api";
import type {
  Notification,
  NotificationType,
  SolicitudAsociacionData,
} from "@/types/Notification";
import type { AxiosError } from "axios";

// PrimeReact
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { OverlayPanel } from "primereact/overlaypanel";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tooltip } from "primereact/tooltip";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";

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
    case "prestamo_cancelado":
      return "pi pi-ban";
    case "recordatorio_pago":
      return "pi pi-clock";
    case "prestamo_vencido":
      return "pi pi-exclamation-triangle";
    case "socio_aprobado":
      return "pi pi-user-plus";
    case "socio_rechazado":
      return "pi pi-user-minus";
    case "solicitud_asociacion":
      return "pi pi-user-edit";
    case "sistema":
      return "pi pi-info-circle";
    default:
      return "pi pi-bell";
  }
}

/**
 * Obtener color de fondo según tipo de notificación (formato hex)
 */
function getNotificationBgColor(tipo: NotificationType | string): string {
  switch (tipo) {
    case "abono_semanal":
      return "#dcfce7"; // Verde claro
    case "abono_prestamo":
      return "#dbeafe"; // Azul claro
    case "prestamo_aprobado":
      return "#ccfbf1"; // Teal claro
    case "prestamo_rechazado":
      return "#fee2e2"; // Rojo claro
    case "prestamo_cancelado":
      return "#ffedd5"; // Naranja claro
    case "recordatorio_pago":
      return "#ffedd5"; // Naranja claro
    case "prestamo_vencido":
      return "#fecaca"; // Rojo medio
    case "socio_aprobado":
      return "#f3e8ff"; // Púrpura claro
    case "socio_rechazado":
      return "#fce7f3"; // Rosa claro
    case "solicitud_asociacion":
      return "#cffafe"; // Cyan claro
    case "sistema":
      return "#e0e7ff"; // Índigo claro
    default:
      return "#f3f4f6"; // Gris claro
  }
}

/**
 * Obtener color de icono según tipo de notificación (formato hex)
 */
function getNotificationIconColor(tipo: NotificationType | string): string {
  switch (tipo) {
    case "abono_semanal":
      return "#16a34a"; // Verde
    case "abono_prestamo":
      return "#2563eb"; // Azul
    case "prestamo_aprobado":
      return "#0d9488"; // Teal
    case "prestamo_rechazado":
      return "#dc2626"; // Rojo
    case "prestamo_cancelado":
      return "#ea580c"; // Naranja
    case "recordatorio_pago":
      return "#ea580c"; // Naranja
    case "prestamo_vencido":
      return "#b91c1c"; // Rojo oscuro
    case "socio_aprobado":
      return "#9333ea"; // Púrpura
    case "socio_rechazado":
      return "#db2777"; // Rosa
    case "solicitud_asociacion":
      return "#0891b2"; // Cyan
    case "sistema":
      return "#4f46e5"; // Índigo
    default:
      return "#4b5563"; // Gris
  }
}

/**
 * Obtener color de borde según prioridad (formato hex)
 */
function getPriorityBorderColor(prioridad: string): string {
  switch (prioridad) {
    case "alta":
      return "#ef4444"; // Rojo
    case "media":
      return "#eab308"; // Amarillo
    case "baja":
      return "#22c55e"; // Verde
    default:
      return "#d1d5db"; // Gris
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
  onActionComplete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onActionComplete?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const toast = useToast();

  const bgColor = getNotificationBgColor(notification.tipo);
  const iconColor = getNotificationIconColor(notification.tipo);
  const icon = getNotificationIcon(notification.tipo);
  const priorityBorderColor = getPriorityBorderColor(notification.prioridad);

  // Verificar si es una solicitud de asociación y extraer el ID
  const isSolicitudAsociacion = notification.tipo === "solicitud_asociacion";
  const solicitudId =
    isSolicitudAsociacion &&
    notification.datos_json &&
    "solicitud_id" in notification.datos_json
      ? (notification.datos_json as SolicitudAsociacionData).solicitud_id
      : undefined;

  const handleAprobar = async () => {
    if (!solicitudId) return;

    setLoading(true);
    try {
      await api.post("/solicitudes-asociacion/aprobar", {
        solicitud_id: solicitudId,
      });

      toast.showSuccess(
        "Solicitud Aprobada",
        "El usuario ahora es socio de SIGCAP",
      );

      // Marcar notificación como leída y recargar
      onMarkAsRead(notification.id);
      onActionComplete?.();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.showError(
        "Error",
        err.response?.data?.message ||
          "No se pudo aprobar la solicitud. Intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!solicitudId) return;

    setLoading(true);
    try {
      await api.post("/solicitudes-asociacion/rechazar", {
        solicitud_id: solicitudId,
        motivo_rechazo: motivoRechazo || undefined,
      });

      toast.showInfo("Solicitud Rechazada", "Se ha notificado al usuario");

      // Marcar notificación como leída y recargar
      onMarkAsRead(notification.id);
      setShowRejectDialog(false);
      setMotivoRechazo("");
      onActionComplete?.();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.showError(
        "Error",
        err.response?.data?.message ||
          "No se pudo rechazar la solicitud. Intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`p-3 cursor-pointer transition-colors transition-duration-200 hover:surface-100`}
        style={{
          borderLeft: `3px solid ${priorityBorderColor}`,
          backgroundColor: !notification.leida ? "#f9fafb" : "transparent",
        }}
        onClick={() => {
          if (!notification.leida && !isSolicitudAsociacion) {
            onMarkAsRead(notification.id);
          }
        }}
      >
        <div className="flex gap-3">
          {/* Icono */}
          <div
            className="flex-shrink-0 flex align-items-center justify-content-center border-circle"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: bgColor,
            }}
          >
            <i
              className={icon}
              style={{
                fontSize: "1.1rem",
                color: iconColor,
              }}
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

            {/* Botones de acción para solicitudes de asociación */}
            {isSolicitudAsociacion && solicitudId && (
              <div className="flex gap-2 mt-3">
                <Button
                  label="Aprobar"
                  icon="pi pi-check"
                  size="small"
                  severity="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAprobar();
                  }}
                  loading={loading}
                  className="flex-1"
                />
                <Button
                  label="Rechazar"
                  icon="pi pi-times"
                  size="small"
                  severity="danger"
                  outlined
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRejectDialog(true);
                  }}
                  disabled={loading}
                  className="flex-1"
                />
              </div>
            )}

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

      {/* Dialog para rechazar con motivo */}
      <Dialog
        header="Rechazar Solicitud"
        visible={showRejectDialog}
        style={{ width: "90vw", maxWidth: "450px" }}
        onHide={() => {
          if (!loading) {
            setShowRejectDialog(false);
            setMotivoRechazo("");
          }
        }}
        draggable={false}
        resizable={false}
      >
        <div className="flex flex-column gap-3">
          <p className="m-0 text-600">
            ¿Estás seguro de rechazar esta solicitud? Puedes agregar un motivo
            (opcional) que será notificado al usuario.
          </p>

          <div className="flex flex-column gap-2">
            <label htmlFor="motivo" className="font-semibold text-sm">
              Motivo del rechazo (Opcional)
            </label>
            <InputTextarea
              id="motivo"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={4}
              placeholder="Ej: Documentación incompleta, monto no disponible, etc."
              maxLength={500}
              disabled={loading}
            />
            <small className="text-400">
              {motivoRechazo.length}/500 caracteres
            </small>
          </div>

          <div className="flex gap-2 justify-content-end mt-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              outlined
              onClick={() => {
                setShowRejectDialog(false);
                setMotivoRechazo("");
              }}
              disabled={loading}
            />
            <Button
              label="Rechazar Solicitud"
              icon="pi pi-check"
              severity="danger"
              onClick={handleRechazar}
              loading={loading}
            />
          </div>
        </div>
      </Dialog>
    </>
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
    isReconnecting,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    fetchNotifications,
    retryConnection,
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
        className="relative"
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
            style={{
              top: "3px",
              fontSize: "1rem",
              zIndex: 1,
            }}
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
                    onActionComplete={fetchNotifications}
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

        {/* Estado de conexión/reconexión */}
        {!isConnected && (
          <div
            className="px-3 py-2 text-sm flex align-items-center justify-content-between gap-2"
            style={{ 
              backgroundColor: isReconnecting ? "rgba(59, 130, 246, 0.1)" : "rgba(250, 204, 21, 0.1)",
              color: isReconnecting ? "#2563eb" : "#b45309"
            }}
          >
            <div className="flex align-items-center gap-2">
              {isReconnecting ? (
                <>
                  <i className="pi pi-spin pi-spinner" />
                  <span>{error || "Conectando..."}</span>
                </>
              ) : (
                <>
                  <i className="pi pi-exclamation-triangle" />
                  <span>{error || "Sin conexión en tiempo real"}</span>
                </>
              )}
            </div>
            {!isReconnecting && (
              <Button
                icon="pi pi-refresh"
                rounded
                text
                size="small"
                onClick={retryConnection}
                className="p-0"
                style={{ width: "24px", height: "24px" }}
                tooltip="Reintentar conexión"
                tooltipOptions={{ position: "left" }}
              />
            )}
          </div>
        )}
      </OverlayPanel>
    </div>
  );
}

export default NotificationsBell;
