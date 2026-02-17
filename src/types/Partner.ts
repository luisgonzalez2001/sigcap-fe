import type { User } from "./UserDto";

export interface CreatePartner {
    id: string;
    id_usuario: string;
    monto_semanal: number;
    antiguedad?: string; // formato YYYY-MM-DD
}

export interface Partner {
    id: string;
    n_socio: number;
    id_usuario: User;
    monto_semanal: number;
    antiguedad?: string; // fecha real de antigüedad del socio
}

