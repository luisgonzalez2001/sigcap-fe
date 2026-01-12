"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

// PrimeReact
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Sidebar } from "primereact/sidebar";
import { Menu } from "primereact/menu";
import type { MenuItem } from "primereact/menuitem";

import "./Header.scss";

const Header = () => {
  const { user, setUserUser } = useUser();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserUser(null);
    router.push("/auth/login");
  };

  // Items del menú para el sidebar
  const menuItems: MenuItem[] = user
    ? [
        {
          label: "Navegación",
          items: [
            {
              label: "Dashboard",
              icon: "pi pi-home",
              command: () => {
                router.push("/dashboard");
                setSidebarVisible(false);
              },
            },
            {
              label: "Socios",
              icon: "pi pi-users",
              command: () => {
                router.push("/socios");
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
            ...(user.rol === "admin"
              ? [
                  {
                    label: "Scoring",
                    icon: "pi pi-chart-line",
                    command: () => {
                      router.push("/scoring");
                      setSidebarVisible(false);
                    },
                  },
                  {
                    label: "Reportes",
                    icon: "pi pi-file",
                    command: () => {
                      router.push("/reportes");
                      setSidebarVisible(false);
                    },
                  },
                  {
                    label: "Administración",
                    icon: "pi pi-shield",
                    command: () => {
                      router.push("/users");
                      setSidebarVisible(false);
                    },
                  },
                ]
              : []),
          ],
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
                setSidebarVisible(false);
              },
            },
            {
              label: "Configuración",
              icon: "pi pi-cog",
              command: () => {
                router.push("/settings");
                setSidebarVisible(false);
              },
            },
            {
              separator: true,
            },
            {
              label: "Cerrar Sesión",
              icon: "pi pi-sign-out",
              command: handleLogout,
            },
          ],
        },
      ]
    : [];

  // Obtener iniciales del usuario para el avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  return (
    <>
      {/* Header principal */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-100">
        <div className="px-4 sm:px-2 lg:px-4">
          <div
            className="flex justify-content-between lg:justify-content-between align-items-center"
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
                  <Button
                    icon="pi pi-bell"
                    rounded
                    text
                    severity="secondary"
                    badgeClassName="p-badge-danger"
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                    }}
                  />

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
      </div>

      {/* Sidebar para móvil - solo se muestra si hay usuario */}
      {user && (
        <Sidebar
          visible={sidebarVisible}
          onHide={() => setSidebarVisible(false)}
          className="w-full sm:w-80"
        >
          {/* Header del sidebar */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Avatar
                label={getUserInitials()}
                size="large"
                shape="circle"
                className="bg-blue-500 text-white"
              />
              <div>
                <p className="font-bold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">
                  {user.rol === "admin" ? "Administrador" : "Socio"}
                </p>
              </div>
            </div>
          </div>

          {/* Menú del sidebar */}
          <Menu model={menuItems} className="w-full border-none" />
        </Sidebar>
      )}
    </>
  );
};

export default Header;
