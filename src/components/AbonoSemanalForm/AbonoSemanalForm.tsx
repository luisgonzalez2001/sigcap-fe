"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import api from "@/services/api";
import type { AxiosError } from "axios";
import type { Partner } from "@/types/Partner";
import { useUser } from "@/context/UserContext";
import PartnerSearchDropdown from "@/components/PartnerSearchDropdown/PartnerSearchDropdown";

interface AbonoSemanalFormProps {
  visible: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

const AbonoSemanalForm = ({
  visible,
  onHide,
  onSuccess,
}: AbonoSemanalFormProps) => {
  const { user } = useUser();
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [monto, setMonto] = useState<number | null>(null);

  // Cargar socios al abrir el diálogo
  useEffect(() => {
    if (visible) {
      api
        .get("/partners")
        .then((res) => setPartners(res.data))
        .catch((err) => {
          console.error("Error al cargar socios:", err);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudieron cargar los socios",
            life: 3000,
          });
        });
    }
  }, [visible]);

  // Resetear formulario al cerrar
  const resetForm = () => {
    setSelectedPartner(null);
    setMonto(null);
  };

  const handleHide = () => {
    resetForm();
    onHide();
  };

  // Validar y enviar el formulario
  const handleSubmit = async () => {
    // Validaciones
    if (!user) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se encontró el usuario administrador",
        life: 3000,
      });
      return;
    }

    if (!selectedPartner) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "Selecciona un socio",
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
      await api.post("/caja-semanal", {
        id_socio: selectedPartner.id,
        id_admin: user.id,
        monto: monto,
      });

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Abono registrado correctamente",
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
        detail: err.response?.data?.message || "Error al registrar el abono",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Footer del diálogo
  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={handleHide}
        className="p-button-text"
        disabled={loading}
      />
      <Button
        label="Registrar Abono"
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={loading}
        style={{
          backgroundColor: "#16a34a",
          border: "none",
        }}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i
              className="pi pi-wallet"
              style={{ fontSize: "1.25rem", color: "#16a34a" }}
            ></i>
            <span>Registrar Abono Semanal</span>
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
          {/* Buscador y Dropdown de Socios */}
          <div className="flex flex-column gap-2">
            <label
              htmlFor="socio"
              style={{ fontWeight: "600", color: "#374151" }}
            >
              Socio <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <PartnerSearchDropdown
              partners={partners}
              selectedPartner={selectedPartner}
              onSelect={(partner) => {
                setSelectedPartner(partner);
                setMonto(partner ? partner.monto_semanal : null);
              }}
              placeholder="Seleccionar socio..."
              disabled={loading}
            />
          </div>

          {/* Información del socio seleccionado */}
          {selectedPartner && (
            <div
              className="p-3 border-round"
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
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
                  {selectedPartner.id_usuario?.name?.charAt(0).toUpperCase()}
                  {selectedPartner.id_usuario?.lastName
                    ?.charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p
                    className="m-0"
                    style={{ fontWeight: "600", color: "#166534" }}
                  >
                    {selectedPartner.id_usuario?.name}{" "}
                    {selectedPartner.id_usuario?.lastName}
                  </p>
                  <p
                    className="m-0 mt-1"
                    style={{ fontSize: "0.875rem", color: "#15803d" }}
                  >
                    Monto semanal:{" "}
                    <strong>
                      {selectedPartner.monto_semanal.toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      })}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          )}

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
              placeholder={
                selectedPartner
                  ? `${selectedPartner.monto_semanal.toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}`
                  : "Selecciona un socio primero"
              }
              disabled={loading || !selectedPartner}
              className="w-full"
              inputClassName="w-full"
              style={{ width: "100%" }}
              inputStyle={{
                borderRadius: "8px",
                padding: "0.75rem 1rem",
              }}
            />
            {selectedPartner && (
              <small style={{ color: "#6b7280" }}>
                El monto sugerido es{" "}
                {selectedPartner.monto_semanal.toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </small>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default AbonoSemanalForm;
