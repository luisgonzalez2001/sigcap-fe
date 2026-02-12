"use client";

import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { Knob } from "primereact/knob";
import { Tag } from "primereact/tag";
import {
  verificarElegibilidad,
  crearSolicitudPrestamo,
} from "@/services/scoring-api";
import type {
  ElegibilidadPrestamoResponse,
  NivelRiesgo,
} from "@/types/Scoring";

interface SolicitudPrestamoDialogProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: () => void;
  socioId: string;
}

const plazoOptions = [
  { label: "3 meses", value: 3 },
  { label: "6 meses", value: 6 },
  { label: "9 meses", value: 9 },
  { label: "12 meses", value: 12 },
  { label: "18 meses", value: 18 },
  { label: "24 meses", value: 24 },
];

const getRiesgoConfig = (nivel: NivelRiesgo) => {
  const config: Record<
    NivelRiesgo,
    {
      label: string;
      severity: "success" | "info" | "warning" | "danger";
      color: string;
    }
  > = {
    bajo: { label: "Bajo", severity: "success", color: "#059669" },
    medio: { label: "Medio", severity: "info", color: "#2563EB" },
    alto: { label: "Alto", severity: "warning", color: "#D97706" },
  };
  return config[nivel] || config.medio;
};

const getScoreColor = (score: number): string => {
  if (score >= 750) return "#059669";
  if (score >= 500) return "#2563EB";
  if (score >= 300) return "#D97706";
  return "#DC2626";
};

