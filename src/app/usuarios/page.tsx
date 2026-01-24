"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { useUser } from "@/context/UserContext";
import type { UserWithRole, UpdateUserDto } from "@/types/UserDto";
import type { AxiosError } from "axios";

// PrimeReact
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { Password } from "primereact/password";
import { FilterMatchMode } from "primereact/api";
import type { DataTableFilterMeta } from "primereact/datatable";

const UsuariosPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const toast = useRef<Toast>(null);

  const [usuarios, setUsuarios] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  // Form state
  const [formData, setFormData] = useState<UpdateUserDto>({
    name: "",
    lastName: "",
    phoneNumber: "",
    password: "",
  });

  // Verificar que sea admin
  useEffect(() => {
    if (user && user.rol !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      // Cargar usuarios activos e inactivos
      const [activeRes, inactiveRes] = await Promise.all([
        api.get<UserWithRole[]>("/users"),
        api.get<UserWithRole[]>("/users/inactive"),
      ]);

      // Combinar ambas listas
      const allUsers = [...activeRes.data, ...inactiveRes.data];
      setUsuarios(allUsers);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "Error al cargar usuarios",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar usuarios
  useEffect(() => {
    if (user?.rol === "admin") {
      loadUsuarios();
    }
  }, [user, loadUsuarios]);

  const openEditDialog = (usuario: UserWithRole) => {
    setSelectedUser(usuario);
    setFormData({
      name: usuario.name,
      lastName: usuario.lastName,
      phoneNumber: usuario.phoneNumber,
      password: "",
    });
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      lastName: "",
      phoneNumber: "",
      password: "",
    });
  };

  const saveUser = async () => {
    if (!selectedUser) return;

    // Validaciones
    if (!formData.name?.trim() || !formData.lastName?.trim()) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Nombre y apellido son requeridos",
        life: 3000,
      });
      return;
    }

    try {
      const updateData: UpdateUserDto = {
        name: formData.name,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
      };

      // Solo incluir password si se especificó
      if (formData.password?.trim()) {
        updateData.password = formData.password;
      }

      await api.put(`/users/${selectedUser.id}`, updateData);

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Usuario actualizado correctamente",
        life: 3000,
      });

      await loadUsuarios();
      hideDialog();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "Error al actualizar usuario",
        life: 3000,
      });
    }
  };

  const toggleUserStatus = (usuario: UserWithRole) => {
    const action = usuario.active ? "desactivar" : "activar";
    const endpoint = usuario.active
      ? `/users/${usuario.id}/deactivate`
      : `/users/${usuario.id}/activate`;

    confirmDialog({
      message: `¿Estás seguro de que deseas ${action} a ${usuario.name} ${usuario.lastName}?`,
      header: `Confirmar ${action}`,
      icon: usuario.active
        ? "pi pi-exclamation-triangle"
        : "pi pi-check-circle",
      acceptClassName: usuario.active ? "p-button-danger" : "p-button-success",
      acceptLabel: "Sí",
      rejectLabel: "No",
      accept: async () => {
        try {
          await api.patch(endpoint);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: `Usuario ${action === "activar" ? "activado" : "desactivado"} correctamente`,
            life: 3000,
          });
          await loadUsuarios();
        } catch (error) {
          const err = error as AxiosError<{ message?: string }>;
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err.response?.data?.message || `Error al ${action} usuario`,
            life: 3000,
          });
        }
      },
    });
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const _filters = { ...filters };
    // @ts-expect-error filter value
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // Templates para la tabla
  const getUserInitials = (usuario: UserWithRole) => {
    const firstName = usuario.name?.charAt(0) || "";
    const lastName = usuario.lastName?.charAt(0) || "";
    return `${firstName}${lastName}`.toUpperCase();
  };

  const userTemplate = (rowData: UserWithRole) => (
    <div className="flex align-items-center gap-2">
      <Avatar
        label={getUserInitials(rowData)}
        shape="circle"
        className="text-white flex-shrink-0"
        style={{
          backgroundColor: rowData.rol === "admin" ? "#9333EA" : "#2563EB",
          width: "2rem",
          height: "2rem",
          fontSize: "0.75rem",
        }}
      />
      <div className="min-w-0">
        <p className="m-0 font-semibold text-sm">
          {rowData.name} {rowData.lastName}
        </p>
        <p className="m-0 text-xs text-gray-500 overflow-hidden text-overflow-ellipsis">
          {rowData.email}
        </p>
      </div>
    </div>
  );

  const phoneTemplate = (rowData: UserWithRole) => (
    <span>{rowData.phoneNumber || "Sin teléfono"}</span>
  );

  const rolTemplate = (rowData: UserWithRole) => (
    <Tag
      value={rowData.rol === "admin" ? "Admin" : "Socio"}
      severity={rowData.rol === "admin" ? "warning" : "info"}
    />
  );

  const statusTemplate = (rowData: UserWithRole) => (
    <Tag
      value={rowData.active ? "Activo" : "Inactivo"}
      severity={rowData.active ? "success" : "danger"}
    />
  );

  const verifiedTemplate = (rowData: UserWithRole) => (
    <Tag
      value={rowData.verified ? "Verificado" : "Pendiente"}
      severity={rowData.verified ? "success" : "warning"}
    />
  );

  const actionsTemplate = (rowData: UserWithRole) => (
    <div className="flex gap-1">
      <Button
        icon="pi pi-pencil"
        rounded
        text
        size="small"
        severity="info"
        onClick={() => openEditDialog(rowData)}
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon={rowData.active ? "pi pi-ban" : "pi pi-check"}
        rounded
        text
        size="small"
        severity={rowData.active ? "danger" : "success"}
        onClick={() => toggleUserStatus(rowData)}
        tooltip={rowData.active ? "Desactivar" : "Activar"}
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  // Header de la tabla con búsqueda estilizada
  const renderHeader = () => (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between w-full">
      <h2 className="text-xl font-bold m-0">Gestión de Usuarios</h2>
      <div className="flex-1 flex justify-content-center" style={{ maxWidth: "400px" }}>
        <div className="w-full relative">
          <i
            className="pi pi-search absolute text-gray-500"
            style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar usuario..."
            className="w-full"
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
      </div>
    </div>
  );

  // Mobile card view - layout mejorado
  const mobileCardTemplate = (usuario: UserWithRole) => (
    <Card className="mb-3 shadow-sm" key={usuario.id}>
      <div className="flex flex-column gap-3">
        {/* Header con avatar y nombre */}
        <div className="flex align-items-start gap-3">
          <Avatar
            label={getUserInitials(usuario)}
            shape="circle"
            size="large"
            className="text-white flex-shrink-0"
            style={{
              backgroundColor: usuario.rol === "admin" ? "#9333EA" : "#2563EB",
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="m-0 font-bold text-lg">
              {usuario.name} {usuario.lastName}
            </p>
            <p className="m-0 text-sm text-gray-500 overflow-hidden text-overflow-ellipsis">
              {usuario.email}
            </p>
          </div>
        </div>

        {/* Tags de estado */}
        <div className="flex flex-wrap gap-2">
          <Tag
            value={usuario.rol === "admin" ? "Admin" : "Socio"}
            severity={usuario.rol === "admin" ? "warning" : "info"}
          />
          <Tag
            value={usuario.active ? "Activo" : "Inactivo"}
            severity={usuario.active ? "success" : "danger"}
          />
          <Tag
            value={usuario.verified ? "Verificado" : "Pendiente"}
            severity={usuario.verified ? "success" : "warning"}
          />
        </div>

        {/* Teléfono */}
        <div className="flex align-items-center gap-2 text-gray-600">
          <i className="pi pi-phone" />
          <span>{usuario.phoneNumber || "Sin teléfono"}</span>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 pt-2 border-top-1 surface-border">
          <Button
            label="Editar"
            icon="pi pi-pencil"
            size="small"
            outlined
            severity="info"
            className="flex-1"
            onClick={() => openEditDialog(usuario)}
          />
          <Button
            label={usuario.active ? "Desactivar" : "Activar"}
            icon={usuario.active ? "pi pi-ban" : "pi pi-check"}
            size="small"
            outlined
            severity={usuario.active ? "danger" : "success"}
            className="flex-1"
            onClick={() => toggleUserStatus(usuario)}
          />
        </div>
      </div>
    </Card>
  );

  if (!user || user.rol !== "admin") {
    return null;
  }

  return (
    <div className="p-4 lg:p-6" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuarios</h1>
        <p className="text-gray-600">
          Administra todos los usuarios del sistema
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
                backgroundColor: "#DBEAFE",
                padding: "0.75rem",
                borderRadius: "8px",
              }}
            >
              <i
                className="pi pi-users"
                style={{ fontSize: "1.5rem", color: "#2563EB" }}
              ></i>
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Total Usuarios
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {usuarios.length}
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
                backgroundColor: "#DCFCE7",
                padding: "0.75rem",
                borderRadius: "8px",
              }}
            >
              <i
                className="pi pi-check-circle"
                style={{ fontSize: "1.5rem", color: "#16A34A" }}
              ></i>
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Usuarios Activos
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {usuarios.filter((u) => u.active).length}
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
                className="pi pi-shield"
                style={{ fontSize: "1.5rem", color: "#9333EA" }}
              ></i>
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Administradores
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {usuarios.filter((u) => u.rol === "admin").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla - Vista Desktop */}
      <div className="hidden lg:block">
        <Card className="shadow-sm">
          <DataTable
            value={usuarios}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            dataKey="id"
            filters={filters}
            loading={loading}
            globalFilterFields={["name", "lastName", "email", "phoneNumber"]}
            header={renderHeader()}
            emptyMessage="No se encontraron usuarios"
            className="p-datatable-sm"
          >
            <Column
              header="Usuario"
              body={userTemplate}
              sortable
              sortField="name"
            />
            <Column header="Teléfono" body={phoneTemplate} />
            <Column header="Rol" body={rolTemplate} sortable sortField="rol" />
            <Column
              header="Estado"
              body={statusTemplate}
              sortable
              sortField="active"
            />
            <Column
              header="Verificación"
              body={verifiedTemplate}
              sortable
              sortField="verified"
            />
            <Column
              header="Acciones"
              body={actionsTemplate}
              style={{ width: "8rem" }}
            />
          </DataTable>
        </Card>
      </div>

      {/* Cards - Vista Mobile */}
      <div className="lg:hidden">
        <div className="mb-4 relative">
          <i
            className="pi pi-search absolute text-gray-500"
            style={{ left: "12px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}
          />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar usuario..."
            className="w-full"
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>

        {loading ? (
          <div className="flex justify-content-center py-6">
            <i className="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
          </div>
        ) : usuarios.length === 0 ? (
          <Card className="text-center py-6">
            <i className="pi pi-users text-4xl text-gray-400 mb-3"></i>
            <p className="text-gray-500">No se encontraron usuarios</p>
          </Card>
        ) : (
          usuarios
            .filter((u) => {
              if (!globalFilterValue) return true;
              const search = globalFilterValue.toLowerCase();
              return (
                u.name?.toLowerCase().includes(search) ||
                u.lastName?.toLowerCase().includes(search) ||
                u.email?.toLowerCase().includes(search) ||
                u.phoneNumber?.includes(search)
              );
            })
            .map((usuario) => mobileCardTemplate(usuario))
        )}
      </div>

      {/* Dialog de edición */}
      <Dialog
        visible={dialogVisible}
        onHide={hideDialog}
        header={`Editar Usuario: ${selectedUser?.name} ${selectedUser?.lastName}`}
        style={{ width: "90vw", maxWidth: "500px" }}
        modal
        className="p-fluid"
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              outlined
              onClick={hideDialog}
            />
            <Button label="Guardar" icon="pi pi-check" onClick={saveUser} />
          </div>
        }
      >
        <div className="flex flex-column gap-4 pt-3">
          <div className="flex flex-column gap-2">
            <label htmlFor="name" className="font-semibold">
              Nombre
            </label>
            <InputText
              id="name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nombre"
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="lastName" className="font-semibold">
              Apellido
            </label>
            <InputText
              id="lastName"
              value={formData.lastName || ""}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Apellido"
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="phoneNumber" className="font-semibold">
              Teléfono
            </label>
            <InputText
              id="phoneNumber"
              value={formData.phoneNumber || ""}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="Ej: +523312345678"
              keyfilter={/[\d+\-\s()]/}
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="password" className="font-semibold">
              Nueva Contraseña{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <Password
              id="password"
              value={formData.password || ""}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Dejar vacío para no cambiar"
              toggleMask
              feedback={false}
              inputClassName="w-full"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default UsuariosPage;
