import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import type { CreateUserDto, User as Usuario } from "@/types/UserDto";

interface PartnerFormProps {
  visible: boolean;
  isEditing: boolean;
  crearUsuario: boolean;
  setCrearUsuario: (val: boolean) => void;
  formData: { id_usuario: string; monto_semanal: number; id?: string };
  setFormData: (val: {
    id_usuario: string;
    monto_semanal: number;
    id?: string;
  }) => void;
  userForm: CreateUserDto;
  setUserForm: (val: CreateUserDto) => void;
  usuarios: Usuario[];
  onHide: () => void;
  onSave: () => Promise<void>;
  loading?: boolean;
}

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
  // Estado para la búsqueda de usuarios
  const [searchValue, setSearchValue] = useState("");

  // Filtrar usuarios por nombre
  const filteredUsuarios = usuarios.filter((u) => {
    if (!searchValue.trim()) return true;
    const fullName = `${u.name} ${u.lastName}`.toLowerCase();
    return fullName.includes(searchValue.toLowerCase());
  });

  // Resetear búsqueda cuando se cierra el diálogo
  useEffect(() => {
    if (!visible) {
      setSearchValue("");
    }
  }, [visible]);

  // Usuario seleccionado del dropdown
  const selectedUser = usuarios.find((u) => u.id === formData.id_usuario);

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
              onChange={(e) => setCrearUsuario(e.target.checked)}
            />
            Crear nuevo usuario
          </label>
        </div>
      )}

      {isEditing ? (
        <>
          {/* Modo edición: Mostrar todos los campos pero solo monto_semanal editable */}
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
        </>
      ) : crearUsuario ? (
        <>
          <div className="grid gap-2">
            <InputText
              placeholder="Nombre(s)"
              value={userForm.name}
              onChange={(e) =>
                setUserForm({ ...userForm, name: e.target.value })
              }
              className="w-full"
              required
            />
            <InputText
              placeholder="Apellido(s)"
              value={userForm.lastName}
              onChange={(e) =>
                setUserForm({ ...userForm, lastName: e.target.value })
              }
              className="w-full"
              required
            />
            <InputText
              placeholder="Email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
              className="w-full"
              required
            />
            <InputText
              placeholder="Teléfono"
              value={userForm.phoneNumber}
              onChange={(e) =>
                setUserForm({ ...userForm, phoneNumber: e.target.value })
              }
              className="w-full"
            />
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
                // Actualizar userForm con los datos del usuario seleccionado
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
          onClick={onSave}
          severity="success"
          loading={loading}
        />
      </div>
    </Dialog>
  );
};

export default PartnerForm;
