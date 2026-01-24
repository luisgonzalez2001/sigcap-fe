"use client";

// Este archivo mantiene compatibilidad con componentes existentes
// Se recomienda migrar a useAuth de AuthContext

import { createContext } from "react";
import { useAuth, AuthProvider } from "./AuthContext";
import type { UserResponse } from "@/types/Auth";
import type { SocioExtra } from "@/utils/auth.utils";

// Interfaz de compatibilidad con el tipo anterior
interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  rol: "admin" | "socio";
  active?: boolean;
  verified?: boolean;
}

interface UserContextProps {
  user: User | null;
  socioExtra: SocioExtra | null;
  setUserUser: (user: User | null) => void;
  setSocioExtra: (extra: SocioExtra | null) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

/**
 * Provider de compatibilidad que usa AuthProvider internamente
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

/**
 * Hook de compatibilidad con el antiguo useUser
 * @deprecated Usar useAuth de AuthContext en su lugar
 */
export function useUser(): UserContextProps {
  const { user, socioExtra, setUser, setSocioExtra } = useAuth();

  return {
    user: user as User | null,
    socioExtra,
    setUserUser: (newUser) => setUser(newUser as UserResponse | null),
    setSocioExtra,
  };
}

export { UserContext };
export type { User, SocioExtra };
