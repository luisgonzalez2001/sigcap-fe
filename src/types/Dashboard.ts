// Enums
export enum TipoActividad {
    AHORRO = "ahorro",
    ABONO_PRESTAMO = "abono_prestamo",
    PRESTAMO_CREADO = "prestamo_creado",
    PRESTAMO_PAGADO = "prestamo_pagado",
    PRESTAMO_VENCIDO = "prestamo_vencido",
    PRESTAMO_CANCELADO = "prestamo_cancelado",
    MORA_APLICADA = "mora_aplicada",
}

// Interfaces base
export interface SocioInfo {
    id: string;
    nombre: string;
    n_socio: number;
}

// Detalles de abono en actividad
export interface DetallesAbono {
    prestamoId: string;
    aplicadoCapital: number;
    aplicadoInteres: number;
    aplicadoMora: number;
}

// Actividad reciente
export interface ActividadReciente {
    id: string;
    tipo: TipoActividad;
    descripcion: string;
    socio: SocioInfo;
    monto?: number;
    estado?: string;
    fecha: string;
    detalles?: DetallesAbono;
}

// Próximo pago
export interface ProximoPago {
    prestamoId: string;
    socio: SocioInfo;
    montoTotal: number;
    montoAbonado: number;
    montoPendiente: number;
    montoCuota: number;
    fechaProximoPago: string;
    diasRestantes: number;
    estatus: string;
}

// Resumen para Admin
export interface ResumenAdmin {
    totalSocios: number;
    totalPrestamosActivos: number;
    totalCapitalPrestado: number;
    totalCapitalRecuperado: number;
    totalAhorrosSemana: number;
    prestamosVencidos: number;
}

// Próximo pago simplificado para resumen socio
export interface ProximoPagoResumen {
    prestamoId: string;
    montoCuota: number;
    fechaProximoPago: string;
}

// Resumen para Socio
export interface ResumenSocioDashboard {
    totalAhorros: number;
    totalPrestamosActivos: number;
    totalDeudaActiva: number;
    proximoPago: ProximoPagoResumen | null;
}

// Dashboard completo Admin
export interface DashboardAdmin {
    resumen: ResumenAdmin;
    actividadReciente: ActividadReciente[];
    proximosPagos: ProximoPago[];
}

// Dashboard completo Socio
export interface DashboardSocio {
    resumen: ResumenSocioDashboard;
    actividadReciente: ActividadReciente[];
    proximosPagos: ProximoPago[];
}

// Query params para dashboard admin
export interface DashboardAdminParams {
    limiteActividad?: number;
    limiteProximosPagos?: number;
}

// Query params para actividad reciente admin
export interface ActividadRecienteParams {
    limite?: number;
    tipo?: TipoActividad;
    socioId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
}

// Query params para próximos pagos
export interface ProximosPagosParams {
    limite?: number;
    diasAnticipacion?: number;
    socioId?: string;
}

// Query params para dashboard socio
export interface DashboardSocioParams {
    limiteActividad?: number;
    limiteProximosPagos?: number;
}
