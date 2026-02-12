"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Toast } from "primereact/toast";
import type { AxiosError } from "axios";

// PrimeReact
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";
import { Chip } from "primereact/chip";
import { TabView, TabPanel } from "primereact/tabview";
import { ProgressSpinner } from "primereact/progressspinner";
import { Knob } from "primereact/knob";
import { InputNumber } from "primereact/inputnumber";

import {
  getSolicitudesPrestamo,
  aprobarSolicitudPrestamo,
  rechazarSolicitudPrestamo,
} from "@/services/scoring-api";
import type { SolicitudPrestamo, NivelRiesgo } from "@/types/Scoring";

// ==== Tipos para solicitudes de asociación ====
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

// ==== Helpers ====
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
  if (score >= 750) return "#059669";
  if (score >= 500) return "#2563EB";
  if (score >= 300) return "#D97706";
  return "#DC2626";
};

const formatCurrency = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

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

// ==== Helpers para SolicitudPrestamo (nested structure) ====
const getSocioNombre = (s: SolicitudPrestamo): string => {
  const u = s.socio?.id_usuario;
  if (u) return `${u.name} ${u.lastName}`.trim();
  if (s.usuario) return `${s.usuario.name} ${s.usuario.lastName}`.trim();
  return "Desconocido";
};

const getSocioNSocio = (s: SolicitudPrestamo): number => s.socio?.n_socio ?? 0;

const getScoreAlSolicitar = (s: SolicitudPrestamo): number =>
  typeof s.score_al_solicitar === "string"
    ? parseFloat(s.score_al_solicitar) || 0
    : (s.score_al_solicitar ?? 0);

const getRiesgoAlSolicitar = (s: SolicitudPrestamo): NivelRiesgo => {
  const raw = s.riesgo_al_solicitar?.toLowerCase() ?? "medio";
  if (raw === "bajo" || raw === "medio" || raw === "alto") return raw;
  return "medio";
};

const getMontoSolicitado = (s: SolicitudPrestamo): number =>
  typeof s.monto_solicitado === "string"
    ? parseFloat(s.monto_solicitado) || 0
    : (s.monto_solicitado ?? 0);

const getMontoMaximoRecomendado = (s: SolicitudPrestamo): number =>
  typeof s.monto_maximo_recomendado === "string"
    ? parseFloat(s.monto_maximo_recomendado) || 0
    : (s.monto_maximo_recomendado ?? 0);

const getMontoOptimoSugerido = (s: SolicitudPrestamo): number =>
  typeof s.monto_optimo_sugerido === "string"
    ? parseFloat(s.monto_optimo_sugerido) || 0
    : (s.monto_optimo_sugerido ?? 0);

const getAdminNombre = (s: SolicitudPrestamo): string => {
  const a = s.admin_resolucion;
  if (a) return `${a.name} ${a.lastName}`.trim();
  return "admin";
};

