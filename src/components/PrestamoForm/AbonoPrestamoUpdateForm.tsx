"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import api from "@/services/api";
import type { AbonoPrestamo, UpdateAbonoPrestamoDto } from "@/types/Prestamo";

interface AbonoPrestamoUpdateFormProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: () => void;
  abono: AbonoPrestamo | null;
}

const AbonoPrestamoUpdateForm: React.FC<AbonoPrestamoUpdateFormProps> = ({
  visible,
  onHide,
  onSuccess,
  abono,
}) => {
  const toast = useRef<Toast>(null);

  const [monto, setMonto] = useState<number | null>(null);
  const [fechaAbono, setFechaAbono] = useState<Date | null>(null);
  const [notas, setNotas] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Cargar datos del abono al abrir
  useEffect(() => {
    if (abono && visible) {
      setMonto(abono.monto);
      setFechaAbono(new Date(abono.fecha_abono));
      setNotas(abono.notas || "");
    }
  }, [abono, visible]);

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  // Resetear formulario
  const resetForm = () => {
    setMonto(null);
    setFechaAbono(null);
    setNotas("");
  };

  // Manejar actualización
  const handleUpdate = async () => {
    if (!abono || !monto) {
      toast.current?.show({
        severity: "warn",
        summary: "Campos requeridos",
        detail: "Por favor ingresa el monto del abono",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const payload: UpdateAbonoPrestamoDto = {
        monto,
        fecha_abono: fechaAbono?.toISOString().split("T")[0],
        notas: notas || undefined,
      };

      await api.patch(`/prestamos/abono/${abono.id}`, payload);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Abono actualizado correctamente",
        life: 3000,
      });

      resetForm();
      onSuccess();
      onHide();
    } catch (err) {
      console.error("Error al actualizar abono:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo actualizar el abono",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = () => {
    confirmDialog({
      message: "¿Estás seguro de que deseas eliminar este abono?",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        if (!abono) return;
        setLoading(true);
        try {
          await api.delete(`/prestamos/abono/${abono.id}`);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Abono eliminado correctamente",
            life: 3000,
          });
          resetForm();
          onSuccess();
          onHide();
        } catch (err) {
          console.error("Error al eliminar abono:", err);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo eliminar el abono",
            life: 3000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Footer del dialog
  const dialogFooter = (
    <div className="flex justify-content-between gap-2">
      <Button
        label="Eliminar"
        icon="pi pi-trash"
        severity="danger"
        outlined
        onClick={handleDelete}
        disabled={loading}
      />
      <div className="flex gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          outlined
          onClick={() => {
            resetForm();
            onHide();
          }}
          disabled={loading}
        />
        <Button
          label="Guardar Cambios"
          icon="pi pi-check"
          onClick={handleUpdate}
          loading={loading}
          disabled={!monto}
        />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      <Dialog
        header="Editar Abono"
        visible={visible}
        onHide={() => {
          resetForm();
          onHide();
        }}
        style={{ width: "95vw", maxWidth: "500px" }}
        footer={dialogFooter}
        modal
        className="p-fluid"
      >
        {abono && (
          <>
            {/* Info del abono */}
            <div
              className="p-3 mb-4 border-round"
              style={{
                backgroundColor: "#f3f4f6",
                border: "1px solid #e5e7eb",
              }}
            >
              <div className="flex justify-content-between mb-2">
                <span style={{ color: "#6b7280" }}>Socio:</span>
                <span style={{ fontWeight: "600" }}>
                  {abono.id_socio?.id_usuario?.name}{" "}
                  {abono.id_socio?.id_usuario?.lastName}
                </span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span style={{ color: "#6b7280" }}>Monto Original:</span>
                <span style={{ fontWeight: "600" }}>
                  {formatCurrency(abono.monto)}
                </span>
              </div>
              <div className="flex flex-column gap-1">
                <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  Distribución actual:
                </span>
                <div className="flex gap-3" style={{ fontSize: "0.75rem" }}>
                  <span>Capital: {formatCurrency(abono.aplicado_capital)}</span>
                  <span>Interés: {formatCurrency(abono.aplicado_interes)}</span>
                  {abono.aplicado_mora > 0 && (
                    <span style={{ color: "#ea580c" }}>
                      Mora: {formatCurrency(abono.aplicado_mora)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Monto */}
            <div className="mb-4">
              <label
                htmlFor="monto"
                className="block mb-2"
                style={{ fontWeight: "600", color: "#374151" }}
              >
                Monto del Abono *
              </label>
              <InputNumber
                id="monto"
                value={monto}
                onValueChange={(e) => setMonto(e.value ?? null)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                placeholder="$0.00"
                min={0}
                className="w-full"
              />
            </div>

            {/* Fecha del abono */}
            <div className="mb-4">
              <label
                htmlFor="fecha"
                className="block mb-2"
                style={{ fontWeight: "600", color: "#374151" }}
              >
                Fecha del Abono
              </label>
              <Calendar
                id="fecha"
                value={fechaAbono}
                onChange={(e) => setFechaAbono(e.value as Date)}
                dateFormat="dd/mm/yy"
                showIcon
                className="w-full"
              />
            </div>

            {/* Notas */}
            <div className="mb-4">
              <label
                htmlFor="notas"
                className="block mb-2"
                style={{ fontWeight: "600", color: "#374151" }}
              >
                Notas (opcional)
              </label>
              <InputTextarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                placeholder="Agregar notas o comentarios..."
                className="w-full"
              />
            </div>

            {/* Nota de advertencia */}
            <div
              className="p-3 border-round"
              style={{
                backgroundColor: "#fef3c7",
                border: "1px solid #fcd34d",
              }}
            >
              <p
                className="m-0"
                style={{ fontSize: "0.875rem", color: "#92400e" }}
              >
                <i className="pi pi-info-circle mr-2"></i>
                Al modificar el monto, la distribución (capital, interés, mora)
                se recalculará automáticamente.
              </p>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
};

export default AbonoPrestamoUpdateForm;
