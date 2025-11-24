"use client";

import { UserProvider } from "@/context/UserContext";
import NavBar from "@/components/NavBar/NavBar";

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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

addLocale("es", esLocale.es);
locale("es");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const primeConfig = {
    locale: "es",
    filterMatchMode: {
      text: [FilterMatchMode.CONTAINS],
    },
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <UserProvider>
          <PrimeReactProvider value={primeConfig}>
            <NavBar />
            {children}
          </PrimeReactProvider>
        </UserProvider>
      </body>
    </html>
  );
}
