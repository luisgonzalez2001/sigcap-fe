"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { rechazarSolicitudPrestamo } from "@/services/scoring-api";
import type { SolicitudPrestamo } from "@/types/Scoring";
import type { AxiosError } from "axios";

// ── helpers ──
const formatCurrency = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const toNum = (v: string | number | undefined | null): number =>
  typeof v === "string" ? parseFloat(v) || 0 : (v ?? 0);

const getSocioNombre = (s: SolicitudPrestamo): string => {
  const u = s.socio?.id_usuario;
  if (u) return `${u.name} ${u.lastName}`.trim();
  if (s.usuario) return `${s.usuario.name} ${s.usuario.lastName}`.trim();
  return "Desconocido";
};

const getSocioNSocio = (s: SolicitudPrestamo): number => s.socio?.n_socio ?? 0;

// ── props ──
interface Props {
  visible: boolean;
  solicitud: SolicitudPrestamo | null;
  onHide: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function RechazarPrestamoDialog({
  visible,
  solicitud,
  onHide,
  onSuccess,
  onError,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState("");

  if (!solicitud) return null;

  const handleRechazar = async () => {
    if (!motivo.trim()) return;
    setLoading(true);
    try {
      await rechazarSolicitudPrestamo({
        solicitud_id: solicitud.id,
        motivo_rechazo: motivo,
      });
      setMotivo("");
      onSuccess();
      onHide();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      onError(
        err.response?.data?.message || "No se pudo rechazar la solicitud",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMotivo("");
      onHide();
    }
  };

  return (
    <Dialog
      header="Rechazar Solicitud de Préstamo"
      visible={visible}
      style={{ width: "90vw", maxWidth: "500px" }}
      onHide={handleClose}
      draggable={false}
      resizable={false}
    >
      <div className="flex flex-column gap-3">
        <div className="surface-50 p-3 border-round">
          <p className="m-0 font-semibold text-900 mb-1">
            {getSocioNombre(solicitud)} (#{getSocioNSocio(solicitud)})
          </p>
          <p className="m-0 text-sm text-600">
            Monto: {formatCurrency(toNum(solicitud.monto_solicitado))} a{" "}
            {solicitud.plazo_meses} meses
          </p>
        </div>
        <div className="flex flex-column gap-2">
          <label className="font-semibold text-sm">
            Motivo del rechazo <span className="text-red-500">*</span>
          </label>
          <InputTextarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Describe el motivo del rechazo..."
            disabled={loading}
          />
          <small className="text-400">{motivo.length}/500</small>
        </div>
        <div className="flex gap-2 justify-content-end">
          <Button
            label="Cancelar"
            outlined
            onClick={handleClose}
            disabled={loading}
          />
          <Button
            label="Rechazar"
            severity="danger"
            onClick={handleRechazar}
            loading={loading}
            disabled={!motivo.trim()}
          />
        </div>
      </div>
    </Dialog>
  );
}
