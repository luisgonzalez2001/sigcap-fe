import type { Partner } from "./Partner";
import type { User } from "./UserDto";

// DTO para crear un abono semanal
export interface CreateCajaSemanalDto {
    id_socio: string; // UUID del partner
    id_admin: string; // UUID del usuario admin
    monto: number;
}

// DTO para actualizar un abono semanal
export interface UpdateCajaSemanalDto {
    id_socio?: string;
    id_admin?: string;
    monto?: number;
}

// Entidad completa de Caja Semanal (respuesta del GET)
export interface CajaSemanal {
    id: string;
    id_socio: Partner;
    id_admin: User;
    monto: number;
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
}

// Resumen de abonos por socio (respuesta de GET /caja-semanal/resumen/:nSocio)
export interface ResumenSocio {
    n_socio: number | null;
    nombre_socio: string;
    total_ahorrado: number;
    numero_abonos: number;
    promedio_abono: number;
}

// Resumen general (respuesta de GET /caja-semanal/resumen)
export interface ResumenGeneral {
    total_socios: number;
    total_ahorrado_general: number;
    total_abonos_general: number;
    promedio_general: number;
    detalle_por_socio: ResumenSocio[];
}

// Respuesta de eliminación
export interface DeleteResponse {
    deleted: boolean;
}
