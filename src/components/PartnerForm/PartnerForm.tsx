import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import type { CreateUserDto, User as Usuario } from "@/types/UserDto";

interface PartnerFormProps {
  visible: boolean;
  isEditing: boolean;
  crearUsuario: boolean;
  setCrearUsuario: (val: boolean) => void;
  formData: {
    id_usuario: string;
    monto_semanal: number;
    id?: string;
    antiguedad?: string;
  };
  setFormData: (val: {
    id_usuario: string;
    monto_semanal: number;
    id?: string;
    antiguedad?: string;
  }) => void;
  userForm: CreateUserDto;
  setUserForm: (val: CreateUserDto) => void;
  usuarios: Usuario[];
  onHide: () => void;
  onSave: () => Promise<void>;
  loading?: boolean;
}

// Validaciones
const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) => /^\d{10}$/.test(phone);
const validateName = (val: string) => val.trim().length >= 3;

const PartnerForm = ({
  visible,
  isEditing,
  crearUsuario,
  setCrearUsuario,
  formData,
  setFormData,
  userForm,
  setUserForm,
  usuarios,
  onHide,
  onSave,
  loading = false,
}: PartnerFormProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredUsuarios = usuarios.filter((u) => {
    if (!searchValue.trim()) return true;
    const fullName = `${u.name} ${u.lastName}`.toLowerCase();
    return fullName.includes(searchValue.toLowerCase());
  });

  useEffect(() => {
    if (!visible) {
      setSearchValue("");
      setErrors({});
    }
  }, [visible]);

  const selectedUser = usuarios.find((u) => u.id === formData.id_usuario);

  const validateAndSave = async () => {
    const newErrors: Record<string, string> = {};

    if (crearUsuario && !isEditing) {
      if (!validateName(userForm.name))
        newErrors.name = "El nombre debe tener al menos 3 caracteres.";
      if (!validateName(userForm.lastName))
        newErrors.lastName = "El apellido debe tener al menos 3 caracteres.";
      if (!validateEmail(userForm.email))
        newErrors.email = "Ingresa un correo electrónico válido.";
      if (userForm.phoneNumber && !validatePhone(userForm.phoneNumber))
        newErrors.phoneNumber =
          "El teléfono debe tener exactamente 10 dígitos.";
    }

    if (!isEditing && formData.monto_semanal < 50) {
      newErrors.monto_semanal = "El monto semanal mínimo es $50.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSave();
  };

  const fieldError = (field: string) =>
    errors[field] ? (
      <small className="p-error" style={{ color: "#ef4444" }}>
        {errors[field]}
      </small>
    ) : null;

  return (
    <Dialog
      visible={visible}
      style={{ width: "90vw", maxWidth: "600px" }}
      header={isEditing ? "Editar Socio" : "Nuevo Socio"}
      modal
      className="p-fluid"
      onHide={onHide}
    >
      {!isEditing && (
        <div className="mb-3">
          <label>
            <input
              type="checkbox"
              checked={crearUsuario}
              onChange={(e) => {
                setCrearUsuario(e.target.checked);
                setErrors({});
              }}
            />{" "}
            Crear nuevo usuario
          </label>
        </div>
      )}

      {isEditing ? (
        <>
          <div className="grid gap-2">
            <InputText
              placeholder="Nombre(s)"
              value={userForm.name}
              className="w-full"
              disabled
            />
            <InputText
              placeholder="Apellido(s)"
              value={userForm.lastName}
              className="w-full"
              disabled
            />
            <InputText
              placeholder="Email"
              value={userForm.email}
              className="w-full"
              disabled
            />
            <InputText
              placeholder="Teléfono"
              value={userForm.phoneNumber}
              className="w-full"
              disabled
            />
            <div>
              <label
                style={{
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.25rem",
                  display: "block",
                  fontSize: "0.875rem",
                }}
              >
                Monto Semanal
              </label>
              <InputNumber
                id="monto_semanal"
                value={formData.monto_semanal}
                onValueChange={(e) =>
                  setFormData({ ...formData, monto_semanal: e.value || 0 })
                }
                mode="decimal"
                min={0}
                className="w-full"
                placeholder="Monto semanal"
                useGrouping={false}
                inputMode="numeric"
              />
            </div>
            <div>
              <label
                style={{
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.25rem",
                  display: "block",
                  fontSize: "0.875rem",
                }}
              >
                Antigüedad del socio (opcional)
              </label>
              <Calendar
                value={
                  formData.antiguedad
                    ? new Date(formData.antiguedad + "T00:00:00")
                    : null
                }
                onChange={(e) => {
                  if (e.value) {
                    const d = e.value as Date;
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const dd = String(d.getDate()).padStart(2, "0");
                    setFormData({
                      ...formData,
                      antiguedad: `${yyyy}-${mm}-${dd}`,
                    });
                  } else {
                    setFormData({ ...formData, antiguedad: undefined });
                  }
                }}
                dateFormat="dd/mm/yy"
                placeholder="Selecciona fecha de antigüedad"
                className="w-full"
                showIcon
                maxDate={new Date()}
                showButtonBar
              />
              <small style={{ color: "#6b7280" }}>
                Si no se especifica, se usará la fecha de registro.
              </small>
            </div>
          </div>
        </>
      ) : crearUsuario ? (
        <>
          <div className="flex flex-column gap-2">
            <div>
              <InputText
                placeholder="Nombre(s)"
                value={userForm.name}
                onChange={(e) => {
                  setUserForm({ ...userForm, name: e.target.value });
                  setErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={`w-full${errors.name ? " p-invalid" : ""}`}
                required
              />
              {fieldError("name")}
            </div>
            <div>
              <InputText
                placeholder="Apellido(s)"
                value={userForm.lastName}
                onChange={(e) => {
                  setUserForm({ ...userForm, lastName: e.target.value });
                  setErrors((prev) => ({ ...prev, lastName: "" }));
                }}
                className={`w-full${errors.lastName ? " p-invalid" : ""}`}
                required
              />
              {fieldError("lastName")}
            </div>
            <div>
              <InputText
                placeholder="Email"
                value={userForm.email}
                onChange={(e) => {
                  setUserForm({ ...userForm, email: e.target.value });
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
                className={`w-full${errors.email ? " p-invalid" : ""}`}
                required
              />
              {fieldError("email")}
            </div>
            <div>
              <InputText
                placeholder="Teléfono (10 dígitos)"
                value={userForm.phoneNumber}
                onChange={(e) => {
                  setUserForm({ ...userForm, phoneNumber: e.target.value });
                  setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                }}
                className={`w-full${errors.phoneNumber ? " p-invalid" : ""}`}
                maxLength={10}
                keyfilter="int"
              />
              {fieldError("phoneNumber")}
            </div>
            <div>
              <label
                style={{
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.25rem",
                  display: "block",
                  fontSize: "0.875rem",
                }}
              >
                Monto Semanal
              </label>
              <InputNumber
                id="monto_semanal"
                value={formData.monto_semanal}
                onValueChange={(e) => {
                  setFormData({ ...formData, monto_semanal: e.value || 0 });
                  setErrors((prev) => ({ ...prev, monto_semanal: "" }));
                }}
                mode="decimal"
                min={50}
                className={`w-full${errors.monto_semanal ? " p-invalid" : ""}`}
                placeholder="Mínimo $50"
                useGrouping={false}
                inputMode="numeric"
              />
              {fieldError("monto_semanal")}
            </div>
            <div>
              <label
                style={{
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "0.25rem",
                  display: "block",
                  fontSize: "0.875rem",
                }}
              >
                Antigüedad del socio (opcional)
              </label>
              <Calendar
                value={
                  formData.antiguedad
                    ? new Date(formData.antiguedad + "T00:00:00")
                    : null
                }
                onChange={(e) => {
                  if (e.value) {
                    const d = e.value as Date;
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const dd = String(d.getDate()).padStart(2, "0");
                    setFormData({
                      ...formData,
                      antiguedad: `${yyyy}-${mm}-${dd}`,
                    });
                  } else {
                    setFormData({ ...formData, antiguedad: undefined });
                  }
                }}
                dateFormat="dd/mm/yy"
                placeholder="Selecciona fecha de antigüedad"
                className="w-full"
                showIcon
                maxDate={new Date()}
                showButtonBar
              />
              <small style={{ color: "#6b7280" }}>
                Si no se especifica, se usará la fecha de registro.
              </small>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Buscador de usuarios */}
          <div className="mb-3">
            <label
              style={{
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
                display: "block",
              }}
            >
              Buscar Usuario
            </label>
            <span className="p-input-icon-left w-full">
              <i
                className="pi pi-search"
                style={{ marginLeft: "0.75rem", color: "#9ca3af" }}
              />
              <InputText
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full"
                style={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                }}
              />
            </span>
            {searchValue && (
              <small style={{ color: "#6b7280" }}>
                {filteredUsuarios.length} usuario(s) encontrado(s)
              </small>
            )}
          </div>

          {/* Dropdown de usuarios filtrados */}
          <div className="mb-3">
            <label
              style={{
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.5rem",
                display: "block",
              }}
            >
              Seleccionar Usuario
            </label>
            <Dropdown
              value={formData.id_usuario}
              options={
                filteredUsuarios.length > 0
                  ? filteredUsuarios.map((u) => ({
                      label: `${u.name} ${u.lastName}`,
                      value: u.id,
                    }))
                  : []
              }
              onChange={(e) => {
                setFormData({ ...formData, id_usuario: e.value });
                const user = usuarios.find((u) => u.id === e.value);
                if (user) {
                  setUserForm({
                    email: user.email,
                    name: user.name,
                    lastName: user.lastName,
                    phoneNumber: user.phoneNumber,
                    password: "",
                  });
                }
              }}
              placeholder={
                usuarios.length === 0
                  ? "No hay usuarios disponibles"
                  : filteredUsuarios.length === 0
                    ? "No se encontraron usuarios"
                    : "Selecciona un usuario"
              }
              className="w-full"
              disabled={usuarios.length === 0}
              showClear
              style={{ borderRadius: "8px" }}
            />
          </div>

          {selectedUser && (
            <div className="grid gap-2 mb-3 pl-2 pr-2">
              <InputText
                placeholder="Nombre(s)"
                value={selectedUser.name}
                className="w-full"
                disabled
              />
              <InputText
                placeholder="Apellido(s)"
                value={selectedUser.lastName}
                className="w-full"
                disabled
              />
              <InputText
                placeholder="Email"
                value={selectedUser.email}
                className="w-full"
                disabled
              />
              <InputText
                placeholder="Teléfono"
                value={selectedUser.phoneNumber}
                className="w-full"
                disabled
              />
            </div>
          )}

          <div className="mb-3">
            <label
              style={{
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.25rem",
                display: "block",
                fontSize: "0.875rem",
              }}
            >
              Monto Semanal
            </label>
            <InputNumber
              id="monto_semanal"
              value={formData.monto_semanal}
              onValueChange={(e) => {
                setFormData({ ...formData, monto_semanal: e.value || 0 });
                setErrors((prev) => ({ ...prev, monto_semanal: "" }));
              }}
              mode="decimal"
              min={50}
              className={`w-full${errors.monto_semanal ? " p-invalid" : ""}`}
              placeholder="Mínimo $50"
              useGrouping={false}
              inputMode="numeric"
            />
            {fieldError("monto_semanal")}
          </div>

          <div className="mb-3">
            <label
              style={{
                fontWeight: "600",
                color: "#374151",
                marginBottom: "0.25rem",
                display: "block",
                fontSize: "0.875rem",
              }}
            >
              Antigüedad del socio (opcional)
            </label>
            <Calendar
              value={
                formData.antiguedad
                  ? new Date(formData.antiguedad + "T00:00:00")
                  : null
              }
              onChange={(e) => {
                if (e.value) {
                  const d = e.value as Date;
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");
                  setFormData({
                    ...formData,
                    antiguedad: `${yyyy}-${mm}-${dd}`,
                  });
                } else {
                  setFormData({ ...formData, antiguedad: undefined });
                }
              }}
              dateFormat="dd/mm/yy"
              placeholder="Selecciona fecha de antigüedad"
              className="w-full"
              showIcon
              maxDate={new Date()}
              showButtonBar
            />
            <small style={{ color: "#6b7280" }}>
              Si no se especifica, se usará la fecha de registro.
            </small>
          </div>
        </>
      )}
      <div className="flex justify-end gap-2 mt-6">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          outlined
          onClick={onHide}
          disabled={loading}
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          onClick={validateAndSave}
          severity="success"
          loading={loading}
        />
      </div>
    </Dialog>
  );
};

export default PartnerForm;