export default function SolicitudPrestamoDialog({
  visible,
  onHide,
  onSuccess,
  socioId,
}: SolicitudPrestamoDialogProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [elegibilidad, setElegibilidad] =
    useState<ElegibilidadPrestamoResponse | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [montoSolicitado, setMontoSolicitado] = useState<number | null>(null);
  const [plazoMeses, setPlazoMeses] = useState<number>(6);
  const [motivo, setMotivo] = useState("");

  // Cargar elegibilidad cuando se abre el dialog
  useEffect(() => {
    if (visible && socioId) {
      loadElegibilidad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, socioId]);

  const loadElegibilidad = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await verificarElegibilidad(socioId);
      setElegibilidad(data);
      // Pre-fill with optimal amount
      if (data.scoring?.monto_optimo_sugerido) {
        setMontoSolicitado(data.scoring.monto_optimo_sugerido);
      } else if (data.scoring?.monto_maximo_recomendado) {
        setMontoSolicitado(data.scoring.monto_maximo_recomendado / 2);
      }
      // Default to 12 months
      setPlazoMeses(12);
    } catch (err) {
      console.error("Error al verificar elegibilidad:", err);
      setError("No se pudo verificar tu elegibilidad. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!montoSolicitado || montoSolicitado <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    if (
      elegibilidad?.scoring?.monto_maximo_recomendado &&
      montoSolicitado > elegibilidad.scoring.monto_maximo_recomendado
    ) {
      setError(
        `El monto máximo recomendado es ${formatCurrency(elegibilidad.scoring.monto_maximo_recomendado)}`,
      );
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await crearSolicitudPrestamo({
        monto_solicitado: montoSolicitado,
        plazo_meses: plazoMeses,
        motivo: motivo || undefined,
      });
      setSuccess(
        "¡Solicitud enviada! Los administradores revisarán tu solicitud.",
      );
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 2000);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      if (axiosErr.response?.status === 400) {
        setError(
          axiosErr.response.data?.message ||
            "No puedes solicitar un préstamo en este momento.",
        );
      } else if (axiosErr.response?.status === 429) {
        setError(
          "Ya tienes una solicitud pendiente. Espera a que sea resuelta.",
        );
      } else {
        setError("Error al enviar la solicitud. Intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setMontoSolicitado(null);
    setPlazoMeses(6);
    setMotivo("");
    setError("");
    setSuccess("");
    setElegibilidad(null);
    onHide();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  return (
    <Dialog
      header="Solicitar Préstamo"
      visible={visible}
      style={{ width: "95vw", maxWidth: "600px" }}
      onHide={handleClose}
      draggable={false}
      resizable={false}
      closable={!submitting}
    >
      {loading ? (
        <div className="flex flex-column align-items-center justify-content-center py-6">
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
          <p className="text-600 mt-3">Verificando elegibilidad...</p>
        </div>
      ) : success ? (
        <div className="text-center py-6">
          <i
            className="pi pi-check-circle text-green-500"
            style={{ fontSize: "4rem" }}
          />
          <p className="text-lg font-semibold mt-3 text-900">{success}</p>
        </div>
      ) : !elegibilidad?.elegible ? (
        <div className="flex flex-column align-items-center py-6 gap-3">
          <i
            className="pi pi-exclamation-triangle text-yellow-600"
            style={{ fontSize: "3rem" }}
          />
          <h3 className="text-900 font-bold m-0">No elegible para préstamo</h3>
          <p className="text-600 text-center m-0">
            {elegibilidad?.motivo_no_elegible ||
              "No cumples los requisitos para solicitar un préstamo en este momento."}
          </p>
          {elegibilidad?.tiene_prestamo_activo && (
            <Message
              severity="warn"
              text="Ya tienes un préstamo activo. Debes pagarlo antes de solicitar otro."
              className="w-full"
            />
          )}
          {elegibilidad?.tiene_solicitud_pendiente && (
            <Message
              severity="info"
              text="Ya tienes una solicitud de préstamo pendiente."
              className="w-full"
            />
          )}
          <Button
            label="Cerrar"
            outlined
            onClick={handleClose}
            className="mt-3"
          />
        </div>
      ) : (
        <div className="flex flex-column gap-4">
          {/* Scoring summary */}
          {elegibilidad.scoring && (
            <div
              className="flex flex-column md:flex-row align-items-center gap-4 p-4 border-round"
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              <div className="flex flex-column align-items-center">
                <Knob
                  value={elegibilidad.scoring.score}
                  max={1000}
                  readOnly
                  size={100}
                  valueColor={getScoreColor(elegibilidad.scoring.score)}
                  rangeColor="#E2E8F0"
                  valueTemplate="{value}"
                  textColor={getScoreColor(elegibilidad.scoring.score)}
                />
                <span className="text-sm text-600 mt-1">Tu Score</span>
              </div>
              <div className="flex-1">
                <div className="flex align-items-center gap-2 mb-2">
                  <span className="font-semibold text-900">
                    Nivel de Riesgo:
                  </span>
                  <Tag
                    value={
                      getRiesgoConfig(
                        elegibilidad.scoring.riesgo as NivelRiesgo,
                      ).label
                    }
                    severity={
                      getRiesgoConfig(
                        elegibilidad.scoring.riesgo as NivelRiesgo,
                      ).severity
                    }
                  />
                </div>
                <div className="flex flex-column gap-1">
                  <span className="text-sm text-600">
                    <i className="pi pi-money-bill mr-2 text-green-600" />
                    Monto máximo recomendado:{" "}
                    <strong>
                      {formatCurrency(
                        elegibilidad.scoring.monto_maximo_recomendado,
                      )}
                    </strong>
                  </span>
                  {elegibilidad.scoring.monto_optimo_sugerido && (
                    <span className="text-sm text-600">
                      <i className="pi pi-star mr-2 text-yellow-600" />
                      Monto óptimo sugerido:{" "}
                      <strong>
                        {formatCurrency(
                          elegibilidad.scoring.monto_optimo_sugerido,
                        )}
                      </strong>
                    </span>
                  )}
                  <span className="text-sm text-600">
                    <i className="pi pi-info-circle mr-2 text-blue-600" />
                    Elegible para préstamo:{" "}
                    <strong
                      className={
                        elegibilidad.scoring.elegible
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {elegibilidad.scoring.elegible ? "Sí" : "No"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Message severity="error" text={error} className="w-full" />
          )}

          {/* Form */}
          <div className="flex flex-column gap-3">
            <div className="flex flex-column gap-2">
              <label htmlFor="monto" className="font-semibold text-900">
                Monto a solicitar
              </label>
              <InputNumber
                id="monto"
                value={montoSolicitado}
                onValueChange={(e) => setMontoSolicitado(e.value ?? null)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                min={100}
                max={elegibilidad.scoring?.monto_maximo_recomendado || 100000}
                placeholder="Ingresa el monto"
                className="w-full"
                disabled={submitting}
              />
              {elegibilidad.scoring && (
                <small className="text-500">
                  Máximo:{" "}
                  {formatCurrency(
                    elegibilidad.scoring.monto_maximo_recomendado,
                  )}
                </small>
              )}
            </div>

            <div className="flex flex-column gap-2">
              <label htmlFor="plazo" className="font-semibold text-900">
                Plazo
              </label>
              <Dropdown
                id="plazo"
                value={plazoMeses}
                options={plazoOptions}
                onChange={(e) => setPlazoMeses(e.value)}
                placeholder="Selecciona el plazo"
                className="w-full"
                disabled={submitting}
              />
            </div>

            <div className="flex flex-column gap-2">
              <label htmlFor="motivo" className="font-semibold text-900">
                Motivo <span className="text-400 font-normal">(Opcional)</span>
              </label>
              <InputTextarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Describe brevemente para qué necesitas el préstamo..."
                maxLength={500}
                disabled={submitting}
                className="w-full"
              />
              <small className="text-400">{motivo.length}/500 caracteres</small>
            </div>
          </div>

          {/* Resumen */}
          {montoSolicitado && montoSolicitado > 0 && elegibilidad.scoring && (
            <div
              className="p-3 border-round"
              style={{
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
              }}
            >
              <h4 className="m-0 mb-2 text-green-800">
                <i className="pi pi-info-circle mr-2" />
                Resumen de solicitud
              </h4>
              <div className="flex flex-column gap-1 text-sm">
                <span className="text-green-700">
                  Monto: <strong>{formatCurrency(montoSolicitado)}</strong>
                </span>
                <span className="text-green-700">
                  Plazo: <strong>{plazoMeses} meses</strong>
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-content-end">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              outlined
              onClick={handleClose}
              disabled={submitting}
            />
            <Button
              label="Enviar Solicitud"
              icon="pi pi-send"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!montoSolicitado || montoSolicitado <= 0}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
