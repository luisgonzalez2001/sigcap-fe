"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProgressSpinner } from "primereact/progressspinner";

type Role = "admin" | "socio";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/signup",
  "/auth/verify",
  "/auth/recover-account",
  "/auth/reset-password",
  "/home",
  "/",
  "/unauthorized",
];

// Mapeo de rutas por rol
const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  "/usuarios": ["admin"],
  "/socios": ["admin"],
  "/ahorros": ["admin"],
  "/prestamos": ["admin", "socio"],
  "/dashboard": ["admin", "socio"],
  "/profile": ["admin", "socio"],
};

/**
 * Verifica si una ruta está permitida para un rol específico
 */
function isRouteAllowedForRole(pathname: string, role: Role | null): boolean {
  if (!role) return false;

  // Buscar coincidencia exacta o por prefijo
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return allowedRoles.includes(role);
    }
  }

  // Si no hay configuración específica, permitir para cualquier usuario autenticado
  return true;
}

/**
 * Componente que protege rutas según autenticación y roles
 */
export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Si aún está cargando, esperar
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/"),
    );

    // Si es ruta pública, permitir acceso
    if (isPublicRoute) {
      setIsChecking(false);
      setShouldRender(true);
      return;
    }

    // Si no está autenticado y no es ruta pública, redirigir a login
    if (!isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Verificar permisos por rol
    if (user) {
      // Verificar allowedRoles específicos del componente
      if (allowedRoles && !allowedRoles.includes(user.rol)) {
        router.replace("/unauthorized");
        return;
      }

      // Verificar permisos de la ruta según configuración
      if (!isRouteAllowedForRole(pathname, user.rol)) {
        router.replace("/unauthorized");
        return;
      }
    }

    setIsChecking(false);
    setShouldRender(true);
  }, [isLoading, isAuthenticated, user, pathname, router, allowedRoles]);

  // Mostrar loading mientras verifica
  if (isLoading || isChecking) {
    // No mostrar spinner en rutas públicas
    const isPublicRoute = PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/"),
    );

    if (isPublicRoute) {
      return <>{children}</>;
    }

    return (
      <div className="flex justify-content-center align-items-center min-h-screen">
        <div className="text-center">
          <ProgressSpinner
            style={{ width: "50px", height: "50px" }}
            strokeWidth="4"
          />
          <p className="mt-3 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}

/**
 * HOC para rutas que requieren rol de admin
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>;
}

/**
 * HOC para rutas que pueden acceder admin y socio
 */
export function AuthenticatedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["admin", "socio"]}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * HOC para rutas de socio (también permite admin)
 */
export function SocioRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin", "socio"]}>
      {children}
    </ProtectedRoute>
  );
}

export default ProtectedRoute;
