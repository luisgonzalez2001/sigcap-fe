// types/Scoring.ts - Tipos para el sistema de scoring crediticio ML

/**
 * Nivel de riesgo crediticio
 */
export type NivelRiesgo = "bajo" | "medio" | "alto";

/**
 * Estado de una solicitud de préstamo
 */
export type EstadoSolicitudPrestamo = "pendiente" | "aprobada" | "rechazada" | "cancelada";

/**
 * Resultado del scoring ML para un socio (respuesta del backend para detalle)
 */
export interface ScoringResult {
    score: number;
    riesgo: string;
    monto_maximo_recomendado: number;
    elegible: boolean;
    monto_optimo_sugerido: number;
    factores_principales: string[];
    fecha_calculo: string;
    fecha_expiracion: string;
}

/**
 * Factores que componen el score
 */
export interface ScoringFactores {
    historial_pagos: number; // 0-100
    antigüedad: number; // 0-100
    capacidad_ahorro: number; // 0-100
    deuda_ingreso: number; // 0-100
    comportamiento_mora: number; // 0-100
}

/**
 * Resumen de scoring para tabla admin (respuesta del backend)
 */
export interface ScoringSocioResumen {
    id_scoring: string;
    id_socio: string;
    n_socio: number;
    nombre_socio: string;
    score: number;
    riesgo: string; // "alto", "medio", "bajo", "muy_alto"
    probabilidad_impago: number;
    monto_maximo_recomendado: number;
    elegible: boolean;
    monto_optimo_sugerido: number;
    recomendacion_admin: string;
    factores_principales: string[];
    fecha_calculo: string;
    fecha_expiracion: string;
}

/**
 * Respuesta de la API de scoring para un socio (el backend devuelve directamente el scoring)
 */
export type ScoringResponse = ScoringResult;

/**
 * Respuesta de la API de scoring general (admin)
 */
export type ScoringListResponse = ScoringSocioResumen[];

// ===================== SOLICITUDES DE PRÉSTAMO =====================

/**
 * Usuario anidado en la solicitud de préstamo
 */
export interface SolicitudPrestamoUsuario {
    id: string;
    name: string;
    lastName: string;
    email: string;
    rol: string;
    phoneNumber: string;
    verified: boolean;
    active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Socio anidado en la solicitud de préstamo
 */
export interface SolicitudPrestamoSocio {
    id: string;
    id_usuario: SolicitudPrestamoUsuario;
    monto_semanal: number;
    n_socio: number;
    antiguedad: string;
    created_at: string;
    updated_at: string;
}

/**
 * Solicitud de préstamo creada por un socio (respuesta del backend)
 */
export interface SolicitudPrestamo {
    id: string;
    socio: SolicitudPrestamoSocio;
    usuario: SolicitudPrestamoUsuario;
    monto_solicitado: string | number;
    plazo_meses: number;
    mensaje_socio?: string | null;
    score_al_solicitar: string | number;
    riesgo_al_solicitar: string;
    monto_maximo_recomendado: string | number;
    monto_optimo_sugerido: string | number;
    decision_sugerida?: string | null;
    factores_principales: string[];
    scoring_id: string;
    estado: EstadoSolicitudPrestamo;
    motivo_rechazo?: string | null;
    admin_resolucion?: SolicitudPrestamoUsuario | null;
    fecha_resolucion?: string | null;
    prestamo?: unknown | null;
    created_at: string;
    updated_at: string;
}

/**
 * DTO para crear una solicitud de préstamo
 */
export interface CreateSolicitudPrestamoDto {
    monto_solicitado: number;
    plazo_meses: number;
    motivo?: string;
}

/**
 * DTO para aprobar una solicitud de préstamo
 */
export interface AprobarSolicitudPrestamoDto {
    solicitud_id: string;
    monto_aprobado?: number; // Si es diferente al solicitado
    plazo_meses?: number;
    tasa_interes?: number;
    notas?: string;
}

/**
 * DTO para rechazar una solicitud de préstamo
 */
export interface RechazarSolicitudPrestamoDto {
    solicitud_id: string;
    motivo_rechazo: string;
}

/**
 * Respuesta de elegibilidad del socio para solicitar préstamo
 */
export interface ElegibilidadPrestamoResponse {
    elegible: boolean;
    motivo_no_elegible?: string;
    scoring: ScoringResult | null;
    tiene_prestamo_activo: boolean;
    tiene_solicitud_pendiente: boolean;
}

/**
 * Filtros para solicitudes de préstamo (admin)
 */
export interface FiltrosSolicitudPrestamo {
    estado?: EstadoSolicitudPrestamo;
    socio_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
}
