"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/services/api";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Card } from "primereact/card";
import { FilterMatchMode } from "primereact/api";
import { Partner } from "@/types/Partner";
import { CreateUserDto, User } from "@/types/UserDto";
import type { AxiosError } from "axios";
import type { DataTable, DataTableFilterMeta } from "primereact/datatable";
import PartnerForm from "@/components/PartnerForm/PartnerForm";
import { totalMontoSemanal } from "@/utils/formulas";
import SociosTable from "@/components/Dashboard/SociosTable";
import SociosCarousel from "@/components/Dashboard/SociosCarousel";
import type { ResumenGeneral, ResumenSocio } from "@/types/CajaSemanal";

const SociosPage = () => {
  const toast = useRef<Toast>(null);
  const dt = useRef<DataTable<Partner[]>>(null);

  const [socios, setSocios] = useState<Partner[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [resumenPorSocio, setResumenPorSocio] = useState<
    Map<number, ResumenSocio>
  >(new Map());
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    id_usuario: { value: null, matchMode: FilterMatchMode.EQUALS },
  });
  const [formData, setFormData] = useState<{
    id_usuario: string;
    monto_semanal: number;
    id?: string;
    antiguedad?: string;
  }>({
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
    // Cargar socios
    api.get("/partners").then((res) => setSocios(res.data));

    // Cargar usuarios disponibles (sin rol admin)
    api
      .get("/partners/available-users")
      .then((res) =>
        setUsuarios(
          Array.isArray(res.data)
            ? res.data.filter(
                (u: import("@/types/UserDto").User) => u.rol !== "admin",
              )
            : [],
        ),
      );

    // Cargar resumen de caja semanal para obtener semanas dadas y total ahorrado
    api
      .get<ResumenGeneral>("/caja-semanal/resumen")
      .then((res) => {
        const mapa = new Map<number, ResumenSocio>();
        res.data.detalle_por_socio?.forEach((detalle) => {
          if (detalle.n_socio !== null) {
            mapa.set(detalle.n_socio, detalle);
          }
        });
        setResumenPorSocio(mapa);
      })
      .catch((err) => {
        console.error("Error al cargar resumen:", err);
      });
  }, []);

  // Handlers
  const openNew = () => {
    setFormData({ id_usuario: "", monto_semanal: 0, antiguedad: undefined });
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
    setFormData({ id_usuario: "", monto_semanal: 0, antiguedad: undefined });
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
    if (isEditing) {
      // Modo edición: Solo actualizar el monto_semanal
      if (!formData.monto_semanal || !formData.id) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Datos incompletos",
          life: 3000,
        });
        return;
      }
      try {
        const updatePayload: { monto_semanal: number; antiguedad?: string } = {
          monto_semanal: formData.monto_semanal,
        };
        if (formData.antiguedad) {
          updatePayload.antiguedad = formData.antiguedad;
        }
        await api.patch(`/partners/${formData.id}`, updatePayload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Socio actualizado",
          life: 3000,
        });
        // Recargar socios
        const sociosRes = await api.get("/partners");
        setSocios(sociosRes.data);
        hideDialog();
      } catch (error) {
        const err = error as AxiosError<{ message?: string }>;
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: err.response?.data?.message || "Error al actualizar socio",
          life: 3000,
        });
      }
    } else if (crearUsuario) {
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
        await api.post("/auth/signup/add-user", {
          ...userForm,
          password: "12345678",
        });

        // Buscar el usuario recién creado por email — reintentar hasta 5 veces
        // con espera incremental para dar tiempo al backend de persistir el registro
        let createdUser: import("@/types/UserDto").User | undefined;
        for (let attempt = 1; attempt <= 5; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 400));
          const availableRes = await api.get<import("@/types/UserDto").User[]>(
            "/partners/available-users",
          );
          createdUser = availableRes.data.find(
            (u) => u.email === userForm.email,
          );
          if (createdUser?.id) break;
        }

        if (!createdUser?.id) {
          throw new Error("No se pudo obtener el ID del usuario creado.");
        }

        const userId = createdUser.id;

        const createPayload: {
          id_usuario: string;
          monto_semanal: number;
          antiguedad?: string;
        } = {
          id_usuario: userId,
          monto_semanal: formData.monto_semanal,
        };
        if (formData.antiguedad) {
          createPayload.antiguedad = formData.antiguedad;
        }
        await api.post("/partners", createPayload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Socio y usuario creados",
          life: 3000,
        });
        // Recargar socios y usuarios disponibles
        const [sociosRes, usuariosRes] = await Promise.all([
          api.get("/partners"),
          api.get("/partners/available-users"),
        ]);
        setSocios(sociosRes.data);
        setUsuarios(
          Array.isArray(usuariosRes.data)
            ? usuariosRes.data.filter(
                (u: import("@/types/UserDto").User) => u.rol !== "admin",
              )
            : [],
        );
        hideDialog();
      } catch (error) {
        const err = error as AxiosError<{ message?: string | string[] }>;
        const rawMessage = err.response?.data?.message;
        let detail: string;
        if (Array.isArray(rawMessage)) {
          detail = rawMessage.join("\n");
        } else {
          detail = rawMessage || "Error al crear socio/usuario";
        }
        if (err.response?.status === 409) {
          if (
            typeof detail === "string" &&
            detail.includes("correo electrónico")
          ) {
            detail =
              "El correo electrónico ya está registrado. Por favor, usa otro.";
          } else if (
            typeof detail === "string" &&
            detail.includes("teléfono")
          ) {
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
        const createPayload: {
          id_usuario: string;
          monto_semanal: number;
          antiguedad?: string;
        } = {
          id_usuario: formData.id_usuario,
          monto_semanal: formData.monto_semanal,
        };
        if (formData.antiguedad) {
          createPayload.antiguedad = formData.antiguedad;
        }
        await api.post("/partners", createPayload);
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
                Total Socios
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {socios.length}
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
                className="pi pi-wallet"
                style={{ fontSize: "1.5rem", color: "#9333EA" }}
              ></i>
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Ahorro Semanal Total
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {totalMontoSemanal(socios).toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla - Vista Desktop */}
      <div className="hidden lg:block">
        <SociosTable
          socios={socios}
          onEdit={(partner) => {
            setIsEditing(true);
            setFormData({
              id: partner.id,
              id_usuario: partner.id_usuario.id,
              monto_semanal: partner.monto_semanal,
              antiguedad: partner.antiguedad,
            });
            setUserForm({
              email: partner.id_usuario.email,
              name: partner.id_usuario.name,
              lastName: partner.id_usuario.lastName,
              phoneNumber: partner.id_usuario.phoneNumber,
              password: "", // No se edita aquí
            });
            setDialogVisible(true);
          }}
          onNew={openNew}
          filters={filters}
          setFilters={setFilters}
          globalFilterValue={globalFilterValue}
          setGlobalFilterValue={setGlobalFilterValue}
          resumenPorSocio={resumenPorSocio}
          //@ts-expect-error posible null
          dt={dt}
        />
      </div>

      {/* Carousel - Vista Mobile/Tablet */}
      <div className="lg:hidden">
        <SociosCarousel
          socios={socios}
          onNew={openNew}
          onEdit={(partner) => {
            setIsEditing(true);
            setFormData({
              id: partner.id,
              id_usuario: partner.id_usuario.id,
              monto_semanal: partner.monto_semanal,
              antiguedad: partner.antiguedad,
            });
            setUserForm({
              email: partner.id_usuario.email,
              name: partner.id_usuario.name,
              lastName: partner.id_usuario.lastName,
              phoneNumber: partner.id_usuario.phoneNumber,
              password: "", // No se edita aquí
            });
            setDialogVisible(true);
          }}
          resumenPorSocio={resumenPorSocio}
        />
      </div>

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
