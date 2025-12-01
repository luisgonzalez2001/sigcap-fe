"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Menu } from "primereact/menu";

const SideBar: React.FC = () => {
  const { setUserUser } = useUser();
  const [, setSelectedView] = useState("overview");
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserUser(null);
    router.push("/auth/login");
  };

  const menuItems = [
    {
      label: "Dashboard",
      icon: "pi pi-home",
      command: () => {
        setSelectedView("overview");
        router.push("/dashboard");
      },
    },
    {
      label: "Socios",
      icon: "pi pi-users",
      command: () => setSelectedView("socios"),
    },
    {
      label: "Ahorros",
      icon: "pi pi-wallet",
      command: () => setSelectedView("ahorros"),
    },
    {
      label: "Préstamos",
      icon: "pi pi-money-bill",
      command: () => setSelectedView("prestamos"),
    },
    {
      label: "Scoring",
      icon: "pi pi-chart-line",
      command: () => setSelectedView("scoring"),
    },
    {
      label: "Reportes",
      icon: "pi pi-file",
      command: () => setSelectedView("reportes"),
    },
    {
      separator: true,
    },
    {
      label: "Cuenta",
      items: [
        {
          label: "Mi Perfil",
          icon: "pi pi-user",
          command: () => {
            router.push("/profile");
          },
        },
        {
          label: "Configuración",
          icon: "pi pi-cog",
          command: () => {
            router.push("/settings");
          },
        },
        {
          label: "Cerrar Sesión",
          icon: "pi pi-sign-out",
          command: handleLogout,
        },
      ],
    },
  ];

  return (
    <div
      style={{
        position: "sticky",
        top: "64px",
        height: "calc(100vh - 64px)",
      }}
    >
      {/* Sidebar para desktop */}
      <div className="hidden lg:block w-64 bg-white border-r border-gray-200 p-4 pt-0">
        <Menu model={menuItems} className="w-full border-none" />
      </div>
    </div>
  );
};

export default SideBar;
