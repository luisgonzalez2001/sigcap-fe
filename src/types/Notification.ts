// types/Notification.ts - Tipos para el sistema de notificaciones

/**
 * Tipos de notificación soportados
 */
export type NotificationType =
    | "abono_semanal"
    | "abono_prestamo"
    | "prestamo_aprobado"
    | "prestamo_rechazado"
    | "prestamo_cancelado"
    | "recordatorio_pago"
    | "prestamo_vencido"
    | "socio_aprobado"
    | "socio_rechazado"
    | "solicitud_asociacion"
    | "solicitud_prestamo"
    | "solicitud_prestamo_aprobada"
    | "solicitud_prestamo_rechazada"
    | "sistema"
    | "general";

/**
 * Prioridad de la notificación
 */
export type NotificationPriority = "baja" | "media" | "alta";

/**
 * Datos adicionales para notificación de abono semanal
 */
export interface AbonoSemanalData {
    caja_semanal_id: string;
    monto: number;
    semana: number;
    anio: number;
}

/**
 * Datos adicionales para notificación de préstamo aprobado
 */
export interface PrestamoAprobadoData {
    prestamo_id: string;
    monto_original: number;
    monto_total: number;
    plazo_meses: number;
    monto_cuota: number;
}

/**
 * Datos adicionales para notificación de préstamo cancelado
 */
export interface PrestamoCanceladoData {
    prestamo_id: string;
    monto_original: number;
    saldo_pendiente: number;
    motivo_cancelacion?: string;
}

/**
 * Datos adicionales para notificación de abono a préstamo
 */
export interface AbonoPrestamoData {
    prestamo_id: string;
    abono_id: string;
    monto_abonado: number;
    saldo_pendiente: number;
    cuotas_pagadas: number;
    cuotas_totales: number;
}

/**
 * Datos adicionales para notificación de recordatorio de pago
 */
export interface RecordatorioPagoData {
    prestamo_id: string;
    monto_cuota: number;
    fecha_proximo_pago: string;
    dias_restantes: number;
}

/**
 * Datos adicionales para notificación de préstamo vencido
 */
export interface PrestamoVencidoData {
    prestamo_id: string;
    dias_mora: number;
    saldo_pendiente: number;
    interes_mora: number;
    total_adeudado: number;
}

/**
 * Datos adicionales para notificación de socio aprobado
 */
export interface SocioAprobadoData {
    partner_id: string;
    n_socio: number;
    monto_semanal: number;
}

/**
 * Datos adicionales para notificación de socio rechazado
 */
export interface SocioRechazadoData {
    motivo_rechazo?: string;
}

/**
 * Datos adicionales para notificación de solicitud de asociación
 */
export interface SolicitudAsociacionData {
    solicitud_id: string;
    nombre_usuario: string;
    email_usuario: string;
    telefono?: string;
    fecha_solicitud: string;
}

/**
 * Datos adicionales para notificación de solicitud de préstamo (admin recibe)
 */
export interface SolicitudPrestamoData {
    solicitud_id: string;
    socio_id: string;
    nombre_socio: string;
    n_socio: number;
    monto_solicitado: number;
    plazo_meses: number;
    score: number;
    nivel_riesgo: string;
    fecha_solicitud: string;
}

/**
 * Datos adicionales para notificación de solicitud de préstamo aprobada (socio recibe)
 */
export interface SolicitudPrestamoAprobadaData {
    solicitud_id: string;
    prestamo_id: string;
    monto_aprobado: number;
    plazo_meses: number;
    tasa_interes: number;
    monto_cuota: number;
}

/**
 * Datos adicionales para notificación de solicitud de préstamo rechazada (socio recibe)
 */
export interface SolicitudPrestamoRechazadaData {
    solicitud_id: string;
    monto_solicitado: number;
    motivo_rechazo: string;
}

/**
 * Datos adicionales para notificación de sistema (préstamo pagado)
 */
export interface SistemaPrestamoPagadoData {
    prestamo_id: string;
    monto_total: number;
}

/**
 * Datos adicionales para notificación de sistema (datos actualizados)
 */
export interface SistemaDatosActualizadosData {
    partner_id: string;
    cambios: Record<string, unknown>;
}

/**
 * Tipo unión de todos los datos posibles en datos_json
 */
export type NotificationData =
    | AbonoSemanalData
    | PrestamoAprobadoData
    | PrestamoCanceladoData
    | AbonoPrestamoData
    | RecordatorioPagoData
    | PrestamoVencidoData
    | SocioAprobadoData
    | SocioRechazadoData
    | SolicitudAsociacionData
    | SolicitudPrestamoData
    | SolicitudPrestamoAprobadaData
    | SolicitudPrestamoRechazadaData
    | SistemaPrestamoPagadoData
    | SistemaDatosActualizadosData
    | Record<string, unknown>;

/**
 * Estructura de una notificación
 */
export interface Notification {
    id: string;
    usuario_id: string;
    tipo: NotificationType;
    titulo: string;
    mensaje: string;
    datos_json?: NotificationData;
    leida: boolean;
    fecha_creacion: string;
    fecha_lectura: string | null;
    prioridad: NotificationPriority;
}

/**
 * Respuesta paginada de notificaciones
 */
export interface NotificationsResponse {
    success: boolean;
    data: Notification[];
    total: number;
    page: number;
    totalPages: number;
}

/**
 * Respuesta del contador de no leídas
 */
export interface UnreadCountResponse {
    success: boolean;
    data: {
        count: number;
    };
}

/**
 * Respuesta genérica del API
 */
export interface NotificationApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
}

/**
 * Parámetros de filtro para obtener notificaciones
 */
export interface NotificationFilters {
    page?: number;
    limit?: number;
    leida?: boolean;
    tipo?: NotificationType;
    prioridad?: NotificationPriority;
    desde?: string;
    hasta?: string;
}

/**
 * Evento de notificación recibido por WebSocket
 */
export interface NotificationSocketEvent {
    type: string;
    data: Notification;
    timestamp: string;
}

/**
 * Evento de conexión WebSocket
 */
export interface SocketConnectedEvent {
    message: string;
    socketId: string;
}

/**
 * Evento de autenticación WebSocket
 */
export interface SocketAuthenticatedEvent {
    success: boolean;
    userId: string;
    message: string;
}

/**
 * Evento de actualización de contador
 */
export interface UnreadCountUpdateEvent {
    type: string;
    timestamp: string;
}
