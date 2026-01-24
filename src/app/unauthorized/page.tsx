"use client";

import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Página mostrada cuando el usuario intenta acceder a una ruta sin permisos
 */
export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    if (user?.rol === "admin") {
      router.push("/dashboard");
    } else if (user?.rol === "socio") {
      router.push("/prestamos");
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen bg-gray-100">
      <Card className="w-30rem shadow-3 text-center">
        <div className="mb-4">
          <i
            className="pi pi-lock text-8xl text-red-500"
            style={{ display: "block" }}
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Acceso No Autorizado
        </h1>

        <p className="text-gray-600 mb-4">
          No tienes permisos para acceder a esta página.
        </p>

        {user && (
          <p className="text-sm text-gray-500 mb-4">
            Estás conectado como{" "}
            <strong>
              {user.name} {user.lastName}
            </strong>{" "}
            con rol <strong className="text-primary">{user.rol}</strong>.
          </p>
        )}

        <div className="flex flex-column gap-2 mt-4">
          <Button
            label="Volver"
            icon="pi pi-arrow-left"
            onClick={handleGoBack}
            className="w-full"
          />
          <Button
            label="Ir al inicio"
            icon="pi pi-home"
            onClick={handleGoHome}
            severity="secondary"
            outlined
            className="w-full"
          />
          {user && (
            <Button
              label="Cerrar sesión"
              icon="pi pi-sign-out"
              onClick={logout}
              severity="danger"
              text
              className="w-full mt-2"
            />
          )}
        </div>

        <div className="mt-4 pt-4 border-top-1 border-gray-200">
          <p className="text-xs text-gray-400">
            Si crees que deberías tener acceso, contacta al administrador del
            sistema.
          </p>
        </div>
      </Card>
    </div>
  );
}
