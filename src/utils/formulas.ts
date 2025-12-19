import { Partner } from "@/types/Partner";

// Estadísticas rápidas
export const totalMontoSemanal = (socios: Partner[]) => {
    return socios.reduce(
        (sum, s) => sum + (s.monto_semanal || 0),
        0
    );
};
