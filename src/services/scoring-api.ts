// services/scoring-api.ts - Cliente HTTP para endpoints de scoring y solicitudes de préstamo

import api from "./api";
import type {
    ScoringResponse,
    ScoringListResponse,
    SolicitudPrestamo,
    CreateSolicitudPrestamoDto,
    AprobarSolicitudPrestamoDto,
    RechazarSolicitudPrestamoDto,
    ElegibilidadPrestamoResponse,
    FiltrosSolicitudPrestamo,
} from "@/types/Scoring";

// ===================== SCORING =====================

/**
 * Obtener scoring de un socio específico
 */
export async function getScoringBySocio(socioId: string): Promise<ScoringResponse> {
    const { data } = await api.get<ScoringResponse>(`/scoring/socio/${socioId}`);
    return data;
}

/**
 * Obtener listado de scoring de todos los socios (admin)
 */
export async function getScoringList(): Promise<ScoringListResponse> {
    const { data } = await api.get<ScoringListResponse>("/scoring/admin/resumen");
    return data;
}

/**
 * Recalcular scoring de un socio (admin)
 */
export async function recalcularScoring(socioId: string): Promise<ScoringResponse> {
    const { data } = await api.post<ScoringResponse>(`/scoring/recalcular/${socioId}`);
    return data;
}

// ===================== ELEGIBILIDAD =====================

/**
 * Verificar elegibilidad para solicitar préstamo (socio).
 * Construye la respuesta a partir del scoring vigente del socio
 * y sus préstamos activos, ya que no existe un endpoint dedicado de elegibilidad.
 */
export async function verificarElegibilidad(
    socioId: string,
    tienePrestamosActivos: boolean = false,
    tieneSolicitudPendiente: boolean = false,
): Promise<ElegibilidadPrestamoResponse> {
    try {
        const scoring = await getScoringBySocio(socioId);

        // Si el backend devuelve { message, data: null } cuando no hay scoring
        if (!scoring || (scoring as unknown as { data: null }).data === null) {
            return {
                elegible: false,
                motivo_no_elegible: "No hay scoring calculado aún",
                scoring: null,
                tiene_prestamo_activo: tienePrestamosActivos,
                tiene_solicitud_pendiente: tieneSolicitudPendiente,
            };
        }

        // Determinar elegibilidad basada en el scoring y estado de préstamos
        let elegible = scoring.elegible;
        let motivo_no_elegible: string | undefined;

        if (tienePrestamosActivos) {
            elegible = false;
            motivo_no_elegible = "Ya tienes un préstamo activo";
        } else if (tieneSolicitudPendiente) {
            elegible = false;
            motivo_no_elegible = "Ya tienes una solicitud pendiente";
        } else if (!scoring.elegible) {
            motivo_no_elegible = "Tu scoring crediticio no cumple los requisitos mínimos";
        }

        return {
            elegible,
            motivo_no_elegible,
            scoring,
            tiene_prestamo_activo: tienePrestamosActivos,
            tiene_solicitud_pendiente: tieneSolicitudPendiente,
        };
    } catch {
        return {
            elegible: false,
            motivo_no_elegible: "No se pudo obtener el scoring",
            scoring: null,
            tiene_prestamo_activo: tienePrestamosActivos,
            tiene_solicitud_pendiente: tieneSolicitudPendiente,
        };
    }
}

// ===================== SOLICITUDES DE PRÉSTAMO =====================

/**
 * Crear solicitud de préstamo (socio)
 */
export async function crearSolicitudPrestamo(
    dto: CreateSolicitudPrestamoDto
): Promise<SolicitudPrestamo> {
    const { data } = await api.post<SolicitudPrestamo>("/solicitudes-prestamo", dto);
    return data;
}

/**
 * Obtener solicitudes de préstamo del socio actual
 */
export async function getMisSolicitudesPrestamo(socioId: string): Promise<SolicitudPrestamo[]> {
    const { data } = await api.get<SolicitudPrestamo[]>(`/solicitudes-prestamo/socio/${socioId}`);
    return data;
}

/**
 * Obtener todas las solicitudes de préstamo (admin)
 */
export async function getSolicitudesPrestamo(
    filtros?: FiltrosSolicitudPrestamo
): Promise<SolicitudPrestamo[]> {
    const { data } = await api.get<SolicitudPrestamo[]>("/solicitudes-prestamo", {
        params: filtros,
    });
    return data;
}

/**
 * Obtener una solicitud de préstamo por ID
 */
export async function getSolicitudPrestamoById(id: string): Promise<SolicitudPrestamo> {
    const { data } = await api.get<SolicitudPrestamo>(`/solicitudes-prestamo/${id}`);
    return data;
}

/**
 * Aprobar solicitud de préstamo (admin)
 */
export async function aprobarSolicitudPrestamo(
    dto: AprobarSolicitudPrestamoDto
): Promise<SolicitudPrestamo> {
    const { data } = await api.post<SolicitudPrestamo>(
        "/solicitudes-prestamo/aprobar",
        dto
    );
    return data;
}

/**
 * Rechazar solicitud de préstamo (admin)
 */
export async function rechazarSolicitudPrestamo(
    dto: RechazarSolicitudPrestamoDto
): Promise<SolicitudPrestamo> {
    const { data } = await api.post<SolicitudPrestamo>(
        "/solicitudes-prestamo/rechazar",
        dto
    );
    return data;
}
