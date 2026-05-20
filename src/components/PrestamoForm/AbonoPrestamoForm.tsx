"use client";

import { useState, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import api from "@/services/api";
import type { Prestamo, RegistrarAbonoPrestamoDto } from "@/types/Prestamo";

interface AbonoPrestamoFormProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: () => void;
  prestamo: Prestamo | null;
}

const AbonoPrestamoForm: React.FC<AbonoPrestamoFormProps> = ({
  visible,
  onHide,
  onSuccess,
  prestamo,
}) => {
  const toast = useRef<Toast>(null);

  const [monto, setMonto] = useState<number | null>(null);
  const [fechaAbono, setFechaAbono] = useState<Date | null>(new Date());
  const [notas, setNotas] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
    setFechaAbono(new Date());
    setNotas("");
  };

  // Calcular saldo pendiente
  const saldoPendiente = prestamo
    ? Number(prestamo.monto_total) -
      Number(prestamo.monto_abonado) +
      Number(prestamo.intereses_mora)
    : 0;

  // Manejar envío
  const handleSubmit = async () => {
    if (!prestamo || !monto) {
      toast.current?.show({
        severity: "warn",
        summary: "Campos requeridos",
        detail: "Por favor ingresa el monto del abono",
        life: 3000,
      });
      return;
    }

    if (monto > saldoPendiente) {
      toast.current?.show({
        severity: "warn",
        summary: "Monto inválido",
        detail: `El monto no puede ser mayor al saldo pendiente (${formatCurrency(saldoPendiente)})`,
        life: 4000,
      });
      return;
    }

    setLoading(true);
    try {
      const payload: RegistrarAbonoPrestamoDto = {
        monto,
        fecha_abono: fechaAbono?.toISOString().split("T")[0],
        notas: notas || undefined,
      };

      await api.post(`/prestamos/${prestamo.id}/abono`, payload);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Abono registrado correctamente",
        life: 3000,
      });

      resetForm();
      onSuccess();
      onHide();
    } catch (err) {
      console.error("Error al registrar abono:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo registrar el abono",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Footer del dialog
  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
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
        label="Registrar Abono"
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={loading}
        disabled={!monto}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header="Registrar Abono"
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
        {prestamo && (
          <>
            {/* Info del préstamo */}
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
                  {prestamo.id_socio?.id_usuario?.name}{" "}
                  {prestamo.id_socio?.id_usuario?.lastName}
                </span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span style={{ color: "#6b7280" }}>Monto Total:</span>
                <span style={{ fontWeight: "600" }}>
                  {formatCurrency(prestamo.monto_total)}
                </span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span style={{ color: "#6b7280" }}>Abonado:</span>
                <span style={{ fontWeight: "600", color: "#16a34a" }}>
                  {formatCurrency(prestamo.monto_abonado)}
                </span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span style={{ color: "#6b7280" }}>Saldo Pendiente:</span>
                <span style={{ fontWeight: "600", color: "#dc2626" }}>
                  {formatCurrency(saldoPendiente)}
                </span>
              </div>
              {prestamo.intereses_mora > 0 && (
                <div className="flex justify-content-between">
                  <span style={{ color: "#6b7280" }}>Intereses de Mora:</span>
                  <span style={{ fontWeight: "600", color: "#ea580c" }}>
                    {formatCurrency(prestamo.intereses_mora)}
                  </span>
                </div>
              )}
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
                max={saldoPendiente}
                className="w-full"
              />
              <small style={{ color: "#6b7280" }}>
                Cuota mensual sugerida: {formatCurrency(prestamo.monto_cuota)}
              </small>
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
                minDate={
                  prestamo?.fecha_inicio
                    ? new Date(prestamo.fecha_inicio)
                    : undefined
                }
                maxDate={new Date()}
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
          </>
        )}
      </Dialog>
    </>
  );
};

export default AbonoPrestamoForm;
