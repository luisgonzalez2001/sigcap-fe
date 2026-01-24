"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/services/api";
import { useUser } from "@/context/UserContext";
import type { Partner } from "@/types/Partner";
import type { AxiosError } from "axios";

// PrimeReact
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { Password } from "primereact/password";
import { Divider } from "primereact/divider";
import { Message } from "primereact/message";

const ProfilePage = () => {
  const { user, socioExtra, setUserUser } = useUser();
  const toast = useRef<Toast>(null);

  const [loading, setLoading] = useState(false);
  const [loadingPartner, setLoadingPartner] = useState(false);

  // Dialog states
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    name: "",
    lastName: "",
    phoneNumber: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Cargar datos del partner si es socio
  useEffect(() => {
    const loadPartnerData = async () => {
      if (!socioExtra?.id) return;
      try {
        setLoadingPartner(true);
        await api.get<Partner>(`/partners/${socioExtra.id}`);
      } catch (error) {
        console.error("Error al cargar datos del socio:", error);
      } finally {
        setLoadingPartner(false);
      }
    };

    if (user?.rol === "socio" && socioExtra?.id) {
      loadPartnerData();
    }
  }, [user, socioExtra]);

  const getUserInitials = () => {
    if (!user?.name) return "U";
    const firstName = user.name.charAt(0);
    const lastName = user.lastName?.charAt(0) || "";
    return `${firstName}${lastName}`.toUpperCase();
  };

  // Abrir dialog de edición
  const openEditDialog = () => {
    setEditForm({
      name: user?.name || "",
      lastName: user?.lastName || "",
      phoneNumber: user?.phoneNumber || "",
    });
    setEditDialogVisible(true);
  };

  // Guardar cambios de perfil
  const saveProfile = async () => {
    if (!user?.id) return;

    if (!editForm.name.trim() || !editForm.lastName.trim()) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Nombre y apellido son requeridos",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.put(`/users/${user.id}`, {
        name: editForm.name,
        lastName: editForm.lastName,
        phoneNumber: editForm.phoneNumber,
      });

      // Actualizar contexto y localStorage
      const updatedUser = { ...user, ...data };
      setUserUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Perfil actualizado correctamente",
        life: 3000,
      });
      setEditDialogVisible(false);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "Error al actualizar perfil",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir dialog de contraseña
  const openPasswordDialog = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordDialogVisible(true);
  };

  // Cambiar contraseña
  const changePassword = async () => {
    if (!user?.id) return;

    // Validaciones
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Completa todos los campos de contraseña",
        life: 3000,
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Las contraseñas no coinciden",
        life: 3000,
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "La contraseña debe tener al menos 6 caracteres",
        life: 3000,
      });
      return;
    }

    // Para socios, validar contraseña actual
    if (user.rol === "socio" && !passwordForm.currentPassword) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Ingresa tu contraseña actual",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      // Para socios, primero verificar la contraseña actual haciendo login
      if (user.rol === "socio") {
        try {
          await api.post("/auth/login", {
            email: user.email,
            password: passwordForm.currentPassword,
          });
        } catch {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "La contraseña actual es incorrecta",
            life: 3000,
          });
          setLoading(false);
          return;
        }
      }

      // Actualizar contraseña
      await api.put(`/users/${user.id}`, {
        password: passwordForm.newPassword,
      });

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Contraseña actualizada correctamente",
        life: 3000,
      });
      setPasswordDialogVisible(false);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "Error al cambiar contraseña",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-content-center align-items-center min-h-screen">
        <i className="pi pi-spin pi-spinner text-4xl"></i>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <Toast ref={toast} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">
          Administra tu información personal y configuración de cuenta
        </p>
      </div>

      <div className="grid">
        {/* Columna izquierda - Información del usuario */}
        <div className="col-12 lg:col-8">
          {/* Card de información principal */}
          <Card className="shadow-sm mb-4">
            <div className="flex flex-column md:flex-row align-items-center md:align-items-start gap-4">
              {/* Avatar grande */}
              <div className="flex flex-column align-items-center gap-2">
                <Avatar
                  label={getUserInitials()}
                  size="xlarge"
                  shape="circle"
                  className="text-white"
                  style={{
                    backgroundColor:
                      user.rol === "admin" ? "#9333EA" : "#2563EB",
                    width: "6rem",
                    height: "6rem",
                    fontSize: "2rem",
                  }}
                />
                <Button
                  label="Cambiar foto"
                  icon="pi pi-camera"
                  text
                  size="small"
                  disabled
                  tooltip="Próximamente"
                  tooltipOptions={{ position: "bottom" }}
                />
              </div>

              {/* Info del usuario */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold m-0 mb-2">
                  {user.name} {user.lastName}
                </h2>
                <div className="flex flex-wrap justify-content-center md:justify-content-start gap-2 mb-3">
                  <Tag
                    value={user.rol === "admin" ? "Administrador" : "Socio"}
                    severity={user.rol === "admin" ? "warning" : "info"}
                  />
                  {user.active !== undefined && (
                    <Tag
                      value={user.active ? "Activo" : "Inactivo"}
                      severity={user.active ? "success" : "danger"}
                    />
                  )}
                </div>

                <div className="flex flex-column gap-2 text-gray-600">
                  <div className="flex align-items-center justify-content-center md:justify-content-start gap-2">
                    <i className="pi pi-envelope" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex align-items-center justify-content-center md:justify-content-start gap-2">
                    <i className="pi pi-phone" />
                    <span>{user.phoneNumber || "Sin teléfono"}</span>
                  </div>
                </div>
              </div>

              {/* Botón de editar */}
              <Button
                label="Editar"
                icon="pi pi-pencil"
                outlined
                onClick={openEditDialog}
              />
            </div>
          </Card>

          {/* Card de seguridad */}
          <Card className="shadow-sm mb-4">
            <h3 className="text-xl font-semibold m-0 mb-4">
              <i className="pi pi-lock mr-2"></i>
              Seguridad
            </h3>

            <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3 p-3 border-round surface-100">
              <div>
                <p className="m-0 font-semibold">Contraseña</p>
                <p className="m-0 text-sm text-gray-500">
                  Última actualización: Desconocida
                </p>
              </div>
              <Button
                label="Cambiar contraseña"
                icon="pi pi-key"
                outlined
                size="small"
                onClick={openPasswordDialog}
              />
            </div>
          </Card>
        </div>

        {/* Columna derecha - Info de socio o card informativa */}
        <div className="col-12 lg:col-4">
          {user.rol === "socio" ? (
            socioExtra ? (
              // Card con información del socio
              <Card className="shadow-sm">
                <h3 className="text-xl font-semibold m-0 mb-4">
                  <i className="pi pi-id-card mr-2"></i>
                  Información de Socio
                </h3>

                {loadingPartner ? (
                  <div className="flex justify-content-center py-4">
                    <i className="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
                  </div>
                ) : (
                  <div className="flex flex-column gap-3">
                    <div className="flex justify-content-between align-items-center p-3 border-round surface-100">
                      <span className="text-gray-600">Número de Socio</span>
                      <span className="font-bold text-xl text-primary">
                        #{socioExtra.n_socio}
                      </span>
                    </div>

                    <div className="flex justify-content-between align-items-center p-3 border-round surface-100">
                      <span className="text-gray-600">Ahorro Semanal</span>
                      <span className="font-bold text-green-600">
                        {socioExtra.monto_semanal.toLocaleString("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        })}
                      </span>
                    </div>

                    <Divider className="my-2" />

                    <Message
                      severity="info"
                      text="Para modificar tu información de socio, contacta a un administrador."
                      className="w-full"
                    />
                  </div>
                )}
              </Card>
            ) : (
              // Card informativa - No asociado a socio
              <Card className="shadow-sm">
                <div className="text-center py-4">
                  <i
                    className="pi pi-user-minus text-5xl text-gray-300 mb-4"
                    style={{ display: "block" }}
                  ></i>
                  <h3 className="text-xl font-semibold m-0 mb-2 text-gray-700">
                    Sin asociación de socio
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Tu cuenta de usuario aún no está asociada a un número de
                    socio en la caja de ahorro.
                  </p>
                  <Button
                    label="Solicitar asociación"
                    icon="pi pi-send"
                    outlined
                    disabled
                    tooltip="Próximamente"
                    tooltipOptions={{ position: "bottom" }}
                  />
                </div>
              </Card>
            )
          ) : null}

          {/* Card de ayuda - visible para todos */}
          <Card className="shadow-sm mt-4">
            <h3 className="text-lg font-semibold m-0 mb-3">
              <i className="pi pi-question-circle mr-2"></i>
              ¿Necesitas ayuda?
            </h3>
            <p className="text-gray-600 text-sm m-0 mb-3">
              Si tienes problemas con tu cuenta o necesitas asistencia, contacta
              a un administrador.
            </p>
            <Button
              label="Contactar soporte"
              icon="pi pi-comments"
              text
              size="small"
              className="p-0"
              disabled
            />
          </Card>
        </div>
      </div>

      {/* Dialog de edición de perfil */}
      <Dialog
        visible={editDialogVisible}
        onHide={() => setEditDialogVisible(false)}
        header="Editar Perfil"
        style={{ width: "90vw", maxWidth: "450px" }}
        modal
        className="p-fluid"
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              outlined
              onClick={() => setEditDialogVisible(false)}
              disabled={loading}
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              onClick={saveProfile}
              loading={loading}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-4 pt-3">
          <div className="flex flex-column gap-2">
            <label htmlFor="edit-name" className="font-semibold">
              Nombre <span className="text-red-500">*</span>
            </label>
            <InputText
              id="edit-name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              placeholder="Tu nombre"
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="edit-lastName" className="font-semibold">
              Apellido <span className="text-red-500">*</span>
            </label>
            <InputText
              id="edit-lastName"
              value={editForm.lastName}
              onChange={(e) =>
                setEditForm({ ...editForm, lastName: e.target.value })
              }
              placeholder="Tu apellido"
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="edit-phone" className="font-semibold">
              Teléfono
            </label>
            <InputText
              id="edit-phone"
              value={editForm.phoneNumber}
              onChange={(e) =>
                setEditForm({ ...editForm, phoneNumber: e.target.value })
              }
              placeholder="Ej: 3312345678"
              keyfilter={/[\d+\-\s()]/}
            />
          </div>

          <Message
            severity="info"
            text="El correo electrónico no puede ser modificado."
            className="w-full"
          />
        </div>
      </Dialog>

      {/* Dialog de cambio de contraseña */}
      <Dialog
        visible={passwordDialogVisible}
        onHide={() => setPasswordDialogVisible(false)}
        header="Cambiar Contraseña"
        style={{ width: "90vw", maxWidth: "450px" }}
        modal
        className="p-fluid"
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              outlined
              onClick={() => setPasswordDialogVisible(false)}
              disabled={loading}
            />
            <Button
              label="Cambiar"
              icon="pi pi-check"
              onClick={changePassword}
              loading={loading}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-4 pt-3">
          {/* Solo mostrar campo de contraseña actual para socios */}
          {user.rol === "socio" && (
            <div className="flex flex-column gap-2">
              <label htmlFor="current-password" className="font-semibold">
                Contraseña actual <span className="text-red-500">*</span>
              </label>
              <Password
                id="current-password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Ingresa tu contraseña actual"
                toggleMask
                feedback={false}
                inputClassName="w-full"
              />
            </div>
          )}

          <div className="flex flex-column gap-2">
            <label htmlFor="new-password" className="font-semibold">
              Nueva contraseña <span className="text-red-500">*</span>
            </label>
            <Password
              id="new-password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
              placeholder="Ingresa tu nueva contraseña"
              toggleMask
              inputClassName="w-full"
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="confirm-password" className="font-semibold">
              Confirmar contraseña <span className="text-red-500">*</span>
            </label>
            <Password
              id="confirm-password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
              placeholder="Confirma tu nueva contraseña"
              toggleMask
              feedback={false}
              inputClassName="w-full"
            />
          </div>

          {user.rol === "admin" && (
            <Message
              severity="warn"
              text="Como administrador, no necesitas ingresar tu contraseña actual."
              className="w-full"
            />
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
