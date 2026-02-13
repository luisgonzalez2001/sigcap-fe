"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Knob } from "primereact/knob";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { aprobarSolicitudPrestamo } from "@/services/scoring-api";
import type { SolicitudPrestamo, NivelRiesgo } from "@/types/Scoring";
import type { AxiosError } from "axios";

// ── helpers ──
const getRiesgoConfig = (nivel: NivelRiesgo) => {
  const config: Record<
    NivelRiesgo,
    { label: string; severity: "success" | "info" | "warning" | "danger" }
  > = {
    bajo: { label: "Bajo", severity: "success" },
    medio: { label: "Medio", severity: "info" },
    alto: { label: "Alto", severity: "warning" },
  };
  return config[nivel] || config.medio;
};

const getScoreColor = (score: number): string => {
  if (score >= 75) return "#059669";
  if (score >= 50) return "#2563EB";
  if (score >= 30) return "#D97706";
  return "#DC2626";
};

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

const getRiesgoAlSolicitar = (s: SolicitudPrestamo): NivelRiesgo => {
  const raw = s.riesgo_al_solicitar?.toLowerCase() ?? "medio";
  if (raw === "bajo" || raw === "medio" || raw === "alto") return raw;
  return "medio";
};

// ── constants ──
const DEFAULT_TASA_INTERES = 5;

// ── props ──
interface Props {
  visible: boolean;
  solicitud: SolicitudPrestamo | null;
  onHide: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function AprobarPrestamoDialog({
  visible,
  solicitud,
  onHide,
  onSuccess,
  onError,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [montoAprobado, setMontoAprobado] = useState<number | null>(null);
  const [tasaInteres, setTasaInteres] = useState<number>(DEFAULT_TASA_INTERES);

  // Reset form when solicitud changes
  useEffect(() => {
    if (solicitud) {
      setMontoAprobado(toNum(solicitud.monto_solicitado));
      setTasaInteres(DEFAULT_TASA_INTERES);
    }
  }, [solicitud]);

  if (!solicitud) return null;

  const monto = montoAprobado ?? toNum(solicitud.monto_solicitado);
  const plazo = solicitud.plazo_meses;
  const score = toNum(solicitud.score_al_solicitar);

  // Cálculo interés simple: total = monto + monto * (tasa/100) * plazo
  const montoTotal = monto + monto * (tasaInteres / 100) * plazo;
  const cuotaMensual = plazo > 0 ? montoTotal / plazo : 0;

  const handleAprobar = async () => {
    setLoading(true);
    try {
      await aprobarSolicitudPrestamo({
        solicitud_id: solicitud.id,
        monto_aprobado: montoAprobado ?? undefined,
        tasa_interes: tasaInteres,
      });
      onSuccess();
      onHide();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      onError(err.response?.data?.message || "No se pudo aprobar el préstamo");
    } finally {
      setLoading(false);
    }
  };

  const riesgoConfig = getRiesgoConfig(getRiesgoAlSolicitar(solicitud));

  return (
    <Dialog
      header="Aprobar Solicitud de Préstamo"
      visible={visible}
      style={{ width: "95vw", maxWidth: "550px" }}
      onHide={() => {
        if (!loading) onHide();
      }}
      draggable={false}
      resizable={false}
    >
      <div className="flex flex-column gap-4">
        {/* Info del socio */}
        <div className="surface-50 p-3 border-round">
          <div className="flex justify-content-between align-items-center mb-2">
            <p className="m-0 font-semibold text-900">
              {getSocioNombre(solicitud)} (#{getSocioNSocio(solicitud)})
            </p>
            <div className="flex align-items-center gap-2">
              <Knob
                value={score}
                max={100}
                readOnly
                size={35}
                valueColor={getScoreColor(score)}
                rangeColor="#E2E8F0"
                valueTemplate="{value}"
                textColor={getScoreColor(score)}
                strokeWidth={8}
              />
              <Tag
                value={riesgoConfig.label}
                severity={riesgoConfig.severity}
              />
            </div>
          </div>
          <div className="flex flex-column gap-1 text-sm text-600">
            <span>
              Solicitado:{" "}
              <strong>
                {formatCurrency(toNum(solicitud.monto_solicitado))}
              </strong>{" "}
              a <strong>{plazo} meses</strong>
            </span>
            <span>
              Máx. recomendado:{" "}
              <strong className="text-green-700">
                {formatCurrency(toNum(solicitud.monto_maximo_recomendado))}
              </strong>
            </span>
            <span>
              Óptimo sugerido:{" "}
              <strong>
                {formatCurrency(toNum(solicitud.monto_optimo_sugerido))}
              </strong>
            </span>
            {solicitud.mensaje_socio && (
              <span>Motivo: {solicitud.mensaje_socio}</span>
            )}
          </div>
        </div>

        {/* Configuración del préstamo */}
        <div className="flex flex-column gap-3">
          <div className="flex flex-column gap-2">
            <label className="font-semibold text-900 text-sm">
              Monto a aprobar
            </label>
            <InputNumber
              value={montoAprobado}
              onValueChange={(e) => setMontoAprobado(e.value ?? null)}
              mode="currency"
              currency="MXN"
              locale="es-MX"
              className="w-full"
              disabled={loading}
            />
          </div>
          <div className="flex flex-column gap-2">
            <label className="font-semibold text-900 text-sm">
              Tasa de interés (%)
            </label>
            <InputNumber
              value={tasaInteres}
              onValueChange={(e) =>
                setTasaInteres(e.value ?? DEFAULT_TASA_INTERES)
              }
              suffix="%"
              min={0}
              max={100}
              minFractionDigits={1}
              maxFractionDigits={2}
              className="w-full"
              disabled={loading}
            />
          </div>
        </div>

        {/* Resumen del cálculo */}
        {monto > 0 && plazo > 0 && (
          <>
            <Divider className="my-0" />
            <div
              className="p-3 border-round"
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
              }}
            >
              <h4
                className="m-0 mb-3"
                style={{ color: "#166534", fontWeight: "600" }}
              >
                <i className="pi pi-calculator mr-2" />
                Resumen del Préstamo
              </h4>
              <div className="flex flex-column gap-2">
                <div className="flex justify-content-between">
                  <span style={{ color: "#374151" }}>Monto Aprobado:</span>
                  <span style={{ fontWeight: "600" }}>
                    {formatCurrency(monto)}
                  </span>
                </div>
                <div className="flex justify-content-between">
                  <span style={{ color: "#374151" }}>
                    Interés Simple ({tasaInteres}% × {plazo} meses):
                  </span>
                  <span style={{ fontWeight: "600", color: "#9333ea" }}>
                    {formatCurrency(montoTotal - monto)}
                  </span>
                </div>
                <div className="flex justify-content-between">
                  <span style={{ color: "#374151" }}>Monto Total a Pagar:</span>
                  <span style={{ fontWeight: "600", color: "#dc2626" }}>
                    {formatCurrency(montoTotal)}
                  </span>
                </div>
                <div className="flex justify-content-between">
                  <span style={{ color: "#374151" }}>Cuota Mensual:</span>
                  <span style={{ fontWeight: "600", color: "#2563eb" }}>
                    {formatCurrency(cuotaMensual)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2 justify-content-end">
          <Button
            label="Cancelar"
            outlined
            onClick={onHide}
            disabled={loading}
          />
          <Button
            label="Aprobar Préstamo"
            icon="pi pi-check"
            severity="success"
            onClick={handleAprobar}
            loading={loading}
          />
        </div>
      </div>
    </Dialog>
  );
}
