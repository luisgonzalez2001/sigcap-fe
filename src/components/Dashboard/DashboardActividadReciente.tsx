"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import type { ActividadReciente } from "@/types/Dashboard";
import {
  formatCurrency,
  formatDateTime,
  getActividadConfig,
  mapDescripcion,
} from "./utils/dashboard.utils";

interface Props {
  actividad: ActividadReciente[];
}

const DashboardActividadReciente = ({ actividad }: Props) => {
  const actividadBodyTemplate = (rowData: ActividadReciente) => {
    const config = getActividadConfig(rowData.tipo);
    const descripcion = mapDescripcion(rowData.descripcion);
    return (
      <div className="flex align-items-center gap-3">
        <div
          className="flex align-items-center justify-content-center"
          style={{
            minWidth: "2rem",
            width: "2rem",
            height: "2rem",
            borderRadius: "50%",
            backgroundColor: config.bgColor,
            flexShrink: 0,
          }}
        >
          <i
            className={`pi ${config.icon}`}
            style={{ color: config.color, fontSize: "0.875rem" }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <p className="m-0" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            {descripcion}
          </p>
          <p className="m-0" style={{ fontSize: "0.75rem", color: "#6B7280" }}>
            {rowData.socio.nombre}
          </p>
        </div>
      </div>
    );
  };

  const montoTemplate = (rowData: ActividadReciente) =>
    rowData.monto ? (
      <span style={{ fontWeight: 600, color: "#111827" }}>
        {formatCurrency(rowData.monto)}
      </span>
    ) : (
      <span style={{ color: "#6B7280" }}>-</span>
    );

  const fechaTemplate = (rowData: ActividadReciente) => (
    <span style={{ color: "#6B7280", fontSize: "0.75rem" }}>
      {formatDateTime(rowData.fecha)}
    </span>
  );

  if (actividad.length === 0) {
    return (
      <div className="text-center py-6" style={{ color: "#6B7280" }}>
        <i className="pi pi-inbox mb-3" style={{ fontSize: "2rem" }} />
        <p>No hay actividad reciente</p>
      </div>
    );
  }

  return (
    <DataTable
      value={actividad}
      paginator
      rows={5}
      className="text-sm"
      responsiveLayout="scroll"
    >
      <Column
        header="Actividad"
        body={actividadBodyTemplate}
        style={{ minWidth: "180px" }}
      />
      <Column
        header="Monto"
        body={montoTemplate}
        style={{ minWidth: "90px" }}
      />
      <Column
        header="Fecha"
        body={fechaTemplate}
        style={{ minWidth: "130px" }}
      />
    </DataTable>
  );
};

export default DashboardActividadReciente;
