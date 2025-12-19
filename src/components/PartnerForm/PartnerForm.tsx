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
  formData: { id_usuario: string; monto_semanal: number };
  setFormData: (val: { id_usuario: string; monto_semanal: number }) => void;
  userForm: CreateUserDto;
  setUserForm: (val: CreateUserDto) => void;
  usuarios: Usuario[];
  onHide: () => void;
  onSave: () => void;
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
  return (
    <Dialog
      visible={visible}
      style={{ width: "90vw", maxWidth: "600px" }}
      header={isEditing ? "Editar Socio" : "Nuevo Socio"}
      modal
      className="p-fluid"
      onHide={onHide}
    >
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
      {crearUsuario ? (
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
          <div className="mb-3">
            <Dropdown
              value={formData.id_usuario}
              options={
                usuarios.length > 0
                  ? usuarios.map((u) => ({
                      label: `${u.name} ${u.lastName} (${u.email})`,
                      value: u.id,
                    }))
                  : []
              }
              onChange={(e) =>
                setFormData({ ...formData, id_usuario: e.value })
              }
              placeholder={
                usuarios.length === 0
                  ? "No hay usuarios disponibles"
                  : "Selecciona un usuario"
              }
              className="w-full"
              disabled={usuarios.length === 0}
            />
          </div>
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
