"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/services/api";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import type { CajaSemanal, ResumenGeneral } from "@/types/CajaSemanal";
import AbonoSemanalForm from "@/components/AbonoSemanalForm/AbonoSemanalForm";
import AbonoSemanalUpdateForm from "@/components/AbonoSemanalForm/AbonoSemanalUpdateForm";

const AhorrosPage = () => {
  const toast = useRef<Toast>(null);
  const dt = useRef<DataTable<CajaSemanal[]>>(null);

  const [abonos, setAbonos] = useState<CajaSemanal[]>([]);
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [selectedAbono, setSelectedAbono] = useState<CajaSemanal | null>(null);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);

  // Cargar abonos y resumen
  const loadData = async () => {
    setLoading(true);
    try {
      const [abonosRes, resumenRes] = await Promise.all([
        api.get<CajaSemanal[]>("/caja-semanal"),
        api.get<ResumenGeneral>("/caja-semanal/resumen"),
      ]);
      setAbonos(abonosRes.data);
      setResumen(resumenRes.data);
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
    loadData();
  }, []);

  // Filtrar abonos por nombre o número de socio
  const filteredAbonos = abonos.filter((abono) => {
    if (!searchValue.trim()) return true;

    const searchLower = searchValue.toLowerCase();
    const fullName = `${abono.id_socio?.id_usuario?.name || ""} ${
      abono.id_socio?.id_usuario?.lastName || ""
    }`.toLowerCase();
    const nSocio = String(abono.id_socio?.n_socio || "").toLowerCase();

    return fullName.includes(searchLower) || nSocio.includes(searchLower);
  });

  // Formatear fecha dd-mm-yyyy
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  // Handler para click en fila
  const handleRowClick = (abono: CajaSemanal) => {
    setSelectedAbono(abono);
    setEditDialogVisible(true);
  };

  // Handler para éxito en operaciones
  const handleSuccess = () => {
    loadData();
  };

  // Header de la tabla
  const tableHeader = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between w-full">
      <h2 className="text-xl font-bold m-0">Registro de Abonos</h2>
      <div className="flex-1 flex justify-center" style={{ maxWidth: "500px" }}>
        <div className="w-full max-w-lg relative">
          <i
            className="pi pi-search absolute text-gray-500"
            style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <InputText
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar por nombre o # de socio..."
            className="w-full"
            style={{
              paddingLeft: "2.5rem",
              borderRadius: "8px",
              minWidth: 300,
            }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          label="Nuevo Abono"
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
    </div>
  );

  // Templates de columnas
  const nSocioBodyTemplate = (rowData: CajaSemanal) => {
    return (
      <span style={{ fontWeight: "600", color: "#374151" }}>
        #{rowData.id_socio?.n_socio}
      </span>
    );
  };

  const nombreBodyTemplate = (rowData: CajaSemanal) => {
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
  };

  const montoBodyTemplate = (rowData: CajaSemanal) => {
    return (
      <span style={{ fontWeight: "600", color: "#16a34a" }}>
        {formatCurrency(rowData.monto)}
      </span>
    );
  };

  const fechaBodyTemplate = (rowData: CajaSemanal) => {
    return (
      <span style={{ color: "#6b7280" }}>{formatDate(rowData.created_at)}</span>
    );
  };

  return (
    <div className="p-4 lg:p-6">
      <Toast ref={toast} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ahorros</h1>
        <p className="text-gray-600">
          Administra los abonos semanales de la caja de ahorro
        </p>
      </div>

      {/* Estadísticas */}
      <div className="flex flex-column lg:flex-row gap-3 mb-4">
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
                Total Ahorrado
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {loading
                  ? "..."
                  : formatCurrency(resumen?.total_ahorrado_general || 0)}
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
                backgroundColor: "#DBEAFE",
                padding: "0.75rem",
                borderRadius: "8px",
              }}
            >
              <i
                className="pi pi-list"
                style={{ fontSize: "1.5rem", color: "#2563EB" }}
              ></i>
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Total Abonos
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {loading ? "..." : resumen?.total_abonos_general || 0}
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
                backgroundColor: "#F3E8FF",
                padding: "0.75rem",
                borderRadius: "8px",
              }}
            >
              <i
                className="pi pi-chart-bar"
                style={{ fontSize: "1.5rem", color: "#9333EA" }}
              ></i>
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Promedio por Abono
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {loading
                  ? "..."
                  : formatCurrency(resumen?.promedio_general || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla - Vista Desktop */}
      <div className="hidden lg:block">
        <Card className="shadow-sm">
          <DataTable
            ref={dt}
            value={filteredAbonos}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            dataKey="id"
            header={tableHeader}
            emptyMessage="No se encontraron abonos."
            responsiveLayout="scroll"
            className="text-sm"
            loading={loading}
            selectionMode="single"
            onRowClick={(e) => handleRowClick(e.data as CajaSemanal)}
            rowClassName={() => "cursor-pointer hover:bg-gray-50"}
          >
            <Column
              field="id_socio.n_socio"
              header="Nº Socio"
              body={nSocioBodyTemplate}
              style={{ width: "10%" }}
              sortable
            />
            <Column
              field="id_socio.id_usuario.name"
              header="Nombre Completo"
              body={nombreBodyTemplate}
              style={{ minWidth: "200px" }}
              sortable
            />
            <Column
              field="monto"
              header="Monto del Abono"
              body={montoBodyTemplate}
              style={{ minWidth: "150px" }}
              sortable
            />
            <Column
              field="created_at"
              header="Fecha de Creación"
              body={fechaBodyTemplate}
              style={{ minWidth: "150px" }}
              sortable
            />
          </DataTable>
        </Card>
      </div>

      {/* Vista Mobile/Tablet */}
      <div className="lg:hidden">
        <Card className="shadow-sm">
          {/* Buscador mobile */}
          <div className="flex flex-column gap-3 mb-4">
            <div className="flex gap-2">
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
            </div>
            <Button
              label="Nuevo Abono"
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
          </div>

          {/* Lista de abonos mobile */}
          {loading ? (
            <div className="text-center py-8" style={{ color: "#6c757d" }}>
              <i
                className="pi pi-spin pi-spinner mb-3"
                style={{ fontSize: "2rem" }}
              ></i>
              <p>Cargando abonos...</p>
            </div>
          ) : filteredAbonos.length === 0 ? (
            <div className="text-center py-8" style={{ color: "#6c757d" }}>
              <i
                className="pi pi-inbox mb-3"
                style={{ fontSize: "2.5rem" }}
              ></i>
              <p>No se encontraron abonos.</p>
            </div>
          ) : (
            <div className="flex flex-column gap-3">
              {filteredAbonos.map((abono) => (
                <div
                  key={abono.id}
                  onClick={() => handleRowClick(abono)}
                  className="p-3 border-round cursor-pointer"
                  style={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div className="flex align-items-center gap-3">
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
                      {abono.id_socio?.id_usuario?.name
                        ?.charAt(0)
                        .toUpperCase()}
                      {abono.id_socio?.id_usuario?.lastName
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p
                        className="m-0"
                        style={{ fontWeight: "600", color: "#111827" }}
                      >
                        {abono.id_socio?.id_usuario?.name}{" "}
                        {abono.id_socio?.id_usuario?.lastName}
                      </p>
                      <p
                        className="m-0 mt-1"
                        style={{ fontSize: "0.75rem", color: "#6b7280" }}
                      >
                        Socio #{abono.id_socio?.n_socio} •{" "}
                        {formatDate(abono.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="m-0"
                        style={{
                          fontWeight: "bold",
                          fontSize: "1rem",
                          color: "#16a34a",
                        }}
                      >
                        {formatCurrency(abono.monto)}
                      </p>
                      <i
                        className="pi pi-chevron-right mt-1"
                        style={{ fontSize: "0.75rem", color: "#9ca3af" }}
                      ></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Dialog para crear abono */}
      <AbonoSemanalForm
        visible={createDialogVisible}
        onHide={() => setCreateDialogVisible(false)}
        onSuccess={handleSuccess}
      />

      {/* Dialog para editar abono */}
      <AbonoSemanalUpdateForm
        visible={editDialogVisible}
        onHide={() => {
          setEditDialogVisible(false);
          setSelectedAbono(null);
        }}
        onSuccess={handleSuccess}
        abono={selectedAbono}
      />
    </div>
  );
};

export default AhorrosPage;
