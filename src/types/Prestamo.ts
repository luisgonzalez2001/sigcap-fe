import type { Partner } from "./Partner";
import type { User } from "./UserDto";

// Enums
export enum EstatusPrestamo {
    ACTIVO = "activo",
    PAGADO = "pagado",
    VENCIDO = "vencido",
    CANCELADO = "cancelado",
}

export enum TipoInteres {
    SIMPLE = "simple",
    COMPUESTO = "compuesto",
}

// Préstamo
export interface Prestamo {
    id: string;
    id_admin: User;
    id_socio: Partner;
    monto_original: number;
    monto_total: number;
    monto_abonado: number;
    tasa_interes: number;
    tasa_mora: number;
    plazo_meses: number;
    monto_cuota: number;
    tipo_interes: TipoInteres;
    estatus: EstatusPrestamo;
    fecha_inicio: string;
    fecha_vencimiento: string;
    fecha_proximo_pago: string | null;
    dias_mora: number;
    intereses_mora: number;
    cuotas_pagadas: number;
    notas: string | null;
    abonos?: AbonoPrestamo[];
    created_at: string;
    updated_at: string;
}

// Abono de Préstamo
export interface AbonoPrestamo {
    id: string;
    prestamo?: { id: string };
    id_admin: User;
    id_socio: Partner;
    monto: number;
    aplicado_capital: number;
    aplicado_interes: number;
    aplicado_mora: number;
    notas: string | null;
    fecha_abono: string;
    created_at: string;
    updated_at: string;
}

// Historial
export interface HistorialPrestamo {
    id: string;
    accion: string;
    datos_anteriores: Record<string, unknown> | null;
    datos_nuevos: Record<string, unknown>;
    id_usuario: User;
    created_at: string;
}

// Resumen de préstamo individual
export interface ResumenPrestamo {
    monto_original: number;
    monto_total: number;
    monto_abonado: number;
    saldo_pendiente: number;
    intereses_mora: number;
    dias_mora: number;
    cuotas_pagadas: number;
    cuotas_pendientes: number;
    porcentaje_pagado: number;
    fecha_proximo_pago: string | null;
    estatus: EstatusPrestamo;
}

// Resumen general de préstamos
export interface ResumenGeneralPrestamos {
    total_prestamos: number;
    activos: number;
    vencidos: number;
    pagados: number;
    total_prestado: number;
    total_con_intereses: number;
    total_abonado: number;
    total_mora: number;
    total_pendiente: number;
}

// DTOs para crear/actualizar
export interface CreatePrestamoDto {
    id_socio: string;
    monto_original: number;
    tasa_interes?: number;
    tasa_mora?: number;
    plazo_meses: number;
    tipo_interes?: TipoInteres;
    notas?: string;
}

export interface UpdatePrestamoDto {
    notas?: string;
    estatus?: EstatusPrestamo;
}

export interface RegistrarAbonoPrestamoDto {
    monto: number;
    fecha_abono?: string;
    notas?: string;
}

export interface UpdateAbonoPrestamoDto {
    monto?: number;
    fecha_abono?: string;
    notas?: string;
}

export interface FiltrosPrestamoDto {
    id_socio?: string;
    estatus?: EstatusPrestamo;
    con_mora?: boolean;
}

// Respuestas de API
export interface PrestamoDetalleResponse {
    prestamo: Prestamo;
    resumen: ResumenPrestamo;
    abonos: AbonoPrestamo[];
}

export interface RegistrarAbonoPrestamoResponse {
    abono: AbonoPrestamo;
    prestamo: PrestamoDetalleResponse;
}

export interface UpdateAbonoPrestamoResponse {
    abono: AbonoPrestamo;
    prestamo: PrestamoDetalleResponse;
}

export interface EliminarAbonoPrestamoResponse {
    mensaje: string;
    prestamo: PrestamoDetalleResponse;
}
