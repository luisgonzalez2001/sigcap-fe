"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

interface InactivityWarningDialogProps {
  visible: boolean;
}

/**
 * Diálogo que aparece cuando el usuario está a punto de ser desconectado por inactividad
 */
export function InactivityWarningDialog({
  visible,
}: InactivityWarningDialogProps) {
  const { extendSession, logout } = useAuth();
  const [countdown, setCountdown] = useState(300); // 5 minutos en segundos

  // Reset countdown cuando se muestra el dialog
  useEffect(() => {
    if (visible) {
      setCountdown(300);
    }
  }, [visible]);

  // Countdown timer
  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, logout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExtendSession = async () => {
    await extendSession();
  };

  const footer = (
    <div className="flex justify-content-between gap-2">
      <Button
        label="Cerrar sesión"
        icon="pi pi-sign-out"
        severity="secondary"
        outlined
        onClick={logout}
      />
      <Button
        label="Continuar sesión"
        icon="pi pi-refresh"
        onClick={handleExtendSession}
        autoFocus
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={() => {}} // No permitir cerrar sin acción
      header="⚠️ Sesión por expirar"
      footer={footer}
      closable={false}
      draggable={false}
      resizable={false}
      modal
      style={{ width: "400px" }}
      className="inactivity-warning-dialog"
    >
      <div className="text-center">
        <i
          className="pi pi-clock text-6xl text-orange-500 mb-3"
          style={{ display: "block" }}
        />
        <p className="text-lg mb-2">
          Tu sesión está a punto de expirar por inactividad.
        </p>
        <p className="text-3xl font-bold text-orange-600 my-3">
          {formatTime(countdown)}
        </p>
        <p className="text-sm text-gray-600">
          Haz clic en &quot;Continuar sesión&quot; para seguir trabajando.
        </p>
      </div>
    </Dialog>
  );
}

export default InactivityWarningDialog;
