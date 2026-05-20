"use client";

import { useMemo } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import type { ResumenAdmin } from "@/types/Dashboard";

interface DashboardChartsProps {
  resumen: ResumenAdmin;
}

export default function DashboardCharts({ resumen }: DashboardChartsProps) {
  const prestamosChartData = useMemo(() => {
    const activos = Math.max(
      0,
      resumen.totalPrestamosActivos - resumen.prestamosVencidos,
    );
    const vencidos = resumen.prestamosVencidos;
    return {
      labels: ["Al corriente", "Vencidos"],
      datasets: [
        {
          data: [activos, vencidos],
          backgroundColor: ["#10b981", "#ef4444"],
          hoverBackgroundColor: ["#059669", "#dc2626"],
        },
      ],
    };
  }, [resumen]);

  const capitalChartData = useMemo(() => {
    const pendiente = Math.max(
      0,
      resumen.totalCapitalPrestado - resumen.totalCapitalRecuperado,
    );
    return {
      labels: ["Recuperado", "Pendiente por cobrar"],
      datasets: [
        {
          label: "Capital (MXN)",
          data: [resumen.totalCapitalRecuperado, pendiente],
          backgroundColor: [
            "rgba(16, 185, 129, 0.7)",
            "rgba(239, 68, 68, 0.7)",
          ],
          borderColor: ["#059669", "#dc2626"],
          borderWidth: 1,
        },
      ],
    };
  }, [resumen]);

  const capitalChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number | string) =>
            Number(value).toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
              maximumFractionDigits: 0,
            }),
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" as const },
    },
  };

  return (
    <div className="flex flex-column lg:flex-row gap-3 mb-4">
      <Card
        className="shadow-sm w-full lg:w-8"
        title="Capital Prestado vs Recuperado"
      >
        <Chart
          type="bar"
          data={capitalChartData}
          options={capitalChartOptions}
          className="h-64"
        />
      </Card>
      <Card className="shadow-sm w-full lg:w-4" title="Estado de Préstamos">
        <Chart
          type="doughnut"
          data={prestamosChartData}
          options={doughnutOptions}
          className="h-64"
        />
      </Card>
    </div>
  );
}
