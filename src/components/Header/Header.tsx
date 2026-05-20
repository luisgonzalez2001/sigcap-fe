"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// PrimeReact
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Sidebar } from "primereact/sidebar";
import { Menu } from "primereact/menu";
import type { MenuItem } from "primereact/menuitem";

// Components
import { NotificationsBell } from "@/components/Notifications/NotificationsBell";

import "./Header.scss";

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Items del menú para el sidebar - misma estructura que SideBar
  const menuItems: MenuItem[] = user
    ? [
        {
          label: "Dashboard",
          icon: "pi pi-home",
          command: () => {
            router.push("/dashboard");
            setSidebarVisible(false);
          },
        },
        // Solo admin puede ver estos links
        ...(user.rol === "admin"
          ? [
              {
                label: "Socios",
                icon: "pi pi-users",
                command: () => {
                  router.push("/socios");
                  setSidebarVisible(false);
                },
              },
              {
                label: "Usuarios",
                icon: "pi pi-user-edit",
                command: () => {
                  router.push("/usuarios");
                  setSidebarVisible(false);
                },
              },
              {
                label: "Solicitudes",
                icon: "pi pi-user-plus",
                command: () => {
                  router.push("/solicitudes");
                  setSidebarVisible(false);
                },
              },
              {
                label: "Ahorros",
                icon: "pi pi-wallet",
                command: () => {
                  router.push("/ahorros");
                  setSidebarVisible(false);
                },
              },
              {
                label: "Préstamos",
                icon: "pi pi-money-bill",
                command: () => {
                  router.push("/prestamos");
                  setSidebarVisible(false);
                },
              },
              {
                label: "Scoring",
                icon: "pi pi-chart-line",
                command: () => {
                  router.push("/scoring");
                  setSidebarVisible(false);
                },
              },
            ]
          : [
              // Links para socios: solo préstamos (sus propios)
              {
                label: "Mis Préstamos",
                icon: "pi pi-money-bill",
                command: () => {
                  router.push("/prestamos");
                  setSidebarVisible(false);
                },
              },
            ]),
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
                setSidebarVisible(false);
              },
            },
            {
              label: "Cerrar Sesión",
              icon: "pi pi-sign-out",
              command: () => {
                logout();
                setSidebarVisible(false);
              },
            },
          ],
        },
      ]
    : [];

  // Obtener iniciales del usuario para el avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const firstName = user.name.charAt(0);
    const lastName = user.lastName?.charAt(0) || "";
    return `${firstName}${lastName}`.toUpperCase();
  };

  return (
    <>
      {/* Header principal */}
      <header className="app-header bg-white shadow-1">
        <div className="px-3 sm:px-2 lg:px-4">
          <div
            className="flex justify-content-between lg:justify-content-between align-items-center py-2"
            style={{ position: "relative" }}
          >
            {/* Botón de menú - Solo mobile */}
            {user && (
              <Button
                icon="pi pi-bars"
                className="lg:hidden"
                onClick={() => setSidebarVisible(true)}
                text
                severity="secondary"
                style={{ position: "absolute", left: 0 }}
              />
            )}

            {/* Logo - Centrado en mobile, izquierda en desktop */}
            <div className="flex align-items-center gap-4 w-full lg:w-auto justify-content-center lg:justify-content-start">
              <Link
                href="/dashboard"
                className="flex align-items-center"
                style={{ textDecoration: "none", color: "#000" }}
              >
                <h1 className="text-xl sm:text-2xl font-bold cursor-pointer">
                  <i className="pi pi-shield mr-2"></i>
                  SIGCAP
                </h1>
              </Link>
            </div>

            {/* Sección derecha */}
            <div
              className="flex align-items-center gap-2 sm:gap-4"
              style={{ position: "absolute", right: 0 }}
            >
              {user ? (
                <>
                  {/* Notificaciones - Visible en todas las pantallas */}
                  <NotificationsBell />

                  {/* Avatar con nombre (solo en desktop) */}
                  <div className="hidden lg:flex align-items-center gap-2">
                    <span className="font-semibold text-gray-700">
                      {user.name}
                    </span>
                    <Link href="/profile">
                      <Avatar
                        label={getUserInitials()}
                        shape="circle"
                        className="text-white cursor-pointer hover:bg-blue-600 transition-colors"
                        style={{ backgroundColor: "blue" }}
                      />
                    </Link>
                  </div>

                  {/* Solo avatar en mobile */}
                  <Link href="/profile" className="lg:hidden">
                    <Avatar
                      label={getUserInitials()}
                      shape="circle"
                      className="text-white cursor-pointer hover:bg-blue-600 transition-colors"
                      style={{ backgroundColor: "blue" }}
                    />
                  </Link>
                </>
              ) : (
                <div className="flex align-items-center gap-4">
                  {/* Botones de auth cuando no hay usuario */}
                  <Link href="/auth/signup" className="hidden sm:block">
                    <Button
                      label="Crear cuenta"
                      icon="pi pi-user-plus"
                      size="small"
                      outlined
                      severity="secondary"
                    />
                  </Link>
                  <Link href="/auth/login" className="hidden sm:block">
                    <Button
                      label="Ingresar"
                      icon="pi pi-sign-in"
                      size="small"
                      severity="secondary"
                      outlined
                    />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Espaciador para compensar el header fijo */}
      <div className="header-spacer"></div>

      {/* Sidebar para móvil - solo se muestra si hay usuario */}
      {user && (
        <Sidebar
          visible={sidebarVisible}
          onHide={() => setSidebarVisible(false)}
          className="w-full sm:w-80"
          header={
            <div className="flex align-items-center gap-3">
              <Avatar
                label={getUserInitials()}
                size="large"
                shape="circle"
                style={{
                  backgroundColor: "#2563EB",
                  color: "white",
                  flexShrink: 0,
                }}
              />
              <div>
                <p className="m-0 font-bold text-gray-900">
                  {user.name} {user.lastName}
                </p>
                <p className="m-0 text-sm" style={{ color: "#6B7280" }}>
                  {user.rol === "admin" ? "Administrador" : "Socio"}
                </p>
              </div>
            </div>
          }
        >
          {/* Menú del sidebar */}
          <Menu model={menuItems} className="w-full border-none" />
        </Sidebar>
      )}
    </>
  );
};

export default Header;
