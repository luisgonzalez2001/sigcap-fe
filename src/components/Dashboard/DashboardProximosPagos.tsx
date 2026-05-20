"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Badge } from "primereact/badge";
import type { ProximoPago } from "@/types/Dashboard";
import { formatCurrency, formatDate } from "./utils/dashboard.utils";

interface Props {
  pagos: ProximoPago[];
  showSocio?: boolean;
}

const DashboardProximosPagos = ({ pagos, showSocio = true }: Props) => {
  const socioTemplate = (rowData: ProximoPago) => {
    const partes = rowData.socio.nombre.trim().split(" ");
    // Iniciales: primera letra del primer y tercer token (nombre + apellido paterno)
    const iniciales = [partes[0]?.[0], partes[2]?.[0] ?? partes[1]?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase();

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
            fontSize: "0.625rem",
            fontWeight: "bold",
            flexShrink: 0,
          }}
        >
          {iniciales}
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            className="m-0"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              whiteSpace: "normal",
              lineHeight: "1.2",
            }}
          >
            {rowData.socio.nombre}
          </p>
          <p className="m-0" style={{ fontSize: "0.75rem", color: "#6B7280" }}>
            Socio #{rowData.socio.n_socio}
          </p>
        </div>
      </div>
    );
  };

  const montoCuotaTemplate = (rowData: ProximoPago) => (
    <span style={{ fontWeight: 600, color: "#111827" }}>
      {formatCurrency(rowData.montoCuota)}
    </span>
  );

  const fechaTemplate = (rowData: ProximoPago) => (
    <span style={{ color: "#6B7280", fontSize: "0.875rem" }}>
      {formatDate(rowData.fechaProximoPago)}
    </span>
  );

  const diasTemplate = (rowData: ProximoPago) => {
    const severity =
      rowData.diasRestantes <= 3
        ? "danger"
        : rowData.diasRestantes <= 7
          ? "warning"
          : "info";
    return (
      <Badge
        value={
          rowData.diasRestantes <= 0 ? "Vencido" : `${rowData.diasRestantes}d`
        }
        severity={severity}
      />
    );
  };

  if (pagos.length === 0) {
    return (
      <div className="text-center py-6" style={{ color: "#6B7280" }}>
        <i
          className="pi pi-check-circle mb-3"
          style={{ fontSize: "2rem", color: "#059669" }}
        />
        <p>No hay pagos próximos</p>
      </div>
    );
  }

  return (
    <DataTable
      value={pagos}
      paginator
      rows={5}
      className="text-sm"
      responsiveLayout="scroll"
    >
      {showSocio && (
        <Column
          header="Socio"
          body={socioTemplate}
          style={{ minWidth: "150px" }}
        />
      )}
      <Column
        header="Cuota"
        body={montoCuotaTemplate}
        style={{ minWidth: "100px" }}
      />
      <Column
        header="Fecha"
        body={fechaTemplate}
        style={{ minWidth: "120px" }}
      />
      <Column header="Días" body={diasTemplate} style={{ width: "80px" }} />
    </DataTable>
  );
};

export default DashboardProximosPagos;
