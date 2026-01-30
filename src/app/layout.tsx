"use client";

import { UserProvider } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { ToastProvider } from "@/context/ToastContext";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { InactivityWarningDialog } from "@/components/Auth/InactivityWarningDialog";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.scss";

import {
  FilterMatchMode,
  PrimeReactProvider,
  addLocale,
  locale,
} from "primereact/api";
import "primeflex/primeflex.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import esLocale from "@/data/es.json";
import Header from "@/components/Header/Header";
import SideBar from "@/components/SideBar/SideBar";
import FloatingActionButton from "@/components/FloatingActionButton/FloatingActionButton";

// Configurar locale de PrimeReact inmediatamente al cargar el módulo
// Esto se ejecuta tanto en server como en client
addLocale("es", esLocale.es);
locale("es");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <UserProvider>
          <LayoutContent>{children}</LayoutContent>
        </UserProvider>
      </body>
    </html>
  );
}

/* ---------------------------------------- */

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, showInactivityWarning } = useAuth();

  // Configuración de PrimeReact
  const primeConfig = {
    locale: "es",
    filterMatchMode: {
      text: [FilterMatchMode.CONTAINS],
    },
  };

  return (
    <PrimeReactProvider value={primeConfig}>
      <ToastProvider>
        <NotificationsProvider>
          <ProtectedRoute>
            <Header />

            <div className="grid">
              {isAuthenticated && user && (
                <div className="hidden lg:block lg:col-2 p-0">
                  <SideBar />
                </div>
              )}

              <div
                className={
                  isAuthenticated && user ? "col-12 lg:col-10 p-0" : "col-12"
                }
              >
                {children}
              </div>
            </div>

            {/* Botón flotante para agregar abono semanal (solo admin) */}
            <FloatingActionButton />

            {/* Diálogo de advertencia de inactividad */}
            <InactivityWarningDialog visible={showInactivityWarning} />
          </ProtectedRoute>
        </NotificationsProvider>
      </ToastProvider>
    </PrimeReactProvider>
  );
}
