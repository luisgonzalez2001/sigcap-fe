"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import api from "@/services/api";
import type { AxiosError } from "axios";
import type { CajaSemanal } from "@/types/CajaSemanal";

interface AbonoSemanalUpdateFormProps {
  visible: boolean;
  onHide: () => void;
  onSuccess?: () => void;
  abono: CajaSemanal | null;
}

const AbonoSemanalUpdateForm = ({
  visible,
  onHide,
  onSuccess,
  abono,
}: AbonoSemanalUpdateFormProps) => {
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(false);
  const [monto, setMonto] = useState<number | null>(null);

  // Inicializar el monto cuando se abre el diálogo
  useEffect(() => {
    if (visible && abono) {
      setMonto(abono.monto);
    }
  }, [visible, abono]);

  // Resetear formulario al cerrar
  const resetForm = () => {
    setMonto(null);
  };

  const handleHide = () => {
    resetForm();
    onHide();
  };

  // Confirmar eliminación
  const handleDelete = () => {
    confirmDialog({
      message: "¿Estás seguro de que deseas eliminar este abono?",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      accept: async () => {
        if (!abono) return;

        setLoading(true);
        try {
          await api.delete(`/caja-semanal/${abono.id}`);

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Abono eliminado correctamente",
            life: 3000,
          });

          resetForm();
          onSuccess?.();
          onHide();
        } catch (error) {
          const err = error as AxiosError<{ message?: string }>;
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err.response?.data?.message || "Error al eliminar el abono",
            life: 4000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Validar y enviar el formulario
  const handleSubmit = async () => {
    if (!abono) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se encontró el abono a actualizar",
        life: 3000,
      });
      return;
    }

    if (!monto || monto < 1) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "El monto debe ser mayor a 0",
        life: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      await api.patch(`/caja-semanal/${abono.id}`, {
        monto: monto,
      });

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Abono actualizado correctamente",
        life: 3000,
      });

      resetForm();
      onSuccess?.();
      onHide();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "Error al actualizar el abono",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Footer del diálogo
  const dialogFooter = (
    <div className="flex justify-content-between">
      <Button
        label="Eliminar"
        icon="pi pi-trash"
        onClick={handleDelete}
        className="p-button-danger p-button-outlined"
        disabled={loading}
      />
      <div className="flex gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          onClick={handleHide}
          className="p-button-text"
          disabled={loading}
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          onClick={handleSubmit}
          loading={loading}
          style={{
            backgroundColor: "#2563EB",
            border: "none",
          }}
        />
      </div>
    </div>
  );

  if (!abono) return null;

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i
              className="pi pi-pencil"
              style={{ fontSize: "1.25rem", color: "#2563EB" }}
            ></i>
            <span>Editar Abono Semanal</span>
          </div>
        }
        visible={visible}
        onHide={handleHide}
        footer={dialogFooter}
        style={{ width: "90vw", maxWidth: "500px" }}
        modal
        draggable={false}
        resizable={false}
        closable={!loading}
      >
        <div className="flex flex-column gap-4 pt-3">
          {/* Información del socio */}
          <div
            className="p-3 border-round"
            style={{
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
            }}
          >
            <div className="flex align-items-center gap-3">
              <div
                className="flex align-items-center justify-content-center"
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                {abono.id_socio?.id_usuario?.name?.charAt(0).toUpperCase()}
                {abono.id_socio?.id_usuario?.lastName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p
                  className="m-0"
                  style={{ fontWeight: "600", color: "#1e40af" }}
                >
                  {abono.id_socio?.id_usuario?.name}{" "}
                  {abono.id_socio?.id_usuario?.lastName}
                </p>
                <p
                  className="m-0 mt-1"
                  style={{ fontSize: "0.875rem", color: "#3b82f6" }}
                >
                  Socio #{abono.id_socio?.n_socio}
                </p>
              </div>
            </div>

            {/* Info adicional */}
            <div
              className="flex gap-3 mt-3 pt-3"
              style={{ borderTop: "1px solid #BFDBFE" }}
            >
              <div className="flex-1">
                <p
                  className="m-0"
                  style={{ fontSize: "0.75rem", color: "#64748b" }}
                >
                  Monto semanal acordado
                </p>
                <p
                  className="m-0 mt-1"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#1e40af",
                  }}
                >
                  {abono.id_socio?.monto_semanal?.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </p>
              </div>
              <div className="flex-1">
                <p
                  className="m-0"
                  style={{ fontSize: "0.75rem", color: "#64748b" }}
                >
                  Fecha de registro
                </p>
                <p
                  className="m-0 mt-1"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#1e40af",
                  }}
                >
                  {formatDate(abono.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Input de Monto */}
          <div className="flex flex-column gap-2">
            <label
              htmlFor="monto"
              style={{ fontWeight: "600", color: "#374151" }}
            >
              Monto del Abono <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <InputNumber
              id="monto"
              value={monto}
              onValueChange={(e) => setMonto(e.value ?? null)}
              mode="currency"
              currency="MXN"
              locale="es-MX"
              min={1}
              placeholder="Ingresa el monto"
              disabled={loading}
              className="w-full"
              inputClassName="w-full"
              style={{ width: "100%" }}
              inputStyle={{
                borderRadius: "8px",
                padding: "0.75rem 1rem",
              }}
            />
            <small style={{ color: "#6b7280" }}>
              Monto original:{" "}
              {abono.monto.toLocaleString("es-MX", {
                style: "currency",
                currency: "MXN",
              })}
            </small>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default AbonoSemanalUpdateForm;
