"use client";

import { Card } from "primereact/card";
import type { ResumenAdmin } from "@/types/Dashboard";
import { formatCurrency } from "./utils/dashboard.utils";

interface Props {
  resumen: ResumenAdmin;
}

const DashboardAdminStats = ({ resumen }: Props) => {
  const tasaRecuperacion =
    resumen.totalCapitalPrestado > 0
      ? (
          (resumen.totalCapitalRecuperado / resumen.totalCapitalPrestado) *
          100
        ).toFixed(1)
      : "0";

  return (
    <>
      {/* Fila 1 */}
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
              />
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
                {resumen.totalSocios}
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
                Ahorros Esta Semana
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {formatCurrency(resumen.totalAhorrosSemana)}
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
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {resumen.totalPrestamosActivos}
              </p>
              <p
                className="m-0 mt-1"
                style={{ fontSize: "0.75rem", color: "#6B7280" }}
              >
                {formatCurrency(resumen.totalCapitalPrestado)}
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
                backgroundColor: "#FEF3C7",
                padding: "0.75rem",
                borderRadius: "8px",
              }}
            >
              <i
                className="pi pi-chart-line"
                style={{ fontSize: "1.5rem", color: "#D97706" }}
              />
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Tasa Recuperación
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {tasaRecuperacion}%
              </p>
              <p
                className="m-0 mt-1"
                style={{
                  fontSize: "0.75rem",
                  color: resumen.prestamosVencidos > 0 ? "#DC2626" : "#059669",
                }}
              >
                {resumen.prestamosVencidos > 0 ? (
                  <>
                    <i
                      className="pi pi-exclamation-triangle"
                      style={{ fontSize: "0.625rem" }}
                    />{" "}
                    {resumen.prestamosVencidos} vencidos
                  </>
                ) : (
                  <>
                    <i
                      className="pi pi-check"
                      style={{ fontSize: "0.625rem" }}
                    />{" "}
                    Sin vencidos
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fila 2 */}
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
                className="pi pi-send"
                style={{ fontSize: "1.5rem", color: "#2563EB" }}
              />
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Capital Prestado
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {formatCurrency(resumen.totalCapitalPrestado)}
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
                backgroundColor: "#D1FAE5",
                padding: "0.75rem",
                borderRadius: "8px",
              }}
            >
              <i
                className="pi pi-replay"
                style={{ fontSize: "1.5rem", color: "#059669" }}
              />
            </div>
            <div>
              <p
                className="mb-1"
                style={{ color: "#6B7280", fontSize: "0.875rem" }}
              >
                Capital Recuperado
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {formatCurrency(resumen.totalCapitalRecuperado)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default DashboardAdminStats;
