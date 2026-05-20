"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import api from "@/services/api";

type ServiceStatus = "checking" | "online" | "inactive" | "error";

const STATUS_CONFIG: Record<
  ServiceStatus,
  { color: string; label: string; description: string }
> = {
  checking: {
    color: "#9ca3af",
    label: "Verificando...",
    description: "Comprobando estado del servicio ML",
  },
  online: {
    color: "#16a34a",
    label: "En línea",
    description: "Servicio ML activo y respondiendo",
  },
  inactive: {
    color: "#9ca3af",
    label: "Inactivo",
    description: "Servicio ML apagado (puede tardar ~1 min en activarse)",
  },
  error: {
    color: "#dc2626",
    label: "Error",
    description: "No se pudo conectar con el servicio ML",
  },
};

// Intervalo de polling (60 segundos)
const POLL_INTERVAL_MS = 60_000;
// Timeout para considerar inactivo (10 segundos)
const HEALTH_TIMEOUT_MS = 10_000;

const MlServiceStatus = () => {
  const [status, setStatus] = useState<ServiceStatus>("checking");
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [waking, setWaking] = useState(false);
  const tooltipId = "ml-status-tooltip";
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkHealth = useCallback(async () => {
    setStatus("checking");
    try {
      await api.get("/scoring/admin/health", {
        timeout: HEALTH_TIMEOUT_MS,
      });
      setStatus("online");
    } catch (err: unknown) {
      // Si el servidor respondió pero con error HTTP (ej. 503), está "inactivo"
      // Si no respondió (timeout / network error), es "error"
      const isNetworkError =
        !err ||
        (typeof err === "object" &&
          "code" in err &&
          (err as { code?: string }).code === "ECONNABORTED");
      setStatus(isNetworkError ? "inactive" : "error");
    } finally {
      setLastCheck(new Date());
    }
  }, []);

  // Polling cada 60 s
  useEffect(() => {
    checkHealth();
    intervalRef.current = setInterval(checkHealth, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkHealth]);

  // "Despertar" el servicio: lanza el health check y recalcula
  const handleWake = async () => {
    setWaking(true);
    setStatus("checking");
    try {
      await api.get("/scoring/admin/health", { timeout: 65_000 });
      setStatus("online");
    } catch {
      setStatus("inactive");
    } finally {
      setLastCheck(new Date());
      setWaking(false);
    }
  };

  const cfg = STATUS_CONFIG[status];

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="flex align-items-center gap-2 px-3 py-2 border-round"
      style={{
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        fontSize: "0.8rem",
      }}
    >
      {/* Dot indicador */}
      <Tooltip
        target={`#${tooltipId}`}
        content={cfg.description}
        position="bottom"
      />
      <span
        id={tooltipId}
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: cfg.color,
          display: "inline-block",
          flexShrink: 0,
          boxShadow: status === "online" ? `0 0 0 3px ${cfg.color}33` : "none",
          transition: "background-color 0.4s ease",
          cursor: "help",
        }}
      />

      {/* Texto */}
      <div className="flex flex-column" style={{ lineHeight: 1.3 }}>
        <span style={{ fontWeight: 600, color: "#374151" }}>
          Servicio ML — {cfg.label}
        </span>
        {lastCheck && (
          <span style={{ color: "#9ca3af", fontSize: "0.7rem" }}>
            Última verificación: {formatTime(lastCheck)}
          </span>
        )}
      </div>

      <div style={{ marginLeft: "auto" }}>
        {/* Botón de despertar (solo si no está online) */}
        {status !== "online" && status !== "checking" && (
          <Button
            icon={waking ? "pi pi-spin pi-spinner" : "pi pi-power-off"}
            size="small"
            text
            severity="help"
            tooltip="Activar servicio ML"
            tooltipOptions={{ position: "bottom" }}
            disabled={waking}
            onClick={handleWake}
            style={{ padding: "0.25rem", marginLeft: "auto" }}
          />
        )}

        {/* Botón de refrescar (solo si está online o error) */}
        {(status === "online" || status === "error") && (
          <Button
            icon="pi pi-refresh"
            size="small"
            text
            severity="secondary"
            tooltip="Verificar ahora"
            tooltipOptions={{ position: "bottom" }}
            onClick={checkHealth}
            style={{ padding: "0.25rem", marginLeft: "auto" }}
          />
        )}
      </div>
    </div>
  );
};

export default MlServiceStatus;
