// types/Auth.ts - Tipos para el sistema de autenticación

// Request DTOs
export interface LoginDto {
    email?: string;
    phoneNumber?: string;
    password: string;
}

export interface SignupDto {
    name: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
}

export interface RefreshTokenDto {
    refreshToken: string;
}

// Response Types
export interface UserResponse {
    id: string;
    name: string;
    lastName: string;
    email: string;
    rol: "admin" | "socio";
    phoneNumber: string;
    verified: boolean;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoginResponse {
    user: UserResponse;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

export interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

export interface ValidateResponse {
    valid: boolean;
    userId?: string;
    role?: "admin" | "socio";
    expiresAt?: string;
    message?: string;
}

// Error Response
export interface ApiError {
    statusCode: number;
    message: string;
    error?: string;
}

// Auth error codes
export const AUTH_ERRORS = {
    // Login
    USER_NOT_FOUND: {
        message: "No encontramos una cuenta con esos datos",
        action: "show-error" as const,
    },
    INVALID_PASSWORD: {
        message: "Contraseña incorrecta",
        action: "show-error" as const,
    },
    EMAIL_NOT_VERIFIED: {
        message: "Tu email no ha sido verificado. Revisa tu bandeja de entrada para verificar tu cuenta.",
        action: "show-error" as const,
    },
    USER_INACTIVE: {
        message: "Tu cuenta ha sido desactivada. Contacta al administrador.",
        action: "show-error" as const,
    },
    USER_ALREADY_EXISTS: {
        message: "Ya existe una cuenta con ese email",
        action: "show-error" as const,
    },

    // Tokens
    "Token inválido o expirado": {
        message: "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
        action: "redirect-login" as const,
    },
    "Usuario inactivo": {
        message: "Tu cuenta ha sido desactivada.",
        action: "redirect-login" as const,
    },

    // Usuarios
    EMAIL_ALREADY_IN_USE: {
        message: "Este email ya está registrado con otra cuenta",
        action: "show-error" as const,
    },
    PHONE_ALREADY_IN_USE: {
        message: "Este número de teléfono ya está registrado con otra cuenta",
        action: "show-error" as const,
    },
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

export function getErrorMessage(errorCode: string): string {
    const error = AUTH_ERRORS[errorCode as AuthErrorCode];
    return error?.message ?? "Ocurrió un error. Intenta de nuevo.";
}

export function getErrorAction(
    errorCode: string
): "show-error" | "redirect-login" | "redirect-verify" {
    const error = AUTH_ERRORS[errorCode as AuthErrorCode];
    return error?.action ?? "show-error";
}
