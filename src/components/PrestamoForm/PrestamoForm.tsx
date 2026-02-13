"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import api from "@/services/api";
import type { Partner } from "@/types/Partner";
import type { CreatePrestamoDto, TipoInteres } from "@/types/Prestamo";
import PartnerSearchDropdown from "@/components/PartnerSearchDropdown/PartnerSearchDropdown";

interface PrestamoFormProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

const PrestamoForm: React.FC<PrestamoFormProps> = ({
  visible,
  onHide,
  onSuccess,
}) => {
  const toast = useRef<Toast>(null);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [montoOriginal, setMontoOriginal] = useState<number | null>(null);
  const [tasaInteres, setTasaInteres] = useState<number>(10);
  const [tasaMora, setTasaMora] = useState<number>(2);
  const [plazoMeses, setPlazoMeses] = useState<number | null>(null);
  const [tipoInteres, setTipoInteres] = useState<TipoInteres>(
    "simple" as TipoInteres,
  );
  const [notas, setNotas] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Cargar partners al abrir el dialog
  useEffect(() => {
    if (visible) {
      api
        .get<Partner[]>("/partners")
        .then((res) => setPartners(res.data))
        .catch((err) => console.error("Error al cargar partners:", err));
    }
  }, [visible]);

  const tipoInteresOptions = [
    { label: "Simple", value: "simple" },
    { label: "Compuesto", value: "compuesto" },
  ];

  // Cálculo del préstamo (preview)
  const calcularPrestamo = () => {
    if (!montoOriginal || !plazoMeses)
      return { montoTotal: 0, cuotaMensual: 0 };

    let montoTotal = 0;
    if (tipoInteres === "simple") {
      // Interés simple: Monto + (Monto * tasa/100 * plazo)
      montoTotal =
        montoOriginal + montoOriginal * (tasaInteres / 100) * plazoMeses;
    } else {
      // Interés compuesto: Monto * (1 + tasa/100)^plazo
      montoTotal = montoOriginal * Math.pow(1 + tasaInteres / 100, plazoMeses);
    }

    const cuotaMensual = montoTotal / plazoMeses;
    return { montoTotal, cuotaMensual };
  };

  const { montoTotal, cuotaMensual } = calcularPrestamo();

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  // Resetear formulario
  const resetForm = () => {
    setSelectedPartner(null);
    setMontoOriginal(null);
    setTasaInteres(5);
    setTasaMora(1);
    setPlazoMeses(null);
    setTipoInteres("simple" as TipoInteres);
    setNotas("");
  };

  // Manejar envío
  const handleSubmit = async () => {
    if (!selectedPartner || !montoOriginal || !plazoMeses) {
      toast.current?.show({
        severity: "warn",
        summary: "Campos requeridos",
        detail: "Por favor completa todos los campos obligatorios",
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const payload: CreatePrestamoDto = {
        id_socio: selectedPartner.id,
        monto_original: montoOriginal,
        tasa_interes: tasaInteres,
        tasa_mora: tasaMora,
        plazo_meses: plazoMeses,
        tipo_interes: tipoInteres,
        notas: notas || undefined,
      };

      await api.post("/prestamos", payload);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Préstamo creado correctamente",
        life: 3000,
      });

      resetForm();
      onSuccess();
      onHide();
    } catch (err) {
      console.error("Error al crear préstamo:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo crear el préstamo",
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
        label="Crear Préstamo"
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={loading}
        disabled={!selectedPartner || !montoOriginal || !plazoMeses}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header="Nuevo Préstamo"
        visible={visible}
        onHide={() => {
          resetForm();
          onHide();
        }}
        style={{ width: "95vw", maxWidth: "600px" }}
        footer={dialogFooter}
        modal
        className="p-fluid"
      >
        {/* Selección de socio */}
        <div className="mb-4">
          <label
            htmlFor="socio"
            className="block mb-2"
            style={{ fontWeight: "600", color: "#374151" }}
          >
            Socio *
          </label>
          <PartnerSearchDropdown
            partners={partners}
            selectedPartner={selectedPartner}
            onSelect={(partner) => setSelectedPartner(partner)}
            placeholder="Buscar socio..."
          />
        </div>

        {/* Monto original */}
        <div className="mb-4">
          <label
            htmlFor="monto"
            className="block mb-2"
            style={{ fontWeight: "600", color: "#374151" }}
          >
            Monto del Préstamo *
          </label>
          <InputNumber
            id="monto"
            value={montoOriginal}
            onValueChange={(e) => setMontoOriginal(e.value ?? null)}
            mode="currency"
            currency="MXN"
            locale="es-MX"
            placeholder="$0.00"
            min={0}
            className="w-full"
          />
        </div>

        {/* Plazo en meses */}
        <div className="mb-4">
          <label
            htmlFor="plazo"
            className="block mb-2"
            style={{ fontWeight: "600", color: "#374151" }}
          >
            Plazo (meses) *
          </label>
          <InputNumber
            id="plazo"
            value={plazoMeses}
            onValueChange={(e) => setPlazoMeses(e.value ?? null)}
            placeholder="12"
            min={1}
            max={60}
            className="w-full"
            suffix=" meses"
          />
        </div>

        {/* Tasa de interés y mora */}
        <div className="flex flex-column md:flex-row gap-3 mb-4">
          <div className="flex-1">
            <label
              htmlFor="tasaInteres"
              className="block mb-2"
              style={{ fontWeight: "600", color: "#374151" }}
            >
              Tasa de Interés (%)
            </label>
            <InputNumber
              id="tasaInteres"
              value={tasaInteres}
              onValueChange={(e) => setTasaInteres(e.value ?? 10)}
              suffix="%"
              min={0}
              max={100}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="tasaMora"
              className="block mb-2"
              style={{ fontWeight: "600", color: "#374151" }}
            >
              Tasa de Mora (%)
            </label>
            <InputNumber
              id="tasaMora"
              value={tasaMora}
              onValueChange={(e) => setTasaMora(e.value ?? 2)}
              suffix="%"
              min={0}
              max={100}
              className="w-full"
            />
          </div>
        </div>

        {/* Tipo de interés */}
        <div className="mb-4">
          <label
            htmlFor="tipoInteres"
            className="block mb-2"
            style={{ fontWeight: "600", color: "#374151" }}
          >
            Tipo de Interés
          </label>
          <Dropdown
            id="tipoInteres"
            value={tipoInteres}
            options={tipoInteresOptions}
            onChange={(e) => setTipoInteres(e.value)}
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

        {/* Preview del cálculo */}
        {montoOriginal && plazoMeses && (
          <>
            <Divider />
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
                <i className="pi pi-calculator mr-2"></i>
                Resumen del Préstamo
              </h4>
              <div className="flex flex-column gap-2">
                <div className="flex justify-content-between">
                  <span style={{ color: "#374151" }}>Monto Original:</span>
                  <span style={{ fontWeight: "600" }}>
                    {formatCurrency(montoOriginal)}
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
                <div className="flex justify-content-between">
                  <span style={{ color: "#374151" }}>Intereses Totales:</span>
                  <span style={{ fontWeight: "600", color: "#9333ea" }}>
                    {formatCurrency(montoTotal - montoOriginal)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
};

export default PrestamoForm;
