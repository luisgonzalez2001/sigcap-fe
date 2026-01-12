import type { User } from "./UserDto";

export interface CreatePartner {
    id: string;
    id_usuario: string;
    monto_semanal: number;
}

export interface Partner {
    id: string;
    n_socio: number;
    id_usuario: User;
    monto_semanal: number;
}

