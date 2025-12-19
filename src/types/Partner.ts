import type { User } from "./UserDto";

export interface CreatePartner {
    id: string;
    id_usuario: string;
    monto_semanal: number;
}

export interface Partner {
    id: string;
    id_usuario: User;
    monto_semanal: number;
}

