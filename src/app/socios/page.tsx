"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/services/api";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Card } from "primereact/card";
import { Toolbar } from "primereact/toolbar";
import { FilterMatchMode } from "primereact/api";
import { Partner } from "@/types/Partner";
import { CreateUserDto, User } from "@/types/UserDto";
import type { AxiosError } from "axios";
import type { DataTableFilterMeta } from "primereact/datatable";
import PartnerForm from "@/components/PartnerForm/PartnerForm";
import { totalMontoSemanal } from "@/utils/formulas";

const SociosPage = () => {
  const toast = useRef<Toast>(null);
  const dt = useRef<DataTable<Partner[]>>(null);

  const [socios, setSocios] = useState<Partner[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    id_usuario: { value: null, matchMode: FilterMatchMode.EQUALS },
  });
  const [formData, setFormData] = useState({
    id_usuario: "",
    monto_semanal: 0,
  });
  const [crearUsuario, setCrearUsuario] = useState(false);
  const [userForm, setUserForm] = useState<CreateUserDto>({
    email: "",
    password: "",
    name: "",
    lastName: "",
    phoneNumber: "",
  });

  useEffect(() => {
    api.get("/partners").then((res) => setSocios(res.data));
    api
      .get("/partners/available-users")
      .then((res) => setUsuarios(Array.isArray(res.data) ? res.data : []));
  }, []);

  // Handlers
  const openNew = () => {
    setFormData({ id_usuario: "", monto_semanal: 0 });
    setUserForm({
      email: "",
      password: "",
      name: "",
      lastName: "",
      phoneNumber: "",
    });
    setCrearUsuario(false);
    setIsEditing(false);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setFormData({ id_usuario: "", monto_semanal: 0 });
    setUserForm({
      email: "",
      password: "",
      name: "",
      lastName: "",
      phoneNumber: "",
    });
    setCrearUsuario(false);
  };

  const saveSocio = async () => {
    if (crearUsuario) {
      // Validar campos de usuario
      if (!userForm.email || !userForm.name || !userForm.lastName) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Completa los datos del usuario",
          life: 3000,
        });
        return;
      }
      try {
        // Establece la contraseña por default
        const userRes = await api.post("/auth/signup", {
          ...userForm,
          password: "12345",
        });
        const userId = userRes.data.id;
        await api.post("/partners", {
          id_usuario: userId,
          monto_semanal: formData.monto_semanal,
        });
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Socio y usuario creados",
          life: 3000,
        });
        // Recargar socios
        const sociosRes = await api.get("/partners");
        setSocios(sociosRes.data);
        hideDialog();
      } catch (error) {
        const err = error as AxiosError<{ message?: string }>;
        let detail =
          err.response?.data?.message || "Error al crear socio/usuario";
        if (err.response?.status === 409 && detail) {
          if (detail.includes("correo electrónico")) {
            detail =
              "El correo electrónico ya está registrado. Por favor, usa otro.";
          } else if (detail.includes("teléfono")) {
            detail =
              "El número de teléfono ya está registrado. Por favor, usa otro.";
          }
        }
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail,
          life: 4000,
        });
      }
    } else {
      if (!formData.id_usuario || !formData.monto_semanal) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Selecciona usuario y monto semanal",
          life: 3000,
        });
        return;
      }
      try {
        await api.post("/partners", formData);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Socio creado",
          life: 3000,
        });
        const sociosRes = await api.get("/partners");
        setSocios(sociosRes.data);
        hideDialog();
      } catch (error) {
        const err = error as AxiosError<{ message?: string }>;
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: err.response?.data?.message || "Error al crear socio",
          life: 3000,
        });
      }
    }
  };

  // Toolbar
  const leftToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <Button
          label="Nuevo Socio"
          icon="pi pi-plus"
          severity="success"
          onClick={openNew}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <Button
        label="Exportar"
        icon="pi pi-upload"
        className="p-button-help"
        onClick={() => dt.current?.exportCSV()}
      />
    );
  };

  // Header de la tabla con búsqueda
  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h2 className="text-xl font-bold m-0">Gestión de Socios</h2>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
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
          className="w-full sm:w-auto"
        />
      </span>
    </div>
  );

  return (
    <div className="p-4 lg:p-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Socios</h1>
        <p className="text-gray-600">
          Administra todos los socios de la caja de ahorro
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <i className="pi pi-users text-2xl text-blue-600"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Socios</p>
              <p className="text-2xl font-bold text-gray-900">
                {socios.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <i className="pi pi-wallet text-2xl text-purple-600"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Ahorro Semanal Total</p>
              <p className="text-xl font-bold text-gray-900">
                {totalMontoSemanal(socios).toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla */}
      <Card className="shadow-sm">
        <Toolbar
          className="mb-4"
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
        />

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
          className="text-sm"
        >
          <Column field="id" header="ID" sortable style={{ width: "10%" }} />
          <Column
            field="id_usuario"
            header="Usuario"
            body={(row) => {
              const user = row.id_usuario;
              if (user) {
                return `${user.name} ${user.lastName} (${user.email})`;
              }
              return "";
            }}
            style={{ minWidth: "200px" }}
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
            style={{ minWidth: "150px" }}
          />
        </DataTable>
      </Card>

      {/* Dialog para crear/editar */}
      <PartnerForm
        visible={dialogVisible}
        isEditing={isEditing}
        crearUsuario={crearUsuario}
        setCrearUsuario={setCrearUsuario}
        formData={formData}
        setFormData={setFormData}
        userForm={userForm}
        setUserForm={setUserForm}
        usuarios={usuarios}
        onHide={hideDialog}
        onSave={saveSocio}
      />
    </div>
  );
};

export default SociosPage;
