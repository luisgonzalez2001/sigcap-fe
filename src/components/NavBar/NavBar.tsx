"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { redirect } from "next/navigation";

// PrimeReact
import { Menubar } from "primereact/menubar";
import { Button } from "primereact/button";

import "./NavBar.scss";

const Navbar = () => {
  const { user, setUserUser } = useUser();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserUser(null);
    redirect("/auth/login");
  };

  // Items del menú
  const items = [
    { label: "Home", url: "/" },
    ...(user ? [{ label: "Tracking Tickets", url: "/tracking" }] : []),
    ...(user?.rol === "admin"
      ? [{ label: "Administración de usuarios", url: "/users" }]
      : []),
    ...(user ? [{ label: "Perfil", url: "/profile" }] : []),
  ];

  // Sección derecha del Menubar
  const end = (
    <div className="flex align-items-center gap-3">
      {user ? (
        <>
          <span className="font-semibold">Bienvenido, {user.username}</span>
          <Button
            label="Cerrar sesión"
            icon="pi pi-sign-out"
            size="small"
            onClick={handleLogout}
            style={{
              border: "none",
              backgroundColor: "transparent",
              color: "black",
            }}
          />
        </>
      ) : (
        <>
          <Link href="/auth/signup">
            <Button
              label="Crear cuenta"
              icon="pi pi-user-plus"
              size="small"
              style={{
                border: "none",
                backgroundColor: "transparent",
                color: "black",
              }}
            />
          </Link>
          <Link href="/auth/login">
            <Button
              label="Ingresar"
              icon="pi pi-sign-in"
              size="small"
              style={{
                border: "none",
                backgroundColor: "transparent",
                color: "black",
              }}
            />
          </Link>
        </>
      )}
    </div>
  );

  return <Menubar model={items} end={end} className="navbar" />;
};

export default Navbar;
