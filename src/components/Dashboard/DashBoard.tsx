"use client";

import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import api from "@/services/api";
import type { ResumenGeneral, ResumenSocio } from "@/types/CajaSemanal";
import type { Partner } from "@/types/Partner";
import { useUser } from "@/context/UserContext";

const Dashboard: React.FC = () => {
  const { user, socioExtra } = useUser();
  const userRole = user?.rol || "socio";
  const nSocio = socioExtra?.n_socio;

  // Estado para datos reales
  const [resumenGeneral, setResumenGeneral] = useState<ResumenGeneral | null>(
    null
  );
  const [totalSociosReal, setTotalSociosReal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [resumenSocio, setResumenSocio] = useState<ResumenSocio | null>(null);

  // Cargar datos reales del resumen y total de socios
  useEffect(() => {
    console.log("Cargando datos para rol:", userRole);
    console.log("Número de socio:", nSocio);
    if (userRole === "admin") {
      // Cargar resumen de caja semanal
      const resumenPromise = api
        .get("/caja-semanal/resumen")
        .then((res) => {
          setResumenGeneral(res.data);
        })
        .catch((err) => {
          console.error("Error al cargar resumen:", err);
        });

      // Cargar total real de socios desde /partners
      const partnersPromise = api
        .get<Partner[]>("/partners")
        .then((res) => {
          setTotalSociosReal(res.data.length);
        })
        .catch((err) => {
          console.error("Error al cargar socios:", err);
        });

      Promise.all([resumenPromise, partnersPromise]).finally(() => {
        setLoading(false);
      });
    } else if (userRole === "socio" && nSocio) {
      api
        .get(`/caja-semanal/resumen/${nSocio}`)
        .then((res) => {
          setResumenSocio(res.data);
          console.log("Resumen socio cargado:", res.data);
        })
        .catch((err) => {
          console.error("Error al cargar resumen socio:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [userRole, nSocio]);

  // Datos simulados (mock) para el resto
  const statsData = {
    totalSocios: 245,
    sociosActivos: 198,
    totalAhorrado: 1250000,
    prestamosActivos: 45,
    montoTotalPrestamos: 850000,
    tasaRecuperacion: 96.5,
  };

  const socioData = {
    nombre: "Juan Pérez",
    saldoTotal: 12500,
    semanasCompletadas: 32,
    prestamoActivo: true,
    montoPrestamoActivo: 15000,
    scoring: 85,
  };

  // Datos para gráficas
  const ahorrosMensuales = {
    labels: [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ],
    datasets: [
      {
        label: "Ahorros Mensuales",
        data: [
          45000, 52000, 48000, 61000, 58000, 65000, 72000, 68000, 75000, 82000,
          88000, 95000,
        ],
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const prestamosPorRiesgo = {
    labels: ["Bajo Riesgo", "Riesgo Medio", "Alto Riesgo"],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        hoverBackgroundColor: ["#059669", "#d97706", "#dc2626"],
      },
    ],
  };

  const recentActivities = [
    {
      id: 1,
      tipo: "Ahorro",
      socio: "María González",
      monto: 500,
      fecha: "2024-11-30",
      status: "completado",
    },
    {
      id: 2,
      tipo: "Préstamo",
      socio: "Carlos Ruiz",
      monto: 25000,
      fecha: "2024-11-29",
      status: "aprobado",
    },
    {
      id: 3,
      tipo: "Pago",
      socio: "Ana Martínez",
      monto: 2500,
      fecha: "2024-11-29",
      status: "completado",
    },
    {
      id: 4,
      tipo: "Ahorro",
      socio: "Luis Hernández",
      monto: 500,
      fecha: "2024-11-28",
      status: "completado",
    },
    {
      id: 5,
      tipo: "Préstamo",
      socio: "Sofia López",
      monto: 18000,
      fecha: "2024-11-28",
      status: "pendiente",
    },
  ];

  const proximosPagos = [
    {
      id: 1,
      socio: "Pedro Sánchez",
      monto: 2800,
      fecha: "2024-12-05",
      diasRestantes: 5,
    },
    {
      id: 2,
      socio: "Laura Torres",
      monto: 3200,
      fecha: "2024-12-07",
      diasRestantes: 7,
    },
    {
      id: 3,
      socio: "Diego Flores",
      monto: 1500,
      fecha: "2024-12-10",
      diasRestantes: 10,
    },
    {
      id: 4,
      socio: "Carmen Vega",
      monto: 4100,
      fecha: "2024-12-12",
      diasRestantes: 12,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  const statusBodyTemplate = (rowData: { status: string }) => {
    const severity =
      rowData.status === "completado"
        ? "success"
        : rowData.status === "aprobado"
        ? "info"
        : rowData.status === "pendiente"
        ? "warning"
        : "danger";
    return <Badge value={rowData.status} severity={severity} />;
  };

  const montoBodyTemplate = (rowData: { monto: number }) => {
    return (
      <span className="font-semibold">{formatCurrency(rowData.monto)}</span>
    );
  };

  return (
    <div className="p-4 lg:p-6">
      {userRole === "admin" ? (
        // Vista de Administrador
        <>
          {/* Cards de estadísticas - Responsive */}
          <div className="flex flex-column lg:flex-row gap-3 mb-4">
            {/* Total Socios - Datos reales */}
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
                    {loading ? "..." : totalSociosReal}
                  </p>
                </div>
              </div>
            </Card>

            {/* Total Ahorrado - Datos reales */}
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
                  ></i>
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
                    {loading
                      ? "..."
                      : formatCurrency(
                          resumenGeneral?.total_ahorrado_general || 0
                        )}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Segunda fila de cards */}
          <div className="flex flex-column lg:flex-row gap-3 mb-4">
            {/* Préstamos Activos - Mock */}
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
                  ></i>
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
                    {statsData.prestamosActivos}
                  </p>
                  <p
                    className="m-0 mt-1"
                    style={{ fontSize: "0.75rem", color: "#6B7280" }}
                  >
                    {formatCurrency(statsData.montoTotalPrestamos)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Tasa de Recuperación - Mock */}
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
                  ></i>
                </div>
                <div>
                  <p
                    className="mb-1"
                    style={{ color: "#6B7280", fontSize: "0.875rem" }}
                  >
                    Tasa de Recuperación
                  </p>
                  <p
                    className="m-0"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#111827",
                    }}
                  >
                    {statsData.tasaRecuperacion}%
                  </p>
                  <p
                    className="m-0 mt-1"
                    style={{ fontSize: "0.75rem", color: "#059669" }}
                  >
                    <i
                      className="pi pi-check"
                      style={{ fontSize: "0.625rem" }}
                    ></i>{" "}
                    Excelente
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Gráficas - Responsive */}
          <div className="flex flex-column lg:flex-row gap-3 mb-4">
            <Card
              className="shadow-sm w-full lg:w-8"
              title="Tendencia de Ahorros"
            >
              <Chart type="line" data={ahorrosMensuales} className="h-64" />
            </Card>

            <Card
              className="shadow-sm w-full lg:w-4"
              title="Préstamos por Nivel de Riesgo"
            >
              <Chart
                type="doughnut"
                data={prestamosPorRiesgo}
                className="h-64"
              />
            </Card>
          </div>

          {/* Tablas - Responsive */}
          <div className="flex flex-column lg:flex-row gap-3 mb-4">
            <Card className="shadow-sm w-full" title="Actividad Reciente">
              <DataTable
                value={recentActivities}
                paginator
                rows={5}
                className="text-sm"
                responsiveLayout="scroll"
              >
                <Column field="tipo" header="Tipo" />
                <Column
                  field="socio"
                  header="Socio"
                  className="hidden sm:table-cell"
                />
                <Column field="monto" header="Monto" body={montoBodyTemplate} />
                <Column
                  field="status"
                  header="Estado"
                  body={statusBodyTemplate}
                />
              </DataTable>
            </Card>

            <Card className="shadow-sm w-full" title="Próximos Pagos">
              <DataTable
                value={proximosPagos}
                className="text-sm"
                responsiveLayout="scroll"
              >
                <Column field="socio" header="Socio" />
                <Column field="monto" header="Monto" body={montoBodyTemplate} />
                <Column
                  field="diasRestantes"
                  header="Días"
                  body={(rowData) => (
                    <Badge
                      value={`${rowData.diasRestantes}d`}
                      severity={rowData.diasRestantes <= 7 ? "warning" : "info"}
                    />
                  )}
                />
              </DataTable>
            </Card>
          </div>

          {/* Acciones rápidas */}
          <div className="flex flex-wrap gap-3">
            <Button
              label="Registrar Ahorro"
              icon="pi pi-plus"
              style={{ backgroundColor: "#2563EB", border: "none" }}
            />
            <Button
              label="Nueva Solicitud de Préstamo"
              icon="pi pi-file"
              severity="secondary"
              outlined
            />
            <Button
              label="Generar Reporte"
              icon="pi pi-download"
              severity="secondary"
              outlined
            />
          </div>
        </>
      ) : (
        // Vista de Socio
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenido, {resumenSocio?.nombre_socio || socioData.nombre}
            </h2>
            <p className="text-gray-600">Aquí está el resumen de tu cuenta</p>
          </div>

          {/* Cards de información del socio - PrimeFlex y estilos admin */}
          <div className="flex flex-column lg:flex-row gap-3 mb-6">
            {/* Total Ahorrado - Datos reales */}
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
                  ></i>
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
                    {loading
                      ? "..."
                      : formatCurrency(resumenSocio?.total_ahorrado || 0)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Progreso Anual */}
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
                    className="pi pi-calendar"
                    style={{ fontSize: "1.5rem", color: "#9333EA" }}
                  ></i>
                </div>
                <div style={{ width: "100%" }}>
                  <p
                    className="mb-1"
                    style={{ color: "#6B7280", fontSize: "0.875rem" }}
                  >
                    Progreso Anual
                  </p>
                  <p
                    className="m-0"
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                      color: "#111827",
                    }}
                  >
                    {loading
                      ? "..."
                      : resumenSocio
                      ? `${resumenSocio.numero_abonos}/48`
                      : `${socioData.semanasCompletadas}/48`}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: resumenSocio
                          ? `${(resumenSocio.numero_abonos / 48) * 100}%`
                          : `${(socioData.semanasCompletadas / 48) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Scoring (mock) */}
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
                    className="pi pi-star"
                    style={{ fontSize: "1.5rem", color: "#F59E42" }}
                  ></i>
                </div>
                <div>
                  <p
                    className="mb-1"
                    style={{ color: "#6B7280", fontSize: "0.875rem" }}
                  >
                    Tu Scoring Crediticio
                  </p>
                  <p
                    className="m-0"
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                      color: "#111827",
                    }}
                  >
                    {socioData.scoring}
                  </p>
                  <Badge
                    value="Bajo Riesgo"
                    severity="success"
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Card de préstamo activo (mock) */}
          {socioData.prestamoActivo && (
            <Card className="shadow-sm mb-6 bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-4">
                <i className="pi pi-info-circle text-3xl text-blue-600"></i>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">
                    Préstamo Activo
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Tienes un préstamo activo de{" "}
                    <strong>
                      {formatCurrency(socioData.montoPrestamoActivo)}
                    </strong>
                  </p>
                  <Button label="Ver Detalles" size="small" outlined />
                </div>
              </div>
            </Card>
          )}

          <div className="flex flex-column lg:flex-row gap-6 mb-6">
            <Card
              className="shadow-sm w-full lg:w-6"
              title="Historial de Ahorros"
            >
              <Chart type="bar" data={ahorrosMensuales} className="h-64" />
            </Card>

            <Card
              className="shadow-sm w-full lg:w-6"
              title="Mis Últimos Movimientos"
            >
              <DataTable
                value={recentActivities.slice(0, 5)}
                className="text-sm"
                responsiveLayout="scroll"
              >
                <Column field="tipo" header="Tipo" />
                <Column field="monto" header="Monto" body={montoBodyTemplate} />
                <Column
                  field="fecha"
                  header="Fecha"
                  className="hidden sm:table-cell"
                />
              </DataTable>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              label="Solicitar Préstamo"
              icon="pi pi-file"
              className="bg-blue-600 border-blue-600"
            />
            <Button
              label="Ver Mi Historial"
              icon="pi pi-history"
              severity="secondary"
              outlined
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
