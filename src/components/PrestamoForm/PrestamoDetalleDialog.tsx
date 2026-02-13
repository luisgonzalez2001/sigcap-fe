"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Badge } from "primereact/badge";
import { TabView, TabPanel } from "primereact/tabview";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import api from "@/services/api";
import type {
  PrestamoDetalleResponse,
  AbonoPrestamo,
  HistorialPrestamo,
  EstatusPrestamo,
} from "@/types/Prestamo";
import AbonoPrestamoForm from "./AbonoPrestamoForm";
import { useUser } from "@/context/UserContext";

interface PrestamoDetalleDialogProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: () => void;
  prestamoId: string | null;
}

const PrestamoDetalleDialog: React.FC<PrestamoDetalleDialogProps> = ({
  visible,
  onHide,
  onSuccess,
  prestamoId,
}) => {
  const toast = useRef<Toast>(null);
  const { user } = useUser();
  const isAdmin = user?.rol === "admin";

  const [detalle, setDetalle] = useState<PrestamoDetalleResponse | null>(null);
  const [historial, setHistorial] = useState<HistorialPrestamo[]>([]);
  const [loading, setLoading] = useState(false);
  const [abonoDialogVisible, setAbonoDialogVisible] = useState(false);

  // Cargar detalle del préstamo
  const loadDetalle = async () => {
    if (!prestamoId) return;
    setLoading(true);
    try {
      const [detalleRes, historialRes] = await Promise.all([
        api.get<PrestamoDetalleResponse>(`/prestamos/${prestamoId}`),
        api.get<HistorialPrestamo[]>(`/prestamos/${prestamoId}/historial`),
      ]);
      setDetalle(detalleRes.data);
      setHistorial(historialRes.data);
    } catch (err) {
      console.error("Error al cargar detalle:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el detalle del préstamo",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && prestamoId) {
      loadDetalle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, prestamoId]);

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Badge de estatus
  const getStatusBadge = (estatus: EstatusPrestamo) => {
    const statusConfig: Record<
      EstatusPrestamo,
      { severity: "success" | "danger" | "info" | "secondary"; label: string }
    > = {
      activo: { severity: "success", label: "Activo" },
      pagado: { severity: "info", label: "Pagado" },
      vencido: { severity: "danger", label: "Vencido" },
      cancelado: { severity: "secondary", label: "Cancelado" },
    };
    const config = statusConfig[estatus];
    return <Badge value={config.label} severity={config.severity} />;
  };

  // Cancelar préstamo
  const handleCancelar = () => {
    confirmDialog({
      message: "¿Estás seguro de que deseas cancelar este préstamo?",
      header: "Confirmar Cancelación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.patch(`/prestamos/${prestamoId}`, { estatus: "cancelado" });
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Préstamo cancelado correctamente",
            life: 3000,
          });
          onSuccess();
          onHide();
        } catch (err) {
          console.error("Error al cancelar:", err);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo cancelar el préstamo",
            life: 3000,
          });
        }
      },
    });
  };

  // Eliminar abono
  const handleEliminarAbono = (abonoId: string) => {
    confirmDialog({
      message: "¿Estás seguro de que deseas eliminar este abono?",
      header: "Confirmar Eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/prestamos/abono/${abonoId}`);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Abono eliminado correctamente",
            life: 3000,
          });
          loadDetalle();
          onSuccess();
        } catch (err) {
          console.error("Error al eliminar abono:", err);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo eliminar el abono",
            life: 3000,
          });
        }
      },
    });
  };

  // Templates para tabla de abonos
  const montoAbonoTemplate = (rowData: AbonoPrestamo) => (
    <span style={{ fontWeight: "600", color: "#16a34a" }}>
      {formatCurrency(rowData.monto)}
    </span>
  );

  const fechaAbonoTemplate = (rowData: AbonoPrestamo) => (
    <span style={{ color: "#6b7280" }}>{formatDate(rowData.fecha_abono)}</span>
  );

  const distribucionTemplate = (rowData: AbonoPrestamo) => (
    <div className="flex flex-column gap-1" style={{ fontSize: "0.75rem" }}>
      <span>Capital: {formatCurrency(rowData.aplicado_capital)}</span>
      <span>Interés: {formatCurrency(rowData.aplicado_interes)}</span>
      {rowData.aplicado_mora > 0 && (
        <span style={{ color: "#ea580c" }}>
          Mora: {formatCurrency(rowData.aplicado_mora)}
        </span>
      )}
    </div>
  );

  const accionesAbonoTemplate = (rowData: AbonoPrestamo) => (
    <Button
      icon="pi pi-trash"
      severity="danger"
      text
      rounded
      onClick={() => handleEliminarAbono(rowData.id)}
    />
  );

  // Template para historial
  const accionHistorialTemplate = (rowData: HistorialPrestamo) => (
    <Badge
      value={rowData.accion}
      severity={rowData.accion === "Creado" ? "info" : "secondary"}
    />
  );

  // Footer del dialog - solo mostrar acciones para admin
  const dialogFooter = isAdmin ? (
    <div className="flex justify-content-between gap-2 flex-wrap">
      <div>
        {detalle?.prestamo.estatus === "activo" && (
          <Button
            label="Cancelar Préstamo"
            icon="pi pi-times"
            severity="danger"
            outlined
            onClick={handleCancelar}
          />
        )}
      </div>
      <div className="flex gap-2">
        <Button
          label="Cerrar"
          icon="pi pi-times"
          severity="secondary"
          onClick={onHide}
        />
        {detalle?.prestamo.estatus === "activo" && (
          <Button
            label="Registrar Abono"
            icon="pi pi-plus"
            onClick={() => setAbonoDialogVisible(true)}
          />
        )}
      </div>
    </div>
  ) : (
    <div className="flex justify-content-end">
      <Button
        label="Cerrar"
        icon="pi pi-times"
        severity="secondary"
        onClick={onHide}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <Dialog
        header="Detalle del Préstamo"
        visible={visible}
        onHide={onHide}
        style={{ width: "95vw", maxWidth: "900px" }}
        footer={dialogFooter}
        modal
      >
        {loading ? (
          <div className="text-center py-6">
            <i
              className="pi pi-spin pi-spinner"
              style={{ fontSize: "2rem", color: "#6b7280" }}
            ></i>
            <p style={{ color: "#6b7280" }}>Cargando...</p>
          </div>
        ) : detalle ? (
          <>
            {/* Header con info del socio */}
            <div
              className="flex align-items-center gap-3 mb-4 p-3 border-round"
              style={{
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
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
                {detalle.prestamo.id_socio?.id_usuario?.name
                  ?.charAt(0)
                  .toUpperCase()}
                {detalle.prestamo.id_socio?.id_usuario?.lastName
                  ?.charAt(0)
                  .toUpperCase()}
              </div>
              <div className="flex-1">
                <p
                  className="m-0"
                  style={{ fontWeight: "600", fontSize: "1.1rem" }}
                >
                  {detalle.prestamo.id_socio?.id_usuario?.name}{" "}
                  {detalle.prestamo.id_socio?.id_usuario?.lastName}
                </p>
                <p
                  className="m-0"
                  style={{ color: "#6b7280", fontSize: "0.875rem" }}
                >
                  Socio #{detalle.prestamo.id_socio?.n_socio}
                </p>
              </div>
              <div>{getStatusBadge(detalle.prestamo.estatus)}</div>
            </div>

            {/* Cards de resumen */}
            <div className="flex flex-column md:flex-row gap-3 mb-4">
              <div
                className="flex-1 p-3 border-round"
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                <p
                  className="m-0 mb-1"
                  style={{ color: "#166534", fontSize: "0.75rem" }}
                >
                  Monto Original
                </p>
                <p
                  className="m-0"
                  style={{ fontWeight: "bold", fontSize: "1.25rem" }}
                >
                  {formatCurrency(detalle.resumen.monto_original)}
                </p>
              </div>
              <div
                className="flex-1 p-3 border-round"
                style={{
                  backgroundColor: "#fef3c7",
                  border: "1px solid #fcd34d",
                }}
              >
                <p
                  className="m-0 mb-1"
                  style={{ color: "#92400e", fontSize: "0.75rem" }}
                >
                  Monto Total
                </p>
                <p
                  className="m-0"
                  style={{ fontWeight: "bold", fontSize: "1.25rem" }}
                >
                  {formatCurrency(detalle.resumen.monto_total)}
                </p>
              </div>
              <div
                className="flex-1 p-3 border-round"
                style={{
                  backgroundColor: "#dbeafe",
                  border: "1px solid #93c5fd",
                }}
              >
                <p
                  className="m-0 mb-1"
                  style={{ color: "#1e40af", fontSize: "0.75rem" }}
                >
                  Abonado
                </p>
                <p
                  className="m-0"
                  style={{ fontWeight: "bold", fontSize: "1.25rem" }}
                >
                  {formatCurrency(detalle.resumen.monto_abonado)}
                </p>
              </div>
              <div
                className="flex-1 p-3 border-round"
                style={{
                  backgroundColor: "#fee2e2",
                  border: "1px solid #fca5a5",
                }}
              >
                <p
                  className="m-0 mb-1"
                  style={{ color: "#991b1b", fontSize: "0.75rem" }}
                >
                  Saldo Pendiente
                </p>
                <p
                  className="m-0"
                  style={{ fontWeight: "bold", fontSize: "1.25rem" }}
                >
                  {detalle.resumen.saldo_pendiente <= 0
                    ? formatCurrency(0)
                    : formatCurrency(detalle.resumen.saldo_pendiente)}
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mb-4">
              <div className="flex justify-content-between mb-2">
                <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                  Progreso de Pago
                </span>
                <span style={{ fontWeight: "600" }}>
                  {detalle.resumen.porcentaje_pagado.toFixed(1)}%
                </span>
              </div>
              <ProgressBar
                value={detalle.resumen.porcentaje_pagado}
                showValue={false}
                style={{ height: "0.75rem" }}
              />
              <div className="flex justify-content-between mt-2">
                <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  {detalle.resumen.cuotas_pagadas} de{" "}
                  {detalle.resumen.cuotas_pagadas +
                    detalle.resumen.cuotas_pendientes}{" "}
                  cuotas
                </span>
                <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  Próximo pago:{" "}
                  {detalle.resumen.fecha_proximo_pago
                    ? formatDate(detalle.resumen.fecha_proximo_pago)
                    : "N/A"}
                </span>
              </div>
            </div>

            {/* Alerta de mora */}
            {detalle.resumen.dias_mora > 0 && (
              <div
                className="p-3 mb-4 border-round flex align-items-center gap-2"
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fca5a5",
                }}
              >
                <i
                  className="pi pi-exclamation-triangle"
                  style={{ color: "#dc2626" }}
                ></i>
                <div>
                  <p
                    className="m-0"
                    style={{ fontWeight: "600", color: "#dc2626" }}
                  >
                    Préstamo con mora
                  </p>
                  <p
                    className="m-0"
                    style={{ color: "#991b1b", fontSize: "0.875rem" }}
                  >
                    {detalle.resumen.dias_mora} días de mora • Intereses:{" "}
                    {formatCurrency(detalle.resumen.intereses_mora)}
                  </p>
                </div>
              </div>
            )}

            {/* Info adicional */}
            <div
              className="grid mb-4 p-3 border-round"
              style={{
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div className="col-6 md:col-3">
                <p
                  className="m-0"
                  style={{ color: "#6b7280", fontSize: "0.75rem" }}
                >
                  Tasa de Interés
                </p>
                <p className="m-0" style={{ fontWeight: "600" }}>
                  {detalle.prestamo.tasa_interes}%
                </p>
              </div>
              <div className="col-6 md:col-3">
                <p
                  className="m-0"
                  style={{ color: "#6b7280", fontSize: "0.75rem" }}
                >
                  Tasa de Mora
                </p>
                <p className="m-0" style={{ fontWeight: "600" }}>
                  {detalle.prestamo.tasa_mora}%
                </p>
              </div>
              <div className="col-6 md:col-3">
                <p
                  className="m-0"
                  style={{ color: "#6b7280", fontSize: "0.75rem" }}
                >
                  Plazo
                </p>
                <p className="m-0" style={{ fontWeight: "600" }}>
                  {detalle.prestamo.plazo_meses} meses
                </p>
              </div>
              <div className="col-6 md:col-3">
                <p
                  className="m-0"
                  style={{ color: "#6b7280", fontSize: "0.75rem" }}
                >
                  Cuota Mensual
                </p>
                <p className="m-0" style={{ fontWeight: "600" }}>
                  {formatCurrency(detalle.prestamo.monto_cuota)}
                </p>
              </div>
              <div className="col-6 md:col-3">
                <p
                  className="m-0"
                  style={{ color: "#6b7280", fontSize: "0.75rem" }}
                >
                  Tipo de Interés
                </p>
                <p
                  className="m-0"
                  style={{ fontWeight: "600", textTransform: "capitalize" }}
                >
                  {detalle.prestamo.tipo_interes}
                </p>
              </div>
              <div className="col-6 md:col-3">
                <p
                  className="m-0"
                  style={{ color: "#6b7280", fontSize: "0.75rem" }}
                >
                  Fecha de Inicio
                </p>
                <p className="m-0" style={{ fontWeight: "600" }}>
                  {formatDate(detalle.prestamo.fecha_inicio)}
                </p>
              </div>
              <div className="col-6 md:col-3">
                <p
                  className="m-0"
                  style={{ color: "#6b7280", fontSize: "0.75rem" }}
                >
                  Fecha de Vencimiento
                </p>
                <p className="m-0" style={{ fontWeight: "600" }}>
                  {formatDate(detalle.prestamo.fecha_vencimiento)}
                </p>
              </div>
            </div>

            {/* Notas */}
            {detalle.prestamo.notas && (
              <div
                className="p-3 mb-4 border-round"
                style={{
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fcd34d",
                }}
              >
                <p
                  className="m-0 mb-1"
                  style={{ color: "#92400e", fontSize: "0.75rem" }}
                >
                  Notas
                </p>
                <p className="m-0" style={{ color: "#78350f" }}>
                  {detalle.prestamo.notas}
                </p>
              </div>
            )}

            {/* Tabs de abonos e historial */}
            <TabView>
              <TabPanel header="Abonos" leftIcon="pi pi-dollar mr-2">
                {detalle.abonos.length > 0 ? (
                  <DataTable
                    value={detalle.abonos}
                    responsiveLayout="scroll"
                    className="text-sm"
                    emptyMessage="No hay abonos registrados"
                  >
                    <Column
                      field="fecha_abono"
                      header="Fecha"
                      body={fechaAbonoTemplate}
                    />
                    <Column
                      field="monto"
                      header="Monto"
                      body={montoAbonoTemplate}
                    />
                    <Column header="Distribución" body={distribucionTemplate} />
                    <Column field="notas" header="Notas" />
                    {isAdmin && (
                      <Column
                        header=""
                        body={accionesAbonoTemplate}
                        style={{ width: "4rem" }}
                      />
                    )}
                  </DataTable>
                ) : (
                  <div
                    className="text-center py-6"
                    style={{ color: "#6b7280" }}
                  >
                    <i
                      className="pi pi-inbox mb-3"
                      style={{ fontSize: "2rem" }}
                    ></i>
                    <p>No hay abonos registrados</p>
                  </div>
                )}
              </TabPanel>

              <TabPanel header="Historial" leftIcon="pi pi-history mr-2">
                {historial.length > 0 ? (
                  <DataTable
                    value={historial}
                    responsiveLayout="scroll"
                    className="text-sm"
                    emptyMessage="No hay historial"
                  >
                    <Column
                      field="created_at"
                      header="Fecha"
                      body={(rowData) => formatDate(rowData.created_at)}
                    />
                    <Column
                      field="accion"
                      header="Acción"
                      body={accionHistorialTemplate}
                    />
                    <Column
                      header="Realizado por"
                      body={(rowData) =>
                        `${rowData.id_usuario?.name} ${rowData.id_usuario?.lastName}`
                      }
                    />
                  </DataTable>
                ) : (
                  <div
                    className="text-center py-6"
                    style={{ color: "#6b7280" }}
                  >
                    <i
                      className="pi pi-clock mb-3"
                      style={{ fontSize: "2rem" }}
                    ></i>
                    <p>No hay historial</p>
                  </div>
                )}
              </TabPanel>
            </TabView>
          </>
        ) : null}
      </Dialog>

      {/* Dialog para registrar abono */}
      <AbonoPrestamoForm
        visible={abonoDialogVisible}
        onHide={() => setAbonoDialogVisible(false)}
        onSuccess={() => {
          loadDetalle();
          onSuccess();
        }}
        prestamo={detalle?.prestamo || null}
      />
    </>
  );
};

export default PrestamoDetalleDialog;
