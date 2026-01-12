import { Card } from "primereact/card";
import { Button } from "primereact/button";
import type { Partner } from "@/types/Partner";
import type { ResumenSocio } from "@/types/CajaSemanal";

interface SocioCardProps {
  socio: Partner;
  onEdit: (partner: Partner) => void;
  resumenPorSocio?: Map<number, ResumenSocio>;
}

const SocioCard = ({ socio, onEdit, resumenPorSocio }: SocioCardProps) => {
  // Obtener las iniciales del nombre y apellido
  const getInitials = () => {
    const firstInitial = socio.id_usuario?.name?.charAt(0).toUpperCase() || "";
    const lastInitial =
      socio.id_usuario?.lastName?.charAt(0).toUpperCase() || "";
    return `${firstInitial}${lastInitial}`;
  };

  // Función para obtener semanas dadas (número de abonos) de un socio
  const getSemanasDadas = (): number => {
    if (!resumenPorSocio) return 0;
    const resumen = resumenPorSocio.get(socio.n_socio);
    return resumen?.numero_abonos ?? 0;
  };

  // Función para obtener total ahorrado de un socio
  const getTotalAhorrado = (): number => {
    if (!resumenPorSocio) return 0;
    const resumen = resumenPorSocio.get(socio.n_socio);
    return resumen?.total_ahorrado ?? 0;
  };

  return (
    <div style={{ position: "relative", padding: "2rem 1rem" }}>
      <Card className="shadow-3">
        {/* Botón de editar en esquina superior derecha */}
        <Button
          icon="pi pi-pencil"
          rounded
          severity="info"
          onClick={() => onEdit(socio)}
          aria-label="Editar socio"
          style={{
            position: "absolute",
            top: "1rem",
            right: "0.2rem",
            width: "2.5rem",
            height: "2.5rem",
            zIndex: 10,
          }}
        />

        <div className="flex flex-column align-items-center text-center gap-3 py-2">
          {/* Avatar con iniciales */}
          <div
            className="flex align-items-center justify-content-center"
            style={{
              width: "5rem",
              height: "5rem",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            {getInitials()}
          </div>

          {/* Nombre completo */}
          <div className="w-full">
            <p
              className="m-0"
              style={{ fontSize: "1.125rem", fontWeight: "bold" }}
            >
              {socio.id_usuario?.name} {socio.id_usuario?.lastName}
            </p>
            <p
              className="m-0 mt-1"
              style={{
                fontSize: "0.875rem",
                fontWeight: "bold",
                color: "#6366F1",
              }}
            >
              Socio #{socio.n_socio}
            </p>
          </div>

          {/* Celular */}
          <div className="w-full">
            <p className="m-0" style={{ fontSize: "0.875rem", color: "#666" }}>
              <i className="pi pi-phone mr-2"></i>
              {socio.id_usuario?.phoneNumber || "Sin teléfono"}
            </p>
          </div>

          {/* Monto semanal y semanas dadas */}
          <div className="w-full grid">
            <div className="col-6">
              <div
                className="p-2 border-round"
                style={{ backgroundColor: "#eff6ff" }}
              >
                <p
                  className="m-0"
                  style={{ fontSize: "0.75rem", color: "#666" }}
                >
                  Monto Semanal
                </p>
                <p
                  className="m-0 mt-1"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "bold",
                    color: "#2563eb",
                  }}
                >
                  {socio.monto_semanal.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </p>
              </div>
            </div>
            <div className="col-6">
              <div
                className="p-2 border-round"
                style={{ backgroundColor: "#faf5ff" }}
              >
                <p
                  className="m-0"
                  style={{ fontSize: "0.75rem", color: "#666" }}
                >
                  Semanas Dadas
                </p>
                <p
                  className="m-0 mt-1"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "bold",
                    color: "#9333ea",
                  }}
                >
                  {getSemanasDadas()}
                </p>
              </div>
            </div>
          </div>

          {/* Total ahorrado */}
          <div
            className="w-full p-3 border-round"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <p
              className="m-0 mb-1"
              style={{ fontSize: "0.75rem", color: "#666" }}
            >
              Total Ahorrado
            </p>
            <p
              className="m-0"
              style={{
                fontSize: "1.125rem",
                fontWeight: "bold",
                color: "#16a34a",
              }}
            >
              {getTotalAhorrado().toLocaleString("es-MX", {
                style: "currency",
                currency: "MXN",
              })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SocioCard;
