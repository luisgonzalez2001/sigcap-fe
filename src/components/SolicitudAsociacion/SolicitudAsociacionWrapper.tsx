"use client";

import { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import api from "@/services/api";
import type { AxiosError } from "axios";

interface SolicitudAsociacionWrapperProps {
  mensaje?: string;
  mostrarFormulario?: boolean;
}

export function SolicitudAsociacionWrapper({
  mensaje = "Aún no tienes un socio asignado",
  mostrarFormulario = true,
}: SolicitudAsociacionWrapperProps) {
  const [mostrarFormularioSolicitud, setMostrarFormularioSolicitud] =
    useState(false);
  const [montoSemanal, setMontoSemanal] = useState<number | null>(100);
  const [mensajeUsuario, setMensajeUsuario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  const handleSolicitar = async () => {
    if (!montoSemanal || montoSemanal < 50) {
      setError("El monto semanal debe ser al menos $50");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/solicitudes-asociacion", {
        monto_semanal: montoSemanal,
        mensaje: mensajeUsuario || undefined,
      });

      setSuccess(
        "Solicitud enviada correctamente. Los administradores revisarán tu solicitud.",
      );
      setSolicitudEnviada(true);
      setMostrarFormularioSolicitud(false);
      setMontoSemanal(100);
      setMensajeUsuario("");
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      if (err.response?.status === 400) {
        setError("Ya eres socio de SIGCAP");
      } else if (err.response?.status === 429) {
        setError(
          err.response.data?.message ||
            "Ya tienes una solicitud reciente. Podrás solicitar nuevamente en unos días.",
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Error al enviar la solicitud. Intenta de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen p-4">
      <Card className="w-full max-w-30rem shadow-3">
        <div className="text-center mb-4">
          <i
            className="pi pi-user-plus text-6xl mb-3"
            style={{ color: "var(--primary-color)" }}
          ></i>
          <h2 className="text-2xl font-bold mb-2">{mensaje}</h2>
          <p className="text-gray-600 mb-4">
            Para acceder a los servicios de SIGCAP, necesitas que un
            administrador te asigne como socio.
          </p>
        </div>

        {success && (
          <Message
            severity="success"
            text={success}
            className="mb-3 w-full"
            style={{ cursor: "pointer" }}
            onClick={() => setSuccess("")}
          />
        )}

        {error && (
          <Message
            severity="error"
            text={error}
            className="mb-3 w-full"
            style={{ cursor: "pointer" }}
            onClick={() => setError("")}
          />
        )}

        {!solicitudEnviada && mostrarFormulario && (
          <div className="text-center">
            <p className="text-gray-700 mb-3">
              Puedes solicitar ser socio y un administrador revisará tu
              solicitud.
            </p>
            <Button
              label="Solicitar ser Socio"
              icon="pi pi-send"
              onClick={() => setMostrarFormularioSolicitud(true)}
              className="w-full"
            />
          </div>
        )}

        {solicitudEnviada && (
          <div className="text-center">
            <i className="pi pi-check-circle text-5xl text-green-500 mb-3"></i>
            <p className="text-lg font-semibold text-green-700">
              ¡Solicitud Enviada!
            </p>
            <p className="text-gray-600 mt-2">
              Los administradores han sido notificados y revisarán tu solicitud
              pronto.
            </p>
          </div>
        )}
      </Card>

      {/* Dialog para el formulario de solicitud */}
      <Dialog
        header="Solicitar ser Socio"
        visible={mostrarFormularioSolicitud}
        style={{ width: "90vw", maxWidth: "500px" }}
        onHide={() => {
          if (!loading) {
            setMostrarFormularioSolicitud(false);
            setError("");
          }
        }}
        draggable={false}
        resizable={false}
      >
        <div className="flex flex-column gap-4">
          <p className="text-gray-700">
            Indica el monto semanal que deseas aportar y opcionalmente un
            mensaje para los administradores.
          </p>

          {error && (
            <Message
              severity="error"
              text={error}
              className="w-full"
              style={{ cursor: "pointer" }}
              onClick={() => setError("")}
            />
          )}

          <div className="flex flex-column gap-2">
            <label htmlFor="monto" className="font-semibold">
              Monto Semanal <span className="text-red-500">*</span>
            </label>
            <InputNumber
              id="monto"
              value={montoSemanal}
              onValueChange={(e) => setMontoSemanal(e.value ?? null)}
              mode="currency"
              currency="USD"
              locale="en-US"
              minFractionDigits={2}
              min={50}
              max={10000}
              className="w-full"
              disabled={loading}
            />
            <small className="text-gray-600">Mínimo: $50.00</small>
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="mensaje" className="font-semibold">
              Mensaje (Opcional)
            </label>
            <InputTextarea
              id="mensaje"
              value={mensajeUsuario}
              onChange={(e) => setMensajeUsuario(e.target.value)}
              rows={4}
              placeholder="Escribe un mensaje para los administradores..."
              className="w-full"
              maxLength={500}
              disabled={loading}
            />
            <small className="text-gray-600">
              {mensajeUsuario.length}/500 caracteres
            </small>
          </div>

          <div className="flex gap-2 justify-content-end mt-3">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => {
                setMostrarFormularioSolicitud(false);
                setError("");
              }}
              className="p-button-text"
              disabled={loading}
            />
            <Button
              label="Enviar Solicitud"
              icon="pi pi-send"
              onClick={handleSolicitar}
              loading={loading}
              disabled={!montoSemanal || montoSemanal < 50}
            />
          </div>
        </div>

        {/* Loader overlay */}
        {loading && (
          <div className="flex justify-content-center align-items-center py-4">
            <ProgressSpinner />
          </div>
        )}
      </Dialog>
    </div>
  );
}
