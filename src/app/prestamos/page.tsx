"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/services/api";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Badge } from "primereact/badge";
import { ProgressBar } from "primereact/progressbar";
import type {
  Prestamo,
  ResumenGeneralPrestamos,
  EstatusPrestamo,
  FiltrosPrestamoDto,
} from "@/types/Prestamo";
import { useUser } from "@/context/UserContext";
import { SolicitudAsociacionWrapper } from "@/components/SolicitudAsociacion/SolicitudAsociacionWrapper";
import PrestamoForm from "@/components/PrestamoForm/PrestamoForm";
import PrestamoDetalleDialog from "@/components/PrestamoForm/PrestamoDetalleDialog";

const PrestamosPage = () => {
  const toast = useRef<Toast>(null);
  const dt = useRef<DataTable<Prestamo[]>>(null);
  const { user, socioExtra, loadingPartner } = useUser();
  const isAdmin = user?.rol === "admin";

  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [resumen, setResumen] = useState<ResumenGeneralPrestamos | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [estatusFilter, setEstatusFilter] = useState<EstatusPrestamo | null>(
    null,
  );
  const [moraFilter, setMoraFilter] = useState<boolean | null>(null);

  // Dialogs
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [detalleDialogVisible, setDetalleDialogVisible] = useState(false);
  const [selectedPrestamoId, setSelectedPrestamoId] = useState<string | null>(
    null,
  );

  const estatusOptions = [
    { label: "Todos", value: null },
    { label: "Activo", value: "activo" },
    { label: "Pagado", value: "pagado" },
    { label: "Vencido", value: "vencido" },
    { label: "Cancelado", value: "cancelado" },
  ];

  const moraOptions = [
    { label: "Todos", value: null },
    { label: "Con mora", value: true },
    { label: "Sin mora", value: false },
  ];

  // Cargar préstamos y resumen
  const loadData = async () => {
    setLoading(true);
    try {
      // Construir parámetros de filtro
      const params: FiltrosPrestamoDto = {};
      if (estatusFilter) params.estatus = estatusFilter;
      if (moraFilter !== null) params.con_mora = moraFilter;

      if (isAdmin) {
        const [prestamosRes, resumenRes] = await Promise.all([
          api.get<Prestamo[]>("/prestamos", { params }),
          api.get<ResumenGeneralPrestamos>("/prestamos/resumen"),
        ]);
        setPrestamos(prestamosRes.data);
        setResumen(resumenRes.data);
      } else {
        // Vista socio: solo sus préstamos (usa el ID del partner)
        const socioId = socioExtra?.id;
        if (socioId) {
          const prestamosRes = await api.get<Prestamo[]>(
            `/prestamos/socio/${socioId}`,
          );
          setPrestamos(prestamosRes.data);
        }
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Para socios: esperar a que socioExtra esté disponible
    // Para admin: cargar siempre que user esté disponible
    if (!user) return;
    if (!isAdmin && !socioExtra?.id) return;

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estatusFilter, moraFilter, user, socioExtra?.id, isAdmin]);

  // Filtrar préstamos por búsqueda
  const filteredPrestamos = prestamos.filter((prestamo) => {
    if (!searchValue.trim()) return true;

    const searchLower = searchValue.toLowerCase();
    const fullName = `${prestamo.id_socio?.id_usuario?.name || ""} ${
      prestamo.id_socio?.id_usuario?.lastName || ""
    }`.toLowerCase();
    const nSocio = String(prestamo.id_socio?.n_socio || "").toLowerCase();

    return fullName.includes(searchLower) || nSocio.includes(searchLower);
  });

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
    });
  };

  // Handler para ver detalle
  const handleVerDetalle = (prestamo: Prestamo) => {
    setSelectedPrestamoId(prestamo.id);
    setDetalleDialogVisible(true);
  };

  // Handler para éxito en operaciones
  const handleSuccess = () => {
    loadData();
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

  // Header de la tabla
  const tableHeader = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between w-full">
      <h2 className="text-xl font-bold m-0">Préstamos</h2>
      {/* Controles de búsqueda y filtros - solo admin */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2 align-items-center">
          {/* Buscador */}
          <div className="relative">
            <i
              className="pi pi-search absolute text-gray-500"
              style={{
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <InputText
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar por nombre o # de socio..."
              style={{
                paddingLeft: "2.5rem",
                borderRadius: "8px",
                minWidth: 220,
              }}
            />
          </div>

          {/* Filtro de estatus */}
          <Dropdown
            value={estatusFilter}
            options={estatusOptions}
            onChange={(e) => setEstatusFilter(e.value)}
            placeholder="Estatus"
            style={{ minWidth: "130px" }}
          />

          {/* Filtro de mora */}
          <Dropdown
            value={moraFilter}
            options={moraOptions}
            onChange={(e) => setMoraFilter(e.value)}
            placeholder="Mora"
            style={{ minWidth: "120px" }}
          />
        </div>
      )}
      {/* Botones de acción */}
      {isAdmin && (
        <div className="flex gap-2">
          <Button
            label="Nuevo Préstamo"
            icon="pi pi-plus"
            severity="success"
            onClick={() => setCreateDialogVisible(true)}
          />
          <Button
            label="Exportar"
            icon="pi pi-upload"
            className="p-button-help"
            onClick={() => dt.current?.exportCSV()}
          />
        </div>
      )}
    </div>
  );

  // Templates de columnas
  const nSocioBodyTemplate = (rowData: Prestamo) => (
    <span style={{ fontWeight: "600", color: "#374151" }}>
      #{rowData.id_socio?.n_socio}
    </span>
  );

  const nombreBodyTemplate = (rowData: Prestamo) => (
    <div className="flex align-items-center gap-2">
      <div
        className="flex align-items-center justify-content-center"
        style={{
          width: "2rem",
          height: "2rem",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontSize: "0.75rem",
          fontWeight: "bold",
        }}
      >
        {rowData.id_socio?.id_usuario?.name?.charAt(0).toUpperCase()}
        {rowData.id_socio?.id_usuario?.lastName?.charAt(0).toUpperCase()}
      </div>
      <span>
        {rowData.id_socio?.id_usuario?.name}{" "}
        {rowData.id_socio?.id_usuario?.lastName}
      </span>
    </div>
  );

  const montoBodyTemplate = (rowData: Prestamo) => (
    <div>
      <p className="m-0" style={{ fontWeight: "600" }}>
        {formatCurrency(rowData.monto_original)}
      </p>
      <p className="m-0" style={{ fontSize: "0.75rem", color: "#6b7280" }}>
        Total: {formatCurrency(rowData.monto_total)}
      </p>
    </div>
  );

  const progresoBodyTemplate = (rowData: Prestamo) => {
    const porcentaje = (rowData.monto_abonado / rowData.monto_total) * 100;
    return (
      <div style={{ minWidth: "120px" }}>
        <ProgressBar
          value={porcentaje}
          showValue={false}
          style={{ height: "0.5rem", marginBottom: "0.25rem" }}
        />
        <p className="m-0" style={{ fontSize: "0.75rem", color: "#6b7280" }}>
          {rowData.cuotas_pagadas}/{rowData.plazo_meses} cuotas
        </p>
      </div>
    );
  };

  const saldoBodyTemplate = (rowData: Prestamo) => {
    const saldo =
      rowData.monto_total - rowData.monto_abonado + rowData.intereses_mora;
    return (
      <span style={{ fontWeight: "600", color: "#dc2626" }}>
        {formatCurrency(saldo)}
      </span>
    );
  };

  const estatusBodyTemplate = (rowData: Prestamo) =>
    getStatusBadge(rowData.estatus);

  const moraBodyTemplate = (rowData: Prestamo) => {
    if (rowData.dias_mora > 0) {
      return (
        <div style={{ color: "#dc2626" }}>
          <i
            className="pi pi-exclamation-triangle mr-1"
            style={{ fontSize: "0.75rem" }}
          ></i>
          <span style={{ fontWeight: "600" }}>{rowData.dias_mora}d</span>
        </div>
      );
    }
    return <span style={{ color: "#16a34a" }}>-</span>;
  };

  const accionesBodyTemplate = (rowData: Prestamo) => (
    <Button
      icon="pi pi-eye"
      severity="info"
      text
      rounded
      onClick={() => handleVerDetalle(rowData)}
      tooltip="Ver detalle"
    />
  );

  // Si el usuario es socio pero no tiene socioExtra asignado, mostrar wrapper
  if (!isAdmin && !loadingPartner && !socioExtra?.id) {
    return (
      <>
        <Toast ref={toast} />
        <SolicitudAsociacionWrapper mensaje="Aún no tienes un socio asignado" />
      </>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <Toast ref={toast} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Préstamos</h1>
        <p className="text-gray-600">
          {isAdmin
            ? "Administra los préstamos de los socios"
            : "Consulta el estado de tus préstamos"}
        </p>
      </div>

      {/* Estadísticas (solo admin) */}
      {isAdmin && resumen && (
        <div className="flex flex-column lg:flex-row gap-3 mb-4">
          <Card className="shadow-sm w-full">
            <div
              className="flex align-items-center gap-3"
              style={{ padding: "0.5rem" }}
            >
              <div
                style={{
                  backgroundColor: "#DBEAFE",
                  padding: "0.75rem",
                  borderRadius: "8px",
                }}
              >
                <i
                  className="pi pi-money-bill"
                  style={{ fontSize: "1.5rem", color: "#2563EB" }}
                ></i>
              </div>
              <div>
                <p
                  className="mb-1"
                  style={{ color: "#6B7280", fontSize: "0.875rem" }}
                >
                  Total Préstamos
                </p>
                <p
                  className="m-0"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "#111827",
                  }}
                >
                  {resumen.total_prestamos}
                </p>
                <p
                  className="m-0 mt-1"
                  style={{ fontSize: "0.75rem", color: "#6B7280" }}
                >
                  {resumen.activos} activos
                </p>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm w-full">
            <div
              className="flex align-items-center gap-3"
              style={{ padding: "0.5rem" }}
            >
              <div
                style={{
                  backgroundColor: "#D1FAE5",
                  padding: "0.75rem",
                  borderRadius: "8px",
                }}
              >
                <i
                  className="pi pi-wallet"
                  style={{ fontSize: "1.5rem", color: "#059669" }}
                ></i>
              </div>
              <div>
                <p
                  className="mb-1"
                  style={{ color: "#6B7280", fontSize: "0.875rem" }}
                >
                  Total Prestado
                </p>
                <p
                  className="m-0"
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#111827",
                  }}
                >
                  {formatCurrency(resumen.total_prestado)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm w-full">
            <div
              className="flex align-items-center gap-3"
              style={{ padding: "0.5rem" }}
            >
              <div
                style={{
                  backgroundColor: "#FEF3C7",
                  padding: "0.75rem",
                  borderRadius: "8px",
                }}
              >
                <i
                  className="pi pi-check-circle"
                  style={{ fontSize: "1.5rem", color: "#D97706" }}
                ></i>
              </div>
              <div>
                <p
                  className="mb-1"
                  style={{ color: "#6B7280", fontSize: "0.875rem" }}
                >
                  Total Recuperado
                </p>
                <p
                  className="m-0"
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#111827",
                  }}
                >
                  {formatCurrency(resumen.total_abonado)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm w-full">
            <div
              className="flex align-items-center gap-3"
              style={{ padding: "0.5rem" }}
            >
              <div
                style={{
                  backgroundColor: "#FEE2E2",
                  padding: "0.75rem",
                  borderRadius: "8px",
                }}
              >
                <i
                  className="pi pi-exclamation-triangle"
                  style={{ fontSize: "1.5rem", color: "#DC2626" }}
                ></i>
              </div>
              <div>
                <p
                  className="mb-1"
                  style={{ color: "#6B7280", fontSize: "0.875rem" }}
                >
                  Total en Mora
                </p>
                <p
                  className="m-0"
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#DC2626",
                  }}
                >
                  {formatCurrency(resumen.total_mora)}
                </p>
                <p
                  className="m-0 mt-1"
                  style={{ fontSize: "0.75rem", color: "#6B7280" }}
                >
                  {resumen.vencidos} vencidos
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabla - Vista Desktop */}
      <div className="hidden lg:block">
        <Card className="shadow-sm">
          <DataTable
            ref={dt}
            value={filteredPrestamos}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            dataKey="id"
            header={tableHeader}
            emptyMessage="No se encontraron préstamos."
            responsiveLayout="scroll"
            className="text-sm"
            loading={loading}
            selectionMode="single"
            onRowClick={(e) => handleVerDetalle(e.data as Prestamo)}
            rowClassName={() => "cursor-pointer hover:bg-gray-50"}
          >
            <Column
              field="id_socio.n_socio"
              header="Nº Socio"
              body={nSocioBodyTemplate}
              style={{ width: "8%" }}
              sortable
            />
            <Column
              field="id_socio.id_usuario.name"
              header="Socio"
              body={nombreBodyTemplate}
              style={{ minWidth: "180px" }}
              sortable
            />
            <Column
              field="monto_original"
              header="Monto"
              body={montoBodyTemplate}
              style={{ minWidth: "140px" }}
              sortable
            />
            <Column
              header="Progreso"
              body={progresoBodyTemplate}
              style={{ minWidth: "140px" }}
            />
            <Column
              header="Saldo"
              body={saldoBodyTemplate}
              style={{ minWidth: "120px" }}
            />
            <Column
              field="estatus"
              header="Estatus"
              body={estatusBodyTemplate}
              style={{ width: "10%" }}
              sortable
            />
            <Column
              field="dias_mora"
              header="Mora"
              body={moraBodyTemplate}
              style={{ width: "8%" }}
              sortable
            />
            <Column
              header=""
              body={accionesBodyTemplate}
              style={{ width: "5%" }}
            />
          </DataTable>
        </Card>
      </div>

      {/* Vista Mobile/Tablet */}
      <div className="lg:hidden">
        <Card className="shadow-sm">
          {/* Buscador y filtros mobile - buscador solo admin */}
          <div className="flex flex-column gap-3 mb-4">
            {isAdmin && (
              <span className="p-input-icon-left w-full">
                <i
                  className="pi pi-search"
                  style={{ display: "inline-block", marginLeft: "1rem" }}
                />
                <InputText
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Buscar por nombre o # de socio..."
                  className="w-full"
                  style={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    padding: "0.75rem 1rem 0.75rem 2.5rem",
                  }}
                />
              </span>
            )}
            {/* Filtros - visibles para ambos roles en mobile */}
            <div className="flex gap-2">
              <Dropdown
                value={estatusFilter}
                options={estatusOptions}
                onChange={(e) => setEstatusFilter(e.value)}
                placeholder="Estatus"
                className="flex-1"
              />
              <Dropdown
                value={moraFilter}
                options={moraOptions}
                onChange={(e) => setMoraFilter(e.value)}
                placeholder="Mora"
                className="flex-1"
              />
            </div>
            {isAdmin && (
              <Button
                label="Nuevo Préstamo"
                icon="pi pi-plus"
                onClick={() => setCreateDialogVisible(true)}
                className="w-full"
                style={{
                  backgroundColor: "#16a34a",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.75rem 1.5rem",
                  fontWeight: "600",
                }}
              />
            )}
          </div>

          {/* Lista de préstamos mobile */}
          {loading ? (
            <div className="text-center py-8" style={{ color: "#6c757d" }}>
              <i
                className="pi pi-spin pi-spinner mb-3"
                style={{ fontSize: "2rem" }}
              ></i>
              <p>Cargando préstamos...</p>
            </div>
          ) : filteredPrestamos.length === 0 ? (
            <div className="text-center py-8" style={{ color: "#6c757d" }}>
              <i
                className="pi pi-inbox mb-3"
                style={{ fontSize: "2.5rem" }}
              ></i>
              <p>No se encontraron préstamos.</p>
            </div>
          ) : (
            <div className="flex flex-column gap-3">
              {filteredPrestamos.map((prestamo) => {
                const saldo =
                  prestamo.monto_total -
                  prestamo.monto_abonado +
                  Number.parseFloat(String(prestamo.intereses_mora ?? "0"));
                const porcentaje =
                  (prestamo.monto_abonado / prestamo.monto_total) * 100;

                return (
                  <div
                    key={prestamo.id}
                    onClick={() => handleVerDetalle(prestamo)}
                    className="p-3 border-round cursor-pointer"
                    style={{
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div className="flex align-items-center gap-3 mb-3">
                      <div
                        className="flex align-items-center justify-content-center"
                        style={{
                          width: "2.5rem",
                          height: "2.5rem",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          fontSize: "0.875rem",
                          fontWeight: "bold",
                        }}
                      >
                        {prestamo.id_socio?.id_usuario?.name
                          ?.charAt(0)
                          .toUpperCase()}
                        {prestamo.id_socio?.id_usuario?.lastName
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p
                          className="m-0"
                          style={{ fontWeight: "600", color: "#111827" }}
                        >
                          {prestamo.id_socio?.id_usuario?.name}{" "}
                          {prestamo.id_socio?.id_usuario?.lastName}
                        </p>
                        <p
                          className="m-0 mt-1"
                          style={{ fontSize: "0.75rem", color: "#6b7280" }}
                        >
                          Socio #{prestamo.id_socio?.n_socio} •{" "}
                          {formatDate(prestamo.fecha_inicio)}
                        </p>
                      </div>
                      {getStatusBadge(prestamo.estatus)}
                    </div>

                    <div className="flex justify-content-between mb-2">
                      <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                        Monto: {formatCurrency(prestamo.monto_original)}
                      </span>
                      <span
                        style={{
                          fontWeight: "600",
                          color: "#dc2626",
                          fontSize: "0.875rem",
                        }}
                      >
                        Saldo: {formatCurrency(saldo)}
                      </span>
                    </div>

                    <ProgressBar
                      value={porcentaje}
                      showValue={false}
                      style={{ height: "0.5rem", marginBottom: "0.5rem" }}
                    />

                    <div className="flex justify-content-between">
                      <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                        {prestamo.cuotas_pagadas}/{prestamo.plazo_meses} cuotas
                      </span>
                      {prestamo.dias_mora > 0 && (
                        <span
                          style={{
                            color: "#dc2626",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                          }}
                        >
                          <i
                            className="pi pi-exclamation-triangle mr-1"
                            style={{ fontSize: "0.625rem" }}
                          ></i>
                          {prestamo.dias_mora} días de mora
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Dialog para crear préstamo */}
      <PrestamoForm
        visible={createDialogVisible}
        onHide={() => setCreateDialogVisible(false)}
        onSuccess={handleSuccess}
      />

      {/* Dialog para ver detalle */}
      <PrestamoDetalleDialog
        visible={detalleDialogVisible}
        onHide={() => {
          setDetalleDialogVisible(false);
          setSelectedPrestamoId(null);
        }}
        onSuccess={handleSuccess}
        prestamoId={selectedPrestamoId}
      />
    </div>
  );
};

export default PrestamosPage;
