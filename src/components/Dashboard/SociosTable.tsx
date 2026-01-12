import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import type { Partner } from "@/types/Partner";
import type { ResumenSocio } from "@/types/CajaSemanal";

interface SociosTableProps {
  socios: Partner[];
  onEdit: (partner: Partner) => void;
  onNew: () => void;
  filters: import("primereact/datatable").DataTableFilterMeta;
  setFilters: (
    filters: import("primereact/datatable").DataTableFilterMeta
  ) => void;
  globalFilterValue: string;
  setGlobalFilterValue: (val: string) => void;
  dt: React.RefObject<DataTable<Partner[]>>;
  // Mapa de resumen por n_socio para mostrar semanas dadas y total ahorrado
  resumenPorSocio?: Map<number, ResumenSocio>;
}

const SociosTable = ({
  socios,
  onEdit,
  onNew,
  filters,
  setFilters,
  globalFilterValue,
  setGlobalFilterValue,
  dt,
  resumenPorSocio,
}: SociosTableProps) => {
  // Función para obtener semanas dadas (número de abonos) de un socio
  const getSemanasDadas = (nSocio: number): number => {
    if (!resumenPorSocio) return 0;
    const resumen = resumenPorSocio.get(nSocio);
    return resumen?.numero_abonos ?? 0;
  };

  // Función para obtener total ahorrado de un socio
  const getTotalAhorrado = (nSocio: number): number => {
    if (!resumenPorSocio) return 0;
    const resumen = resumenPorSocio.get(nSocio);
    return resumen?.total_ahorrado ?? 0;
  };

  // Header de la tabla con búsqueda y acciones
  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between w-full">
      <h2 className="text-xl font-bold m-0">Gestión de Socios</h2>
      <div className="flex-1 flex justify-center" style={{ maxWidth: "500px" }}>
        <div className="w-full max-w-lg relative">
          <i
            className="pi pi-search absolute text-gray-500"
            style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            value={globalFilterValue}
            onChange={(e) => {
              const value = e.target.value;
              const _filters = { ...filters };
              if ("value" in _filters["global"]) {
                (_filters["global"] as { value: string | null }).value = value;
              }
              setFilters(_filters);
              setGlobalFilterValue(value);
            }}
            placeholder="Buscar..."
            className="w-full pl-5 pr-3 py-2 border rounded text-base"
            style={{ minWidth: 300 }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          label="Nuevo Socio"
          icon="pi pi-plus"
          severity="success"
          onClick={onNew}
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

  return (
    <Card className="shadow-sm">
      <DataTable
        ref={dt}
        value={socios}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        dataKey="id"
        filters={filters}
        globalFilterFields={["id_usuario"]}
        header={header}
        emptyMessage="No se encontraron socios."
        responsiveLayout="scroll"
        className="text-sm"
      >
        <Column
          field="id"
          header="Nº Socio"
          body={(_, { rowIndex }) => rowIndex + 1}
          style={{ width: "8%" }}
        />
        <Column
          field="id_usuario"
          header="Nombre"
          body={(row) =>
            row.id_usuario
              ? `${row.id_usuario.name} ${row.id_usuario.lastName}`
              : ""
          }
          style={{ minWidth: "180px" }}
        />
        <Column
          field="id_usuario.phoneNumber"
          header="Celular"
          body={(row) => row.id_usuario?.phoneNumber || ""}
          style={{ minWidth: "120px" }}
        />
        <Column
          field="monto_semanal"
          header="Monto Semanal"
          body={(row) =>
            row.monto_semanal.toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })
          }
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="semanas_dadas"
          header="Semanas Dadas"
          body={(row: Partner) => getSemanasDadas(row.n_socio)}
          style={{ minWidth: "120px" }}
        />
        <Column
          field="total_ahorrado"
          header="Total Ahorrado"
          body={(row: Partner) =>
            getTotalAhorrado(row.n_socio).toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })
          }
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Editar"
          body={(row) => (
            <Button
              icon="pi pi-pencil"
              rounded
              text
              severity="info"
              onClick={() => onEdit(row)}
              aria-label="Editar"
            />
          )}
          style={{ minWidth: "80px" }}
        />
      </DataTable>
    </Card>
  );
};

export default SociosTable;
