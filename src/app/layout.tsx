"use client";

import { UserProvider, useUser } from "@/context/UserContext";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.scss";
import { useEffect } from "react";

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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <UserProvider>
          <LayoutContent>{children}</LayoutContent>
        </UserProvider>
      </body>
    </html>
  );
}

/* ---------------------------------------- */

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  useEffect(() => {
    addLocale("es", esLocale.es);
    locale("es");
  }, []);

  const primeConfig = {
    locale: "es",
    filterMatchMode: {
      text: [FilterMatchMode.CONTAINS],
    },
  };

  return (
    <PrimeReactProvider value={primeConfig}>
      <Header />

      <div className="grid">
        {user && (
          <div className="hidden lg:block lg:col-2">
            <SideBar />
          </div>
        )}

        <div className={user ? "col-12 lg:col-10" : "col-12"}>{children}</div>
      </div>

      {/* Botón flotante para agregar abono semanal (solo admin) */}
      <FloatingActionButton />
    </PrimeReactProvider>
  );
}