// ==== Componente principal ====
const SolicitudesPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useRef<Toast>(null);
  const [activeTab, setActiveTab] = useState(0);

  // ── Solicitudes de Asociación ──
  const [solicitudesAsociacion, setSolicitudesAsociacion] = useState<
    SolicitudAsociacion[]
  >([]);
  const [loadingAsociacion, setLoadingAsociacion] = useState(true);
  const [actionLoadingAsociacion, setActionLoadingAsociacion] = useState(false);
  const [selectedSolicitudAsociacion, setSelectedSolicitudAsociacion] =
    useState<SolicitudAsociacion | null>(null);
  const [showRejectAsociacionDialog, setShowRejectAsociacionDialog] =
    useState(false);
  const [motivoRechazoAsociacion, setMotivoRechazoAsociacion] = useState("");

  // ── Solicitudes de Préstamo ──
  const [solicitudesPrestamo, setSolicitudesPrestamo] = useState<
    SolicitudPrestamo[]
  >([]);
  const [loadingPrestamo, setLoadingPrestamo] = useState(true);
  const [actionLoadingPrestamo, setActionLoadingPrestamo] = useState(false);
  const [selectedSolicitudPrestamo, setSelectedSolicitudPrestamo] =
    useState<SolicitudPrestamo | null>(null);
  const [showRejectPrestamoDialog, setShowRejectPrestamoDialog] =
    useState(false);
  const [showApprovePrestamoDialog, setShowApprovePrestamoDialog] =
    useState(false);
  const [motivoRechazoPrestamo, setMotivoRechazoPrestamo] = useState("");
  const [montoAprobado, setMontoAprobado] = useState<number | null>(null);
  const [tasaInteresAprobada, setTasaInteresAprobada] = useState<number | null>(
    null,
  );

  // Verificar admin
  useEffect(() => {
    if (user && user.rol !== "admin") {
      router.push("/unauthorized");
    }
  }, [user, router]);

  // ═══════════════════════════════════════════
  // SOLICITUDES DE ASOCIACIÓN
  // ═══════════════════════════════════════════

  const loadSolicitudesAsociacion = async () => {
    setLoadingAsociacion(true);
    try {
      const response = await api.get<SolicitudAsociacion[]>(
        "/solicitudes-asociacion",
      );
      setSolicitudesAsociacion(response.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las solicitudes de asociación",
        life: 3000,
      });
    } finally {
      setLoadingAsociacion(false);
    }
  };

  const handleAprobarAsociacion = async (solicitud: SolicitudAsociacion) => {
    setActionLoadingAsociacion(true);
    try {
      await api.post("/solicitudes-asociacion/aprobar", {
        solicitud_id: solicitud.id,
      });
      toast.current?.show({
        severity: "success",
        summary: "Solicitud Aprobada",
        detail: `${solicitud.usuario.name} ${solicitud.usuario.lastName} ahora es socio`,
        life: 3000,
      });
      loadSolicitudesAsociacion();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message || "No se pudo aprobar la solicitud",
        life: 3000,
      });
    } finally {
      setActionLoadingAsociacion(false);
    }
  };

  const handleRechazarAsociacion = async () => {
    if (!selectedSolicitudAsociacion) return;
    setActionLoadingAsociacion(true);
    try {
      await api.post("/solicitudes-asociacion/rechazar", {
        solicitud_id: selectedSolicitudAsociacion.id,
        motivo_rechazo: motivoRechazoAsociacion || undefined,
      });
      toast.current?.show({
        severity: "info",
        summary: "Solicitud Rechazada",
        detail: "Se ha notificado al usuario",
        life: 3000,
      });
      setShowRejectAsociacionDialog(false);
      setSelectedSolicitudAsociacion(null);
      setMotivoRechazoAsociacion("");
      loadSolicitudesAsociacion();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message || "No se pudo rechazar la solicitud",
        life: 3000,
      });
    } finally {
      setActionLoadingAsociacion(false);
    }
  };

  // ═══════════════════════════════════════════
  // SOLICITUDES DE PRÉSTAMO
  // ═══════════════════════════════════════════

  const loadSolicitudesPrestamo = async () => {
    setLoadingPrestamo(true);
    try {
      const data = await getSolicitudesPrestamo();
      setSolicitudesPrestamo(data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las solicitudes de préstamo",
        life: 3000,
      });
    } finally {
      setLoadingPrestamo(false);
    }
  };

  const handleAprobarPrestamo = async () => {
    if (!selectedSolicitudPrestamo) return;
    setActionLoadingPrestamo(true);
    try {
      await aprobarSolicitudPrestamo({
        solicitud_id: selectedSolicitudPrestamo.id,
        monto_aprobado: montoAprobado || undefined,
        tasa_interes: tasaInteresAprobada || undefined,
      });
      toast.current?.show({
        severity: "success",
        summary: "Préstamo Aprobado",
        detail: `Préstamo aprobado para ${getSocioNombre(selectedSolicitudPrestamo)}`,
        life: 3000,
      });
      setShowApprovePrestamoDialog(false);
      setSelectedSolicitudPrestamo(null);
      setMontoAprobado(null);
      setTasaInteresAprobada(null);
      loadSolicitudesPrestamo();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "No se pudo aprobar el préstamo",
        life: 3000,
      });
    } finally {
      setActionLoadingPrestamo(false);
    }
  };

  const handleRechazarPrestamo = async () => {
    if (!selectedSolicitudPrestamo || !motivoRechazoPrestamo.trim()) return;
    setActionLoadingPrestamo(true);
    try {
      await rechazarSolicitudPrestamo({
        solicitud_id: selectedSolicitudPrestamo.id,
        motivo_rechazo: motivoRechazoPrestamo,
      });
      toast.current?.show({
        severity: "info",
        summary: "Solicitud Rechazada",
        detail: "Se ha notificado al socio",
        life: 3000,
      });
      setShowRejectPrestamoDialog(false);
      setSelectedSolicitudPrestamo(null);
      setMotivoRechazoPrestamo("");
      loadSolicitudesPrestamo();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message || "No se pudo rechazar la solicitud",
        life: 3000,
      });
    } finally {
      setActionLoadingPrestamo(false);
    }
  };

  // Load data
  useEffect(() => {
    if (user?.rol === "admin") {
      loadSolicitudesAsociacion();
      loadSolicitudesPrestamo();
    }
  }, [user]);

  // Counts
  const pendientesAsociacion = solicitudesAsociacion.filter(
    (s) => s.estado === "pendiente",
  );
  const resueltasAsociacion = solicitudesAsociacion.filter(
    (s) => s.estado !== "pendiente",
  );
  const pendientesPrestamo = solicitudesPrestamo.filter(
    (s) => s.estado === "pendiente",
  );
  const resueltasPrestamo = solicitudesPrestamo.filter(
    (s) => s.estado !== "pendiente",
  );
  const totalPendientes =
    pendientesAsociacion.length + pendientesPrestamo.length;

  // ═══════════════════════════════════════════
  // TEMPLATES - Asociación
  // ═══════════════════════════════════════════

  const usuarioBodyTemplate = (rowData: SolicitudAsociacion) => (
    <div>
      <div className="font-semibold text-900">
        {rowData.usuario.name} {rowData.usuario.lastName}
      </div>
      <div className="text-sm text-600">{rowData.usuario.email}</div>
      <div className="text-sm text-600">{rowData.usuario.phoneNumber}</div>
    </div>
  );

  const montoAsociacionBodyTemplate = (rowData: SolicitudAsociacion) => (
    <span className="font-semibold text-900">
      {formatCurrency(rowData.monto_semanal_solicitado)}
    </span>
  );

  const estadoAsociacionBodyTemplate = (rowData: SolicitudAsociacion) => {
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

  const accionesAsociacionBodyTemplate = (rowData: SolicitudAsociacion) => {
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
          onClick={() => handleAprobarAsociacion(rowData)}
          disabled={actionLoadingAsociacion}
        />
        <Button
          icon="pi pi-times"
          severity="danger"
          size="small"
          outlined
          tooltip="Rechazar"
          tooltipOptions={{ position: "top" }}
          onClick={() => {
            setSelectedSolicitudAsociacion(rowData);
            setShowRejectAsociacionDialog(true);
          }}
          disabled={actionLoadingAsociacion}
        />
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // TEMPLATES - Préstamo
  // ═══════════════════════════════════════════

  const socioPrestamoBodyTemplate = (rowData: SolicitudPrestamo) => {
    const nombre = getSocioNombre(rowData);
    const nSocio = getSocioNSocio(rowData);
    return (
      <div className="flex align-items-center gap-2">
        <div
          className="flex align-items-center justify-content-center"
          style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontSize: "0.7rem",
            fontWeight: "bold",
          }}
        >
          {nombre
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-900">{nombre}</div>
          <div className="text-sm text-600">#{nSocio}</div>
        </div>
      </div>
    );
  };

  const montoPrestamoBodyTemplate = (rowData: SolicitudPrestamo) => (
    <div>
      <div className="font-semibold text-900">
        {formatCurrency(getMontoSolicitado(rowData))}
      </div>
      <div className="text-sm text-500">{rowData.plazo_meses} meses</div>
    </div>
  );

  const scoringPrestamoBodyTemplate = (rowData: SolicitudPrestamo) => {
    const score = getScoreAlSolicitar(rowData);
    const riesgoConfig = getRiesgoConfig(getRiesgoAlSolicitar(rowData));
    return (
      <div className="flex align-items-center gap-2">
        <Knob
          value={score}
          max={1000}
          readOnly
          size={40}
          valueColor={getScoreColor(score)}
          rangeColor="#E2E8F0"
          valueTemplate="{value}"
          textColor={getScoreColor(score)}
          strokeWidth={8}
        />
        <Tag value={riesgoConfig.label} severity={riesgoConfig.severity} />
      </div>
    );
  };

  const estadoPrestamoBodyTemplate = (rowData: SolicitudPrestamo) => {
    const severityMap = {
      pendiente: "warning",
      aprobada: "success",
      rechazada: "danger",
      cancelada: "secondary",
    } as const;
    const labelMap = {
      pendiente: "Pendiente",
      aprobada: "Aprobada",
      rechazada: "Rechazada",
      cancelada: "Cancelada",
    };
    return (
      <Tag
        value={labelMap[rowData.estado]}
        severity={severityMap[rowData.estado]}
      />
    );
  };

  const accionesPrestamoBodyTemplate = (rowData: SolicitudPrestamo) => {
    if (rowData.estado !== "pendiente") {
      if (rowData.estado === "rechazada") {
        return (
          <span className="text-sm text-600">
            Rechazada: {rowData.motivo_rechazo || "Sin motivo"}
          </span>
        );
      }
      if (rowData.estado === "aprobada") {
        return (
          <span className="text-sm text-green-600 font-semibold">
            Aprobada por {getAdminNombre(rowData)}
          </span>
        );
      }
      return <span className="text-sm text-600">{rowData.estado}</span>;
    }
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-check"
          severity="success"
          size="small"
          tooltip="Aprobar"
          tooltipOptions={{ position: "top" }}
          onClick={() => {
            setSelectedSolicitudPrestamo(rowData);
            setMontoAprobado(getMontoSolicitado(rowData));
            setTasaInteresAprobada(null);
            setShowApprovePrestamoDialog(true);
          }}
          disabled={actionLoadingPrestamo}
        />
        <Button
          icon="pi pi-times"
          severity="danger"
          size="small"
          outlined
          tooltip="Rechazar"
          tooltipOptions={{ position: "top" }}
          onClick={() => {
            setSelectedSolicitudPrestamo(rowData);
            setShowRejectPrestamoDialog(true);
          }}
          disabled={actionLoadingPrestamo}
        />
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6">
      <Toast ref={toast} />

      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-900 m-0 mb-2">
              <i className="pi pi-inbox mr-2" style={{ color: "#9333EA" }} />
              Solicitudes
            </h1>
            <p className="text-600 m-0">
              Gestiona solicitudes de asociación y préstamos
            </p>
          </div>
          {totalPendientes > 0 && (
            <Tag
              value={`${totalPendientes} pendiente${totalPendientes > 1 ? "s" : ""}`}
              severity="warning"
              style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}
              icon="pi pi-bell"
            />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid mb-4">
        <div className="col-6 md:col-3">
          <Card className="shadow-2">
            <div className="flex align-items-center gap-3">
              <div
                className="flex align-items-center justify-content-center border-circle bg-yellow-100"
                style={{ width: "45px", height: "45px" }}
              >
                <i className="pi pi-clock text-yellow-600 text-xl" />
              </div>
              <div>
                <div className="text-600 text-sm">Pendientes Asociación</div>
                <div className="text-900 font-bold text-xl">
                  {pendientesAsociacion.length}
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-6 md:col-3">
          <Card className="shadow-2">
            <div className="flex align-items-center gap-3">
              <div
                className="flex align-items-center justify-content-center border-circle bg-purple-100"
                style={{ width: "45px", height: "45px" }}
              >
                <i className="pi pi-money-bill text-purple-600 text-xl" />
              </div>
              <div>
                <div className="text-600 text-sm">Pendientes Préstamo</div>
                <div className="text-900 font-bold text-xl">
                  {pendientesPrestamo.length}
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-6 md:col-3">
          <Card className="shadow-2">
            <div className="flex align-items-center gap-3">
              <div
                className="flex align-items-center justify-content-center border-circle bg-green-100"
                style={{ width: "45px", height: "45px" }}
              >
                <i className="pi pi-check-circle text-green-600 text-xl" />
              </div>
              <div>
                <div className="text-600 text-sm">Total Aprobadas</div>
                <div className="text-900 font-bold text-xl">
                  {solicitudesAsociacion.filter((s) => s.estado === "aprobada")
                    .length +
                    solicitudesPrestamo.filter((s) => s.estado === "aprobada")
                      .length}
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-6 md:col-3">
          <Card className="shadow-2">
            <div className="flex align-items-center gap-3">
              <div
                className="flex align-items-center justify-content-center border-circle bg-red-100"
                style={{ width: "45px", height: "45px" }}
              >
                <i className="pi pi-times-circle text-red-600 text-xl" />
              </div>
              <div>
                <div className="text-600 text-sm">Total Rechazadas</div>
                <div className="text-900 font-bold text-xl">
                  {solicitudesAsociacion.filter((s) => s.estado === "rechazada")
                    .length +
                    solicitudesPrestamo.filter((s) => s.estado === "rechazada")
                      .length}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tab View */}
      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
      >
        {/* ── Tab Asociación ── */}
        <TabPanel
          header={
            <span className="flex align-items-center gap-2">
              <i className="pi pi-user-plus" />
              <span>Asociación</span>
              {pendientesAsociacion.length > 0 && (
                <Chip
                  label={pendientesAsociacion.length.toString()}
                  className="bg-yellow-100 text-yellow-700"
                  style={{ height: "1.5rem", fontSize: "0.75rem" }}
                />
              )}
            </span>
          }
        >
          {/* Pendientes */}
          {pendientesAsociacion.length > 0 && (
            <Card className="mb-4 shadow-1">
              <h3 className="text-lg font-bold text-900 mb-3 flex align-items-center gap-2">
                <i className="pi pi-clock text-yellow-600" />
                Pendientes
              </h3>
              <DataTable
                value={pendientesAsociacion}
                loading={loadingAsociacion}
                emptyMessage="No hay solicitudes pendientes"
                responsiveLayout="scroll"
                className="p-datatable-sm"
              >
                <Column
                  header="Usuario"
                  body={usuarioBodyTemplate}
                  style={{ minWidth: "200px" }}
                />
                <Column
                  header="Monto Semanal"
                  body={montoAsociacionBodyTemplate}
                  style={{ minWidth: "120px" }}
                />
                <Column
                  header="Mensaje"
                  body={(row: SolicitudAsociacion) => (
                    <span className="text-sm text-600">
                      {row.mensaje_usuario || "Sin mensaje"}
                    </span>
                  )}
                  style={{ minWidth: "200px" }}
                />
                <Column
                  header="Fecha"
                  body={(row: SolicitudAsociacion) => (
                    <span className="text-sm text-600">
                      {formatDate(row.created_at)}
                    </span>
                  )}
                  style={{ minWidth: "150px" }}
                />
                <Column
                  header="Acciones"
                  body={accionesAsociacionBodyTemplate}
                  style={{ minWidth: "120px" }}
                />
              </DataTable>
            </Card>
          )}
          {/* Historial */}
          <Card className="shadow-1">
            <h3 className="text-lg font-bold text-900 mb-3 flex align-items-center gap-2">
              <i className="pi pi-history text-600" />
              Historial
            </h3>
            <DataTable
              value={resueltasAsociacion}
              loading={loadingAsociacion}
              emptyMessage="No hay solicitudes resueltas"
              paginator
              rows={10}
              responsiveLayout="scroll"
              className="p-datatable-sm"
            >
              <Column
                header="Usuario"
                body={usuarioBodyTemplate}
                style={{ minWidth: "200px" }}
              />
              <Column
                header="Monto"
                body={montoAsociacionBodyTemplate}
                style={{ minWidth: "100px" }}
              />
              <Column
                header="Estado"
                body={estadoAsociacionBodyTemplate}
                style={{ minWidth: "100px" }}
              />
              <Column
                header="Fecha"
                body={(row: SolicitudAsociacion) => (
                  <span className="text-sm text-600">
                    {formatDate(row.created_at)}
                  </span>
                )}
                style={{ minWidth: "130px" }}
              />
              <Column
                header="Detalles"
                body={accionesAsociacionBodyTemplate}
                style={{ minWidth: "180px" }}
              />
            </DataTable>
          </Card>

          {loadingAsociacion && solicitudesAsociacion.length === 0 && (
            <div className="flex justify-content-center py-6">
              <ProgressSpinner />
            </div>
          )}
        </TabPanel>

        {/* ── Tab Préstamo ── */}
        <TabPanel
          header={
            <span className="flex align-items-center gap-2">
              <i className="pi pi-money-bill" />
              <span>Préstamos</span>
              {pendientesPrestamo.length > 0 && (
                <Chip
                  label={pendientesPrestamo.length.toString()}
                  className="bg-purple-100 text-purple-700"
                  style={{ height: "1.5rem", fontSize: "0.75rem" }}
                />
              )}
            </span>
          }
        >
          {/* Pendientes */}
          {pendientesPrestamo.length > 0 && (
            <Card className="mb-4 shadow-1">
              <h3 className="text-lg font-bold text-900 mb-3 flex align-items-center gap-2">
                <i className="pi pi-clock text-yellow-600" />
                Solicitudes Pendientes
              </h3>
              <DataTable
                value={pendientesPrestamo}
                loading={loadingPrestamo}
                emptyMessage="No hay solicitudes pendientes"
                responsiveLayout="scroll"
                className="p-datatable-sm"
              >
                <Column
                  header="Socio"
                  body={socioPrestamoBodyTemplate}
                  style={{ minWidth: "180px" }}
                />
                <Column
                  header="Monto/Plazo"
                  body={montoPrestamoBodyTemplate}
                  style={{ minWidth: "130px" }}
                />
                <Column
                  header="Scoring"
                  body={scoringPrestamoBodyTemplate}
                  style={{ minWidth: "140px" }}
                />
                <Column
                  header="Máx. Sugerido"
                  body={(row: SolicitudPrestamo) => (
                    <span className="text-sm font-semibold text-green-700">
                      {formatCurrency(getMontoMaximoRecomendado(row))}
                    </span>
                  )}
                  style={{ minWidth: "120px" }}
                />
                <Column
                  header="Motivo"
                  body={(row: SolicitudPrestamo) => (
                    <span className="text-sm text-600">
                      {row.mensaje_socio || "Sin motivo"}
                    </span>
                  )}
                  style={{ minWidth: "180px" }}
                />
                <Column
                  header="Fecha"
                  body={(row: SolicitudPrestamo) => (
                    <span className="text-sm text-600">
                      {formatDate(row.created_at)}
                    </span>
                  )}
                  style={{ minWidth: "130px" }}
                />
                <Column
                  header="Acciones"
                  body={accionesPrestamoBodyTemplate}
                  style={{ minWidth: "110px" }}
                />
              </DataTable>
            </Card>
          )}

          {/* Historial */}
          <Card className="shadow-1">
            <h3 className="text-lg font-bold text-900 mb-3 flex align-items-center gap-2">
              <i className="pi pi-history text-600" />
              Historial de Solicitudes
            </h3>
            <DataTable
              value={resueltasPrestamo}
              loading={loadingPrestamo}
              emptyMessage="No hay solicitudes resueltas"
              paginator
              rows={10}
              responsiveLayout="scroll"
              className="p-datatable-sm"
            >
              <Column
                header="Socio"
                body={socioPrestamoBodyTemplate}
                style={{ minWidth: "180px" }}
              />
              <Column
                header="Monto"
                body={montoPrestamoBodyTemplate}
                style={{ minWidth: "130px" }}
              />
              <Column
                header="Scoring"
                body={scoringPrestamoBodyTemplate}
                style={{ minWidth: "140px" }}
              />
              <Column
                header="Estado"
                body={estadoPrestamoBodyTemplate}
                style={{ minWidth: "100px" }}
              />
              <Column
                header="Fecha"
                body={(row: SolicitudPrestamo) => (
                  <span className="text-sm text-600">
                    {formatDate(row.created_at)}
                  </span>
                )}
                style={{ minWidth: "130px" }}
              />
              <Column
                header="Detalles"
                body={accionesPrestamoBodyTemplate}
                style={{ minWidth: "200px" }}
              />
            </DataTable>
          </Card>

          {loadingPrestamo && solicitudesPrestamo.length === 0 && (
            <div className="flex justify-content-center py-6">
              <ProgressSpinner />
            </div>
          )}
        </TabPanel>
      </TabView>

      {/* ═══ Dialogs ═══ */}

      {/* Dialog rechazar asociación */}
      <Dialog
        header="Rechazar Solicitud de Asociación"
        visible={showRejectAsociacionDialog}
        style={{ width: "90vw", maxWidth: "500px" }}
        onHide={() => {
          if (!actionLoadingAsociacion) {
            setShowRejectAsociacionDialog(false);
            setSelectedSolicitudAsociacion(null);
            setMotivoRechazoAsociacion("");
          }
        }}
        draggable={false}
        resizable={false}
      >
        {selectedSolicitudAsociacion && (
          <div className="flex flex-column gap-3">
            <div className="surface-50 p-3 border-round">
              <p className="m-0 font-semibold text-900 mb-1">
                {selectedSolicitudAsociacion.usuario.name}{" "}
                {selectedSolicitudAsociacion.usuario.lastName}
              </p>
              <p className="m-0 text-600 text-sm">
                Monto:{" "}
                {formatCurrency(
                  selectedSolicitudAsociacion.monto_semanal_solicitado,
                )}
              </p>
            </div>
            <div className="flex flex-column gap-2">
              <label className="font-semibold text-sm">
                Motivo del rechazo (Opcional)
              </label>
              <InputTextarea
                value={motivoRechazoAsociacion}
                onChange={(e) => setMotivoRechazoAsociacion(e.target.value)}
                rows={3}
                maxLength={500}
                disabled={actionLoadingAsociacion}
              />
            </div>
            <div className="flex gap-2 justify-content-end">
              <Button
                label="Cancelar"
                outlined
                onClick={() => {
                  setShowRejectAsociacionDialog(false);
                  setSelectedSolicitudAsociacion(null);
                }}
                disabled={actionLoadingAsociacion}
              />
              <Button
                label="Rechazar"
                severity="danger"
                onClick={handleRechazarAsociacion}
                loading={actionLoadingAsociacion}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog aprobar préstamo */}
      <Dialog
        header="Aprobar Solicitud de Préstamo"
        visible={showApprovePrestamoDialog}
        style={{ width: "95vw", maxWidth: "550px" }}
        onHide={() => {
          if (!actionLoadingPrestamo) {
            setShowApprovePrestamoDialog(false);
            setSelectedSolicitudPrestamo(null);
          }
        }}
        draggable={false}
        resizable={false}
      >
        {selectedSolicitudPrestamo && (
          <div className="flex flex-column gap-4">
            {/* Info del socio */}
            <div className="surface-50 p-3 border-round">
              <div className="flex justify-content-between align-items-center mb-2">
                <p className="m-0 font-semibold text-900">
                  {getSocioNombre(selectedSolicitudPrestamo)} (#
                  {getSocioNSocio(selectedSolicitudPrestamo)})
                </p>
                <div className="flex align-items-center gap-2">
                  <Knob
                    value={getScoreAlSolicitar(selectedSolicitudPrestamo)}
                    max={1000}
                    readOnly
                    size={35}
                    valueColor={getScoreColor(
                      getScoreAlSolicitar(selectedSolicitudPrestamo),
                    )}
                    rangeColor="#E2E8F0"
                    valueTemplate="{value}"
                    textColor={getScoreColor(
                      getScoreAlSolicitar(selectedSolicitudPrestamo),
                    )}
                    strokeWidth={8}
                  />
                  <Tag
                    value={
                      getRiesgoConfig(
                        getRiesgoAlSolicitar(selectedSolicitudPrestamo),
                      ).label
                    }
                    severity={
                      getRiesgoConfig(
                        getRiesgoAlSolicitar(selectedSolicitudPrestamo),
                      ).severity
                    }
                  />
                </div>
              </div>
              <div className="flex flex-column gap-1 text-sm text-600">
                <span>
                  Solicitado:{" "}
                  <strong>
                    {formatCurrency(
                      getMontoSolicitado(selectedSolicitudPrestamo),
                    )}
                  </strong>{" "}
                  a{" "}
                  <strong>{selectedSolicitudPrestamo.plazo_meses} meses</strong>
                </span>
                <span>
                  Máx. recomendado:{" "}
                  <strong className="text-green-700">
                    {formatCurrency(
                      getMontoMaximoRecomendado(selectedSolicitudPrestamo),
                    )}
                  </strong>
                </span>
                <span>
                  Óptimo sugerido:{" "}
                  <strong>
                    {formatCurrency(
                      getMontoOptimoSugerido(selectedSolicitudPrestamo),
                    )}
                  </strong>
                </span>
                {selectedSolicitudPrestamo.mensaje_socio && (
                  <span>Motivo: {selectedSolicitudPrestamo.mensaje_socio}</span>
                )}
              </div>
            </div>

            {/* Adjust values */}
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
                  disabled={actionLoadingPrestamo}
                />
              </div>
              <div className="flex flex-column gap-2">
                <label className="font-semibold text-900 text-sm">
                  Tasa de interés (%)
                </label>
                <InputNumber
                  value={tasaInteresAprobada}
                  onValueChange={(e) => setTasaInteresAprobada(e.value ?? null)}
                  suffix="%"
                  min={0}
                  max={100}
                  minFractionDigits={1}
                  maxFractionDigits={2}
                  className="w-full"
                  disabled={actionLoadingPrestamo}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-content-end">
              <Button
                label="Cancelar"
                outlined
                onClick={() => {
                  setShowApprovePrestamoDialog(false);
                  setSelectedSolicitudPrestamo(null);
                }}
                disabled={actionLoadingPrestamo}
              />
              <Button
                label="Aprobar Préstamo"
                icon="pi pi-check"
                severity="success"
                onClick={handleAprobarPrestamo}
                loading={actionLoadingPrestamo}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog rechazar préstamo */}
      <Dialog
        header="Rechazar Solicitud de Préstamo"
        visible={showRejectPrestamoDialog}
        style={{ width: "90vw", maxWidth: "500px" }}
        onHide={() => {
          if (!actionLoadingPrestamo) {
            setShowRejectPrestamoDialog(false);
            setSelectedSolicitudPrestamo(null);
            setMotivoRechazoPrestamo("");
          }
        }}
        draggable={false}
        resizable={false}
      >
        {selectedSolicitudPrestamo && (
          <div className="flex flex-column gap-3">
            <div className="surface-50 p-3 border-round">
              <p className="m-0 font-semibold text-900 mb-1">
                {getSocioNombre(selectedSolicitudPrestamo)} (#
                {getSocioNSocio(selectedSolicitudPrestamo)})
              </p>
              <p className="m-0 text-sm text-600">
                Monto:{" "}
                {formatCurrency(getMontoSolicitado(selectedSolicitudPrestamo))}{" "}
                a {selectedSolicitudPrestamo.plazo_meses} meses
              </p>
            </div>
            <div className="flex flex-column gap-2">
              <label className="font-semibold text-sm">
                Motivo del rechazo <span className="text-red-500">*</span>
              </label>
              <InputTextarea
                value={motivoRechazoPrestamo}
                onChange={(e) => setMotivoRechazoPrestamo(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Describe el motivo del rechazo..."
                disabled={actionLoadingPrestamo}
              />
              <small className="text-400">
                {motivoRechazoPrestamo.length}/500
              </small>
            </div>
            <div className="flex gap-2 justify-content-end">
              <Button
                label="Cancelar"
                outlined
                onClick={() => {
                  setShowRejectPrestamoDialog(false);
                  setSelectedSolicitudPrestamo(null);
                  setMotivoRechazoPrestamo("");
                }}
                disabled={actionLoadingPrestamo}
              />
              <Button
                label="Rechazar"
                severity="danger"
                onClick={handleRechazarPrestamo}
                loading={actionLoadingPrestamo}
                disabled={!motivoRechazoPrestamo.trim()}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default SolicitudesPage;
