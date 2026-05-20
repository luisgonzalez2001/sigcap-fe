"use client";

import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import CreditScoringCard from "@/components/Scoring/CreditScoringCard";
import DashboardActividadReciente from "./DashboardActividadReciente";
import DashboardProximosPagos from "./DashboardProximosPagos";
import { formatCurrency, formatDate } from "./utils/dashboard.utils";
import type { DashboardSocio } from "@/types/Dashboard";

interface Props {
  data: DashboardSocio;
  socioId: string;
  userName: string;
}

const DashboardSocioView = ({ data, socioId, userName }: Props) => {
  const router = useRouter();
  const { resumen, actividadReciente, proximosPagos } = data;

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenido, {userName}
        </h2>
        <p className="text-gray-600">Aquí está el resumen de tu cuenta</p>
      </div>

      {/* Cards de resumen */}
      <div className="flex flex-column lg:flex-row gap-3 mb-6">
        <Card className="shadow-sm w-full">
          <div
            className="flex align-items-center gap-3"
            style={{ padding: "0.5rem" }}
          >
            <div
              style={{
                backgroundColor: "#D1FAE5",
                padding: "0.75rem",
                borderRadius: "8px",
              }}
            >
              <i
                className="pi pi-wallet"
                style={{ fontSize: "1.5rem", color: "#059669" }}
              />
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Total Ahorrado
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {formatCurrency(resumen.totalAhorros)}
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
                className="pi pi-money-bill"
                style={{ fontSize: "1.5rem", color: "#9333EA" }}
              />
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Préstamos Activos
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {resumen.totalPrestamosActivos}
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
                backgroundColor:
                  resumen.totalDeudaActiva > 0 ? "#FEE2E2" : "#D1FAE5",
                padding: "0.75rem",
                borderRadius: "8px",
              }}
            >
              <i
                className="pi pi-credit-card"
                style={{
                  fontSize: "1.5rem",
                  color: resumen.totalDeudaActiva > 0 ? "#DC2626" : "#059669",
                }}
              />
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Deuda Activa
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: resumen.totalDeudaActiva > 0 ? "#DC2626" : "#111827",
                }}
              >
                {formatCurrency(resumen.totalDeudaActiva)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Credit Scoring */}
      <div className="flex flex-column lg:flex-row gap-3 mb-6">
        <CreditScoringCard
          socioId={socioId}
          tienePrestamoActivo={(resumen.totalPrestamosActivos ?? 0) > 0}
        />
      </div>

      {/* Próximo pago */}
      {resumen.proximoPago && (
        <Card
          className="shadow-sm mb-6"
          style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}
        >
          <div className="flex align-items-start gap-4">
            <i
              className="pi pi-calendar text-3xl"
              style={{ color: "#2563EB" }}
            />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">Próximo Pago</h3>
              <p className="text-gray-700 mb-1">
                Cuota de{" "}
                <strong>
                  {formatCurrency(resumen.proximoPago.montoCuota)}
                </strong>
              </p>
              <p className="text-gray-600" style={{ fontSize: "0.875rem" }}>
                Fecha: {formatDate(resumen.proximoPago.fechaProximoPago)}
              </p>
              <Button
                label="Ver Préstamo"
                size="small"
                outlined
                className="mt-3"
                onClick={() => router.push("/prestamos")}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Tablas */}
      <div className="flex flex-column lg:flex-row gap-6 mb-6">
        <Card
          className="shadow-sm w-full lg:w-6"
          title="Mis Últimos Movimientos"
        >
          <DashboardActividadReciente actividad={actividadReciente} />
        </Card>

        <Card className="shadow-sm w-full lg:w-6" title="Mis Próximos Pagos">
          <DashboardProximosPagos pagos={proximosPagos} showSocio={false} />
        </Card>
      </div>
    </div>
  );
};

export default DashboardSocioView;
