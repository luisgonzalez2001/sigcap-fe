import type { TipoActividad } from "@/types/Dashboard";

// Formatear moneda
export const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
    }).format(value);

// Formatear fecha corta garantizada en español (dd de mmm de aaaa)
export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const meses = [
        "ene", "feb", "mar", "abr", "may", "jun",
        "jul", "ago", "sep", "oct", "nov", "dic",
    ];
    const day = date.getDate().toString().padStart(2, "0");
    const month = meses[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
};

// Formatear fecha y hora (dd/mm/aaaa hh:mm)
export const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Mapear descripciones cortas del backend a texto legible
export const mapDescripcion = (descripcion: string): string => {
    const map: Record<string, string> = {
        Creado: "Préstamo creado",
        Actualizado: "Préstamo actualizado",
        Cancelado: "Préstamo cancelado",
    };
    return map[descripcion] ?? descripcion;
};

// Config de ícono/color por tipo de actividad
export const getActividadConfig = (tipo: TipoActividad) => {
    const config: Record<
        TipoActividad,
        { icon: string; color: string; bgColor: string }
    > = {
        ahorro: { icon: "pi-wallet", color: "#059669", bgColor: "#D1FAE5" },
        abono_prestamo: { icon: "pi-money-bill", color: "#2563EB", bgColor: "#DBEAFE" },
        prestamo_creado: { icon: "pi-plus-circle", color: "#9333EA", bgColor: "#F3E8FF" },
        prestamo_pagado: { icon: "pi-check-circle", color: "#059669", bgColor: "#D1FAE5" },
        prestamo_vencido: { icon: "pi-exclamation-triangle", color: "#DC2626", bgColor: "#FEE2E2" },
        prestamo_cancelado: { icon: "pi-times-circle", color: "#6B7280", bgColor: "#F3F4F6" },
        mora_aplicada: { icon: "pi-exclamation-circle", color: "#D97706", bgColor: "#FEF3C7" },
    };
    return config[tipo] ?? { icon: "pi-circle", color: "#6B7280", bgColor: "#F3F4F6" };
};
