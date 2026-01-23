"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { Toast } from "primereact/toast";
import { Skeleton } from "primereact/skeleton";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { useUser } from "@/context/UserContext";
import type {
  DashboardAdmin,
  DashboardSocio,
  ActividadReciente,
  ProximoPago,
  TipoActividad,
} from "@/types/Dashboard";

const Dashboard: React.FC = () => {
  const { user, socioExtra } = useUser();
  const router = useRouter();
  const toast = useRef<Toast>(null);

  const userRole = user?.rol || "socio";
  const socioId = socioExtra?.id;

  // Estados
  const [loading, setLoading] = useState(true);
  const [dashboardAdmin, setDashboardAdmin] = useState<DashboardAdmin | null>(
    null,
  );
  const [dashboardSocio, setDashboardSocio] = useState<DashboardSocio | null>(
    null,
  );

  // Cargar datos del dashboard
  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        if (userRole === "admin") {
          const response = await api.get<DashboardAdmin>("/dashboard", {
            params: {
              limiteActividad: 10,
              limiteProximosPagos: 10,
            },
          });
          setDashboardAdmin(response.data);
        } else if (socioId) {
          const response = await api.get<DashboardSocio>(
            `/dashboard/socio/${socioId}`,
            {
              params: {
                limiteActividad: 10,
                limiteProximosPagos: 5,
              },
            },
          );
          setDashboardSocio(response.data);
        }
      } catch (error) {
        console.error("Error al cargar dashboard:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo cargar el dashboard",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, userRole, socioId]);

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Formatear fecha y hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtener ícono y color según tipo de actividad
  const getActividadConfig = (tipo: TipoActividad) => {
    const config: Record<
      TipoActividad,
      { icon: string; color: string; bgColor: string }
    > = {
      ahorro: { icon: "pi-wallet", color: "#059669", bgColor: "#D1FAE5" },
      abono_prestamo: {
        icon: "pi-money-bill",
        color: "#2563EB",
        bgColor: "#DBEAFE",
      },
      prestamo_creado: {
        icon: "pi-plus-circle",
        color: "#9333EA",
        bgColor: "#F3E8FF",
      },
      prestamo_pagado: {
        icon: "pi-check-circle",
        color: "#059669",
        bgColor: "#D1FAE5",
      },
      prestamo_vencido: {
        icon: "pi-exclamation-triangle",
        color: "#DC2626",
        bgColor: "#FEE2E2",
      },
      prestamo_cancelado: {
        icon: "pi-times-circle",
        color: "#6B7280",
        bgColor: "#F3F4F6",
      },
      mora_aplicada: {
        icon: "pi-exclamation-circle",
        color: "#D97706",
        bgColor: "#FEF3C7",
      },
    };
    return (
      config[tipo] || {
        icon: "pi-circle",
        color: "#6B7280",
        bgColor: "#F3F4F6",
      }
    );
  };

  // Template para actividad reciente
  const actividadBodyTemplate = (rowData: ActividadReciente) => {
    const config = getActividadConfig(rowData.tipo);
    // Mejorar descripción si viene muy corta
    let descripcion = rowData.descripcion;
    if (descripcion === "Creado") {
      descripcion = "Préstamo creado";
    }
    return (
      <div className="flex align-items-center gap-3">
        <div
          className="flex align-items-center justify-content-center"
          style={{
            minWidth: "2rem",
            width: "2rem",
            height: "2rem",
            borderRadius: "50%",
            backgroundColor: config.bgColor,
            flexShrink: 0,
          }}
        >
          <i
            className={`pi ${config.icon}`}
            style={{ color: config.color, fontSize: "0.875rem" }}
          ></i>
        </div>
        <div style={{ minWidth: 0 }}>
          <p className="m-0" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            {descripcion}
          </p>
          <p className="m-0" style={{ fontSize: "0.75rem", color: "#6B7280" }}>
            {rowData.socio.nombre}
          </p>
        </div>
      </div>
    );
  };

  // Template para monto en actividad
  const montoActividadTemplate = (rowData: ActividadReciente) => {
    if (!rowData.monto) return <span style={{ color: "#6B7280" }}>-</span>;
    return (
      <span style={{ fontWeight: 600, color: "#111827" }}>
        {formatCurrency(rowData.monto)}
      </span>
    );
  };

  // Template para fecha de actividad
  const fechaActividadTemplate = (rowData: ActividadReciente) => (
    <span style={{ color: "#6B7280", fontSize: "0.75rem" }}>
      {formatDateTime(rowData.fecha)}
    </span>
  );

  // Template para próximos pagos
  const socioProximoPagoTemplate = (rowData: ProximoPago) => (
    <div className="flex align-items-center gap-2">
      <div
        className="flex align-items-center justify-content-center"
        style={{
          width: "2rem",
          height: "2rem",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontSize: "0.625rem",
          fontWeight: "bold",
        }}
      >
        {rowData.socio.nombre
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()}
      </div>
      <div>
        <p className="m-0" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
          {rowData.socio.nombre}
        </p>
        <p className="m-0" style={{ fontSize: "0.75rem", color: "#6B7280" }}>
          Socio #{rowData.socio.n_socio}
        </p>
      </div>
    </div>
  );

  // Template para monto cuota
  const montoCuotaTemplate = (rowData: ProximoPago) => (
    <span style={{ fontWeight: 600, color: "#111827" }}>
      {formatCurrency(rowData.montoCuota)}
    </span>
  );

  // Template para días restantes
  const diasRestantesTemplate = (rowData: ProximoPago) => {
    const severity =
      rowData.diasRestantes <= 3
        ? "danger"
        : rowData.diasRestantes <= 7
          ? "warning"
          : "info";
    return (
      <Badge
        value={
          rowData.diasRestantes <= 0 ? "Vencido" : `${rowData.diasRestantes}d`
        }
        severity={severity}
      />
    );
  };

  // Datos para gráficas
  const getChartData = () => {
    const labels = [
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
    ];
    return {
      labels,
      datasets: [
        {
          label: "Capital Prestado",
          data: [
            45000, 52000, 48000, 61000, 58000, 65000, 72000, 68000, 75000,
            82000, 88000, 95000,
          ],
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  };

  const getRiesgoChartData = () => {
    if (!dashboardAdmin) {
      return {
        labels: ["Activos", "Pagados", "Vencidos"],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: ["#10b981", "#3b82f6", "#ef4444"],
          },
        ],
      };
    }
    const { totalPrestamosActivos, prestamosVencidos } = dashboardAdmin.resumen;
    const pagados = Math.max(0, totalPrestamosActivos - prestamosVencidos);
    return {
      labels: ["Activos", "Pagados", "Vencidos"],
      datasets: [
        {
          data: [totalPrestamosActivos, pagados, prestamosVencidos],
          backgroundColor: ["#10b981", "#3b82f6", "#ef4444"],
          hoverBackgroundColor: ["#059669", "#2563eb", "#dc2626"],
        },
      ],
    };
  };

  // Skeleton para cards
  const StatCardSkeleton = () => (
    <Card className="shadow-sm w-full">
      <div
        className="flex align-items-center gap-3"
        style={{ padding: "0.5rem" }}
      >
        <Skeleton shape="circle" size="3rem" />
        <div className="flex-1">
          <Skeleton width="60%" height="1rem" className="mb-2" />
          <Skeleton width="40%" height="1.5rem" />
        </div>
      </div>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex flex-column lg:flex-row gap-3 mb-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="flex flex-column lg:flex-row gap-3 mb-4">
          <Card className="shadow-sm w-full lg:w-8">
            <Skeleton height="16rem" />
          </Card>
          <Card className="shadow-sm w-full lg:w-4">
            <Skeleton height="16rem" />
          </Card>
        </div>
      </div>
    );
  }

  // Vista Admin
  if (userRole === "admin" && dashboardAdmin) {
    const { resumen, actividadReciente, proximosPagos } = dashboardAdmin;
    const tasaRecuperacion =
      resumen.totalCapitalPrestado > 0
        ? (
            (resumen.totalCapitalRecuperado / resumen.totalCapitalPrestado) *
            100
          ).toFixed(1)
        : "0";

    return (
      <div className="p-4 lg:p-6">
        <Toast ref={toast} />

        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">Resumen general de la caja de ahorro</p>
        </div>

        {/* Cards primera fila */}
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
                ></i>
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
                ></i>
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
                    color:
                      resumen.prestamosVencidos > 0 ? "#DC2626" : "#059669",
                  }}
                >
                  {resumen.prestamosVencidos > 0 ? (
                    <>
                      <i
                        className="pi pi-exclamation-triangle"
                        style={{ fontSize: "0.625rem" }}
                      ></i>{" "}
                      {resumen.prestamosVencidos} vencidos
                    </>
                  ) : (
                    <>
                      <i
                        className="pi pi-check"
                        style={{ fontSize: "0.625rem" }}
                      ></i>{" "}
                      Sin vencidos
                    </>
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Cards segunda fila */}
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
                ></i>
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
                ></i>
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

        {/* Gráficas */}
        <div className="flex flex-column lg:flex-row gap-3 mb-4">
          <Card
            className="shadow-sm w-full lg:w-8"
            title="Tendencia de Capital"
          >
            <Chart type="line" data={getChartData()} className="h-64" />
          </Card>
          <Card className="shadow-sm w-full lg:w-4" title="Estado de Préstamos">
            <Chart
              type="doughnut"
              data={getRiesgoChartData()}
              className="h-64"
            />
          </Card>
        </div>

        {/* Tablas */}
        <div className="flex flex-column lg:flex-row gap-3 mb-4">
          <Card className="shadow-sm w-full" title="Actividad Reciente">
            {actividadReciente.length > 0 ? (
              <DataTable
                value={actividadReciente}
                paginator
                rows={5}
                className="text-sm"
                responsiveLayout="scroll"
              >
                <Column
                  header="Actividad"
                  body={actividadBodyTemplate}
                  style={{ minWidth: "180px" }}
                />
                <Column
                  header="Monto"
                  body={montoActividadTemplate}
                  style={{ minWidth: "90px" }}
                />
                <Column
                  header="Fecha"
                  body={fechaActividadTemplate}
                  style={{ minWidth: "100px" }}
                />
              </DataTable>
            ) : (
              <div className="text-center py-6" style={{ color: "#6B7280" }}>
                <i
                  className="pi pi-inbox mb-3"
                  style={{ fontSize: "2rem" }}
                ></i>
                <p>No hay actividad reciente</p>
              </div>
            )}
          </Card>

          <Card className="shadow-sm w-full" title="Próximos Pagos">
            {proximosPagos.length > 0 ? (
              <DataTable
                value={proximosPagos}
                paginator
                rows={5}
                className="text-sm"
                responsiveLayout="scroll"
              >
                <Column
                  header="Socio"
                  body={socioProximoPagoTemplate}
                  style={{ minWidth: "150px" }}
                />
                <Column
                  header="Cuota"
                  body={montoCuotaTemplate}
                  style={{ minWidth: "100px" }}
                />
                <Column
                  header="Días"
                  body={diasRestantesTemplate}
                  style={{ width: "80px" }}
                />
              </DataTable>
            ) : (
              <div className="text-center py-6" style={{ color: "#6B7280" }}>
                <i
                  className="pi pi-calendar mb-3"
                  style={{ fontSize: "2rem" }}
                ></i>
                <p>No hay pagos próximos</p>
              </div>
            )}
          </Card>
        </div>

        {/* Acciones rápidas */}
        <div className="flex flex-wrap gap-3">
          <Button
            label="Registrar Ahorro"
            icon="pi pi-plus"
            style={{ backgroundColor: "#2563EB", border: "none" }}
            onClick={() => router.push("/ahorros")}
          />
          <Button
            label="Nuevo Préstamo"
            icon="pi pi-file"
            severity="secondary"
            outlined
            onClick={() => router.push("/prestamos")}
          />
          <Button
            label="Ver Socios"
            icon="pi pi-users"
            severity="secondary"
            outlined
            onClick={() => router.push("/socios")}
          />
        </div>
      </div>
    );
  }

  // Vista Socio
  if (userRole === "socio" && dashboardSocio) {
    const { resumen, actividadReciente, proximosPagos } = dashboardSocio;

    return (
      <div className="p-4 lg:p-6">
        <Toast ref={toast} />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido, {user?.name} {user?.lastName}
          </h2>
          <p className="text-gray-600">Aquí está el resumen de tu cuenta</p>
        </div>

        {/* Cards */}
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
                ></i>
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

        {/* Card próximo pago */}
        {resumen.proximoPago && (
          <Card
            className="shadow-sm mb-6"
            style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}
          >
            <div className="flex align-items-start gap-4">
              <i
                className="pi pi-calendar text-3xl"
                style={{ color: "#2563EB" }}
              ></i>
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
            {actividadReciente.length > 0 ? (
              <DataTable
                value={actividadReciente}
                className="text-sm"
                responsiveLayout="scroll"
                paginator
                rows={5}
              >
                <Column 
                  header="Actividad" 
                  body={actividadBodyTemplate} 
                  style={{ minWidth: "160px" }}
                />
                <Column 
                  header="Monto" 
                  body={montoActividadTemplate} 
                  style={{ minWidth: "80px" }}
                />
                <Column
                  header="Fecha"
                  body={fechaActividadTemplate}
                  style={{ minWidth: "90px" }}
                />
              </DataTable>
            ) : (
              <div className="text-center py-6" style={{ color: "#6B7280" }}>
                <i
                  className="pi pi-inbox mb-3"
                  style={{ fontSize: "2rem" }}
                ></i>
                <p>No hay movimientos recientes</p>
              </div>
            )}
          </Card>

          <Card className="shadow-sm w-full lg:w-6" title="Mis Próximos Pagos">
            {proximosPagos.length > 0 ? (
              <DataTable
                value={proximosPagos}
                className="text-sm"
                responsiveLayout="scroll"
              >
                <Column header="Cuota" body={montoCuotaTemplate} />
                <Column
                  header="Fecha"
                  body={(rowData: ProximoPago) => (
                    <span style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                      {formatDate(rowData.fechaProximoPago)}
                    </span>
                  )}
                />
                <Column header="Días" body={diasRestantesTemplate} />
              </DataTable>
            ) : (
              <div className="text-center py-6" style={{ color: "#6B7280" }}>
                <i
                  className="pi pi-check-circle mb-3"
                  style={{ fontSize: "2rem", color: "#059669" }}
                ></i>
                <p>No tienes pagos pendientes</p>
              </div>
            )}
          </Card>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-3">
          <Button
            label="Ver Mis Préstamos"
            icon="pi pi-money-bill"
            className="bg-blue-600 border-blue-600"
            onClick={() => router.push("/prestamos")}
          />
          <Button
            label="Ver Mi Historial"
            icon="pi pi-history"
            severity="secondary"
            outlined
          />
        </div>
      </div>
    );
  }

  // Estado sin datos
  return (
    <div className="p-4 lg:p-6">
      <Toast ref={toast} />
      <div className="text-center py-8">
        <i
          className="pi pi-inbox mb-4"
          style={{ fontSize: "3rem", color: "#6B7280" }}
        ></i>
        <h2 className="text-xl font-bold text-gray-700 mb-2">
          Sin datos disponibles
        </h2>
        <p className="text-gray-500">
          No se pudo cargar la información del dashboard
        </p>
        <Button
          label="Reintentar"
          icon="pi pi-refresh"
          className="mt-4"
          onClick={() => window.location.reload()}
        />
      </div>
    </div>
  );
};

export default Dashboard;
