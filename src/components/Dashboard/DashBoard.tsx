"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Skeleton } from "primereact/skeleton";
import api from "@/services/api";
import { useUser } from "@/context/UserContext";
import { SolicitudAsociacionWrapper } from "@/components/SolicitudAsociacion/SolicitudAsociacionWrapper";
import DashboardCharts from "@/components/Dashboard/DashboardCharts";
import DashboardAdminStats from "@/components/Dashboard/DashboardAdminStats";
import DashboardActividadReciente from "@/components/Dashboard/DashboardActividadReciente";
import DashboardProximosPagos from "@/components/Dashboard/DashboardProximosPagos";
import DashboardSocioView from "@/components/Dashboard/DashboardSocioView";
import type { DashboardAdmin, DashboardSocio } from "@/types/Dashboard";

const Dashboard: React.FC = () => {
  const { user, socioExtra, loadingPartner } = useUser();
  const toast = useRef<Toast>(null);

  const userRole = user?.rol || "socio";
  const socioId = socioExtra?.id;

  const [loading, setLoading] = useState(true);
  const [dashboardAdmin, setDashboardAdmin] = useState<DashboardAdmin | null>(
    null,
  );
  const [dashboardSocio, setDashboardSocio] = useState<DashboardSocio | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        if (userRole === "admin") {
          const { data } = await api.get<DashboardAdmin>("/dashboard", {
            params: { limiteActividad: 10, limiteProximosPagos: 10 },
          });
          setDashboardAdmin(data);
        } else if (socioId) {
          const { data } = await api.get<DashboardSocio>(
            `/dashboard/socio/${socioId}`,
            {
              params: { limiteActividad: 10, limiteProximosPagos: 5 },
            },
          );
          setDashboardSocio(data);
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

  // Socio sin asignación
  if (userRole === "socio" && !loadingPartner && !socioId) {
    return (
      <SolicitudAsociacionWrapper mensaje="Aún no tienes un socio asignado" />
    );
  }

  // Skeleton de carga
  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex flex-column lg:flex-row gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-sm w-full">
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
          ))}
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
    return (
      <div className="p-4 lg:p-6">
        <Toast ref={toast} />
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">Resumen general de la caja de ahorro</p>
        </div>

        <DashboardAdminStats resumen={resumen} />

        <div className="flex flex-column lg:flex-row gap-3 mb-4">
          <Card className="shadow-sm w-full" title="Actividad Reciente">
            <DashboardActividadReciente actividad={actividadReciente} />
          </Card>
          <Card className="shadow-sm w-full" title="Próximos Pagos">
            <DashboardProximosPagos pagos={proximosPagos} />
          </Card>
        </div>

        <DashboardCharts resumen={resumen} />
      </div>
    );
  }

  // Vista Socio
  if (userRole === "socio" && dashboardSocio && socioId) {
    return (
      <>
        <Toast ref={toast} />
        <DashboardSocioView
          data={dashboardSocio}
          socioId={socioId}
          userName={`${user?.name ?? ""} ${user?.lastName ?? ""}`}
        />
      </>
    );
  }

  // Sin datos
  return (
    <div className="p-4 lg:p-6">
      <Toast ref={toast} />
      <div className="text-center py-8">
        <i
          className="pi pi-inbox mb-4"
          style={{ fontSize: "3rem", color: "#6B7280" }}
        />
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
