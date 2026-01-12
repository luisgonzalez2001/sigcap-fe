"use client";

import { useState } from "react";
import { Button } from "primereact/button";
import { useUser } from "@/context/UserContext";
import AbonoSemanalForm from "@/components/AbonoSemanalForm/AbonoSemanalForm";

const FloatingActionButton = () => {
  const { user } = useUser();
  const [formVisible, setFormVisible] = useState(false);

  // Solo mostrar si hay usuario logueado y es admin
  if (!user || user.rol !== "admin") {
    return null;
  }

  return (
    <>
      {/* Botón flotante */}
      <Button
        icon="pi pi-plus"
        rounded
        onClick={() => setFormVisible(true)}
        aria-label="Agregar abono semanal"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "3.5rem",
          height: "3.5rem",
          backgroundColor: "#16a34a",
          border: "none",
          boxShadow: "0 4px 14px rgba(22, 163, 74, 0.4)",
          zIndex: 1000,
          transition: "all 0.2s ease",
        }}
        className="hover:shadow-6"
        tooltip="Registrar abono semanal"
        tooltipOptions={{ position: "left" }}
      />

      {/* Formulario de abono semanal */}
      <AbonoSemanalForm
        visible={formVisible}
        onHide={() => setFormVisible(false)}
        onSuccess={() => {
          // Aquí puedes agregar lógica adicional después de un abono exitoso
          console.log("Abono registrado exitosamente");
        }}
      />
    </>
  );
};

export default FloatingActionButton;
