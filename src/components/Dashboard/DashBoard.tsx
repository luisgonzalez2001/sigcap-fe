import React from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";

interface DashboardProps {
  userRole?: "admin" | "socio";
}

const Dashboard: React.FC<DashboardProps> = ({ userRole = "admin" }) => {
  // Datos simulados
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

  const statusBodyTemplate = (rowData: any) => {
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

  const montoBodyTemplate = (rowData: any) => {
    return (
      <span className="font-semibold">{formatCurrency(rowData.monto)}</span>
    );
  };

  return (
    <div className="flex-1 p-4 sm:p-3 lg:p-4 lg:pt-0">
      {userRole === "admin" ? (
        // Vista de Administrador
        <>
          {/* Cards de estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Socios</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statsData.totalSocios}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    <i className="pi pi-arrow-up text-xs"></i>{" "}
                    {statsData.sociosActivos} activos
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <i className="pi pi-users text-2xl text-blue-600"></i>
                </div>
              </div>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Ahorrado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(statsData.totalAhorrado)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    <i className="pi pi-arrow-up text-xs"></i> +8.5% este mes
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <i className="pi pi-wallet text-2xl text-green-600"></i>
                </div>
              </div>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm mb-1">
                    Préstamos Activos
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statsData.prestamosActivos}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatCurrency(statsData.montoTotalPrestamos)}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <i className="pi pi-money-bill text-2xl text-purple-600"></i>
                </div>
              </div>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm mb-1">
                    Tasa de Recuperación
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statsData.tasaRecuperacion}%
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    <i className="pi pi-check text-xs"></i> Excelente
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <i className="pi pi-chart-line text-2xl text-orange-600"></i>
                </div>
              </div>
            </Card>
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card
              className="lg:col-span-2 shadow-sm"
              title="Tendencia de Ahorros"
            >
              <Chart type="line" data={ahorrosMensuales} className="h-64" />
            </Card>

            <Card className="shadow-sm" title="Préstamos por Nivel de Riesgo">
              <Chart
                type="doughnut"
                data={prestamosPorRiesgo}
                className="h-64"
              />
            </Card>
          </div>

          {/* Tablas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="shadow-sm" title="Actividad Reciente">
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

            <Card className="shadow-sm" title="Próximos Pagos">
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
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              label="Registrar Ahorro"
              icon="pi pi-plus"
              className="bg-blue-600 border-blue-600"
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
              Bienvenido, {socioData.nombre}
            </h2>
            <p className="text-gray-600">Aquí está el resumen de tu cuenta</p>
          </div>

          {/* Cards de información del socio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card className="shadow-sm">
              <div className="text-center">
                <i className="pi pi-wallet text-4xl text-blue-600 mb-3"></i>
                <p className="text-gray-600 text-sm mb-1">
                  Saldo Total Ahorrado
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(socioData.saldoTotal)}
                </p>
              </div>
            </Card>

            <Card className="shadow-sm">
              <div className="text-center">
                <i className="pi pi-calendar text-4xl text-green-600 mb-3"></i>
                <p className="text-gray-600 text-sm mb-1">Progreso Anual</p>
                <p className="text-3xl font-bold text-gray-900">
                  {socioData.semanasCompletadas}/48
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(socioData.semanasCompletadas / 48) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </Card>

            <Card className="shadow-sm">
              <div className="text-center">
                <i className="pi pi-star text-4xl text-orange-600 mb-3"></i>
                <p className="text-gray-600 text-sm mb-1">
                  Tu Scoring Crediticio
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {socioData.scoring}
                </p>
                <Badge
                  value="Bajo Riesgo"
                  severity="success"
                  className="mt-2"
                />
              </div>
            </Card>
          </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="shadow-sm" title="Historial de Ahorros">
              <Chart type="bar" data={ahorrosMensuales} className="h-64" />
            </Card>

            <Card className="shadow-sm" title="Mis Últimos Movimientos">
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
