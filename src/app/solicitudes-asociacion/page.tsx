"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { AxiosError } from "axios";

// PrimeReact
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import { Chip } from "primereact/chip";

// Tipos
interface Usuario {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface SolicitudAsociacion {
  id: string;
  monto_semanal_solicitado: number;
  estado: "pendiente" | "aprobada" | "rechazada";
  mensaje_usuario?: string;
  motivo_rechazo?: string;
  fecha_resolucion?: string;
  created_at: string;
  updated_at: string;
  usuario: Usuario;
}

const SolicitudesAsociacionPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [solicitudes, setSolicitudes] = useState<SolicitudAsociacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] =
    useState<SolicitudAsociacion | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  // Verificar que el usuario sea admin
  useEffect(() => {
    if (user && user.rol !== "admin") {
      router.push("/unauthorized");
    }
  }, [user, router]);

  // Cargar solicitudes
  const loadSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await api.get<SolicitudAsociacion[]>(
        "/solicitudes-asociacion",
      );
      setSolicitudes(response.data);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
      toast.showError("Error", "No se pudieron cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.rol === "admin") {
      loadSolicitudes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Aprobar solicitud
  const handleAprobar = async (solicitud: SolicitudAsociacion) => {
    setActionLoading(true);
    try {
      await api.post("/solicitudes-asociacion/aprobar", {
        solicitud_id: solicitud.id,
      });

      toast.showSuccess(
        "Solicitud Aprobada",
        `${solicitud.usuario.name} ${solicitud.usuario.lastName} ahora es socio`,
      );

      loadSolicitudes();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.showError(
        "Error",
        err.response?.data?.message || "No se pudo aprobar la solicitud",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar solicitud
  const handleRechazar = async () => {
    if (!selectedSolicitud) return;

    setActionLoading(true);
    try {
      await api.post("/solicitudes-asociacion/rechazar", {
        solicitud_id: selectedSolicitud.id,
        motivo_rechazo: motivoRechazo || undefined,
      });

      toast.showInfo("Solicitud Rechazada", "Se ha notificado al usuario");

      setShowRejectDialog(false);
      setSelectedSolicitud(null);
      setMotivoRechazo("");
      loadSolicitudes();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.showError(
        "Error",
        err.response?.data?.message || "No se pudo rechazar la solicitud",
      );
    } finally {
      setActionLoading(false);
    }
  };

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
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Templates para la tabla
  const usuarioBodyTemplate = (rowData: SolicitudAsociacion) => (
    <div>
      <div className="font-semibold text-900">
        {rowData.usuario.name} {rowData.usuario.lastName}
      </div>
      <div className="text-sm text-600">{rowData.usuario.email}</div>
      <div className="text-sm text-600">{rowData.usuario.phoneNumber}</div>
    </div>
  );

  const montoBodyTemplate = (rowData: SolicitudAsociacion) => (
    <span className="font-semibold text-900">
      {formatCurrency(rowData.monto_semanal_solicitado)}
    </span>
  );

  const estadoBodyTemplate = (rowData: SolicitudAsociacion) => {
    const severityMap = {
      pendiente: "warning",
      aprobada: "success",
      rechazada: "danger",
    } as const;

    const labelMap = {
      pendiente: "Pendiente",
      aprobada: "Aprobada",
      rechazada: "Rechazada",
    };

    return (
      <Tag
        value={labelMap[rowData.estado]}
        severity={severityMap[rowData.estado]}
      />
    );
  };

  const fechaBodyTemplate = (rowData: SolicitudAsociacion) => (
    <span className="text-sm text-600">{formatDate(rowData.created_at)}</span>
  );

  const accionesBodyTemplate = (rowData: SolicitudAsociacion) => {
    if (rowData.estado !== "pendiente") {
      return (
        <div className="text-sm text-600">
          {rowData.estado === "aprobada"
            ? "Aprobada"
            : `Rechazada: ${rowData.motivo_rechazo || "Sin motivo"}`}
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-check"
          severity="success"
          size="small"
          tooltip="Aprobar"
          tooltipOptions={{ position: "top" }}
          onClick={() => handleAprobar(rowData)}
          disabled={actionLoading}
        />
        <Button
          icon="pi pi-times"
          severity="danger"
          size="small"
          outlined
          tooltip="Rechazar"
          tooltipOptions={{ position: "top" }}
          onClick={() => {
            setSelectedSolicitud(rowData);
            setShowRejectDialog(true);
          }}
          disabled={actionLoading}
        />
      </div>
    );
  };

  const mensajeBodyTemplate = (rowData: SolicitudAsociacion) => {
    if (!rowData.mensaje_usuario) {
      return <span className="text-sm text-400">Sin mensaje</span>;
    }

    return (
      <div className="max-w-20rem">
        <p className="text-sm text-600 m-0 white-space-normal line-height-3">
          {rowData.mensaje_usuario}
        </p>
      </div>
    );
  };

  // Filtrar solicitudes
  const solicitudesPendientes = solicitudes.filter(
    (s) => s.estado === "pendiente",
  );
  const solicitudesResueltas = solicitudes.filter(
    (s) => s.estado !== "pendiente",
  );

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-900 m-0 mb-2">
              Solicitudes de Asociación
            </h1>
            <p className="text-600 m-0">
              Gestiona las solicitudes de usuarios para ser socios
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid mb-4">
        <div className="col-12 md:col-6 lg:col-4">
          <Card className="shadow-2">
            <div className="flex align-items-center gap-3">
              <div
                className="flex align-items-center justify-content-center border-circle bg-yellow-100"
                style={{ width: "50px", height: "50px" }}
              >
                <i className="pi pi-clock text-yellow-600 text-2xl" />
              </div>
              <div>
                <div className="text-600 text-sm">Pendientes</div>
                <div className="text-900 font-bold text-2xl">
                  {solicitudesPendientes.length}
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-4">
          <Card className="shadow-2">
            <div className="flex align-items-center gap-3">
              <div
                className="flex align-items-center justify-content-center border-circle bg-green-100"
                style={{ width: "50px", height: "50px" }}
              >
                <i className="pi pi-check-circle text-green-600 text-2xl" />
              </div>
              <div>
                <div className="text-600 text-sm">Aprobadas</div>
                <div className="text-900 font-bold text-2xl">
                  {solicitudes.filter((s) => s.estado === "aprobada").length}
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-4">
          <Card className="shadow-2">
            <div className="flex align-items-center gap-3">
              <div
                className="flex align-items-center justify-content-center border-circle bg-red-100"
                style={{ width: "50px", height: "50px" }}
              >
                <i className="pi pi-times-circle text-red-600 text-2xl" />
              </div>
              <div>
                <div className="text-600 text-sm">Rechazadas</div>
                <div className="text-900 font-bold text-2xl">
                  {solicitudes.filter((s) => s.estado === "rechazada").length}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabla de solicitudes pendientes */}
      {solicitudesPendientes.length > 0 && (
        <Card className="mb-4 shadow-2">
          <h2 className="text-xl font-bold text-900 mb-3 flex align-items-center gap-2">
            <i className="pi pi-clock text-yellow-600" />
            Solicitudes Pendientes
            <Chip
              label={solicitudesPendientes.length.toString()}
              className="bg-yellow-100 text-yellow-700"
            />
          </h2>
          <DataTable
            value={solicitudesPendientes}
            loading={loading}
            emptyMessage="No hay solicitudes pendientes"
            responsiveLayout="scroll"
            className="p-datatable-sm"
          >
            <Column
              field="usuario"
              header="Usuario"
              body={usuarioBodyTemplate}
              style={{ minWidth: "200px" }}
            />
            <Column
              field="monto_semanal_solicitado"
              header="Monto Semanal"
              body={montoBodyTemplate}
              style={{ minWidth: "120px" }}
            />
            <Column
              field="mensaje_usuario"
              header="Mensaje"
              body={mensajeBodyTemplate}
              style={{ minWidth: "250px" }}
            />
            <Column
              field="created_at"
              header="Fecha"
              body={fechaBodyTemplate}
              style={{ minWidth: "150px" }}
            />
            <Column
              header="Acciones"
              body={accionesBodyTemplate}
              style={{ minWidth: "120px" }}
            />
          </DataTable>
        </Card>
      )}

      {/* Tabla de solicitudes resueltas */}
      <Card className="shadow-2">
        <h2 className="text-xl font-bold text-900 mb-3 flex align-items-center gap-2">
          <i className="pi pi-history text-600" />
          Historial de Solicitudes
        </h2>
        <DataTable
          value={solicitudesResueltas}
          loading={loading}
          emptyMessage="No hay solicitudes resueltas"
          paginator
          rows={10}
          responsiveLayout="scroll"
          className="p-datatable-sm"
        >
          <Column
            field="usuario"
            header="Usuario"
            body={usuarioBodyTemplate}
            style={{ minWidth: "200px" }}
          />
          <Column
            field="monto_semanal_solicitado"
            header="Monto"
            body={montoBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="estado"
            header="Estado"
            body={estadoBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="created_at"
            header="Fecha Solicitud"
            body={fechaBodyTemplate}
            style={{ minWidth: "150px" }}
          />
          <Column
            header="Detalles"
            body={accionesBodyTemplate}
            style={{ minWidth: "200px" }}
          />
        </DataTable>
      </Card>

      {/* Dialog para rechazar */}
      <Dialog
        header="Rechazar Solicitud"
        visible={showRejectDialog}
        style={{ width: "90vw", maxWidth: "500px" }}
        onHide={() => {
          if (!actionLoading) {
            setShowRejectDialog(false);
            setSelectedSolicitud(null);
            setMotivoRechazo("");
          }
        }}
        draggable={false}
        resizable={false}
      >
        <div className="flex flex-column gap-3">
          {selectedSolicitud && (
            <>
              <div className="surface-50 p-3 border-round">
                <p className="m-0 font-semibold text-900 mb-2">
                  Usuario:{" "}
                  {`${selectedSolicitud.usuario.name} ${selectedSolicitud.usuario.lastName}`}
                </p>
                <p className="m-0 text-600 text-sm mb-1">
                  Email: {selectedSolicitud.usuario.email}
                </p>
                <p className="m-0 text-600 text-sm">
                  Monto solicitado:{" "}
                  {formatCurrency(selectedSolicitud.monto_semanal_solicitado)}
                </p>
              </div>

              <p className="m-0 text-600">
                ¿Estás seguro de rechazar esta solicitud? Puedes agregar un
                motivo (opcional) que será notificado al usuario.
              </p>

              <div className="flex flex-column gap-2">
                <label htmlFor="motivo" className="font-semibold text-sm">
                  Motivo del rechazo (Opcional)
                </label>
                <InputTextarea
                  id="motivo"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  rows={4}
                  placeholder="Ej: Documentación incompleta, monto no disponible, etc."
                  maxLength={500}
                  disabled={actionLoading}
                />
                <small className="text-400">
                  {motivoRechazo.length}/500 caracteres
                </small>
              </div>

              <div className="flex gap-2 justify-content-end mt-2">
                <Button
                  label="Cancelar"
                  icon="pi pi-times"
                  outlined
                  onClick={() => {
                    setShowRejectDialog(false);
                    setSelectedSolicitud(null);
                    setMotivoRechazo("");
                  }}
                  disabled={actionLoading}
                />
                <Button
                  label="Rechazar Solicitud"
                  icon="pi pi-check"
                  severity="danger"
                  onClick={handleRechazar}
                  loading={actionLoading}
                />
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Loading overlay */}
      {loading && solicitudes.length === 0 && (
        <div className="flex justify-content-center align-items-center py-8">
          <ProgressSpinner />
        </div>
      )}
    </div>
  );
};

export default SolicitudesAsociacionPage;
