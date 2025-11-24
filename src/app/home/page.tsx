"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";

// PrimeReact
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Image } from "primereact/image";

import "./home.scss";

export const Home = () => {
  const { user } = useUser();

  return (
    <div className="home-container flex flex-column align-items-center justify-content-center p-4">
      {/* Header */}
      <header className="w-full text-center mb-5">
        <Image
          src="https://www.udg.mx/sites/default/files/Escudo_udg.png"
          alt="Universidad de Guadalajara Logo"
          className="university-logo"
        />
        <h1 className="mt-3 text-4xl font-bold">SIGCAP</h1>
        <p className="mt-2 text-lg text-color-secondary">
          Sistema Inteligente de Gestión de Caja de Ahorro con Análisis
          Predictivo y Arquitectura Distribuida
        </p>
      </header>

      {/* Main */}
      <Card className="w-full md:w-8 text-center shadow-2 card-home">
        <h2 className="text-2xl font-semibold mb-3">¿Cómo funciona?</h2>
        <p className="text-color-secondary mb-4">
          SIGCAP digitaliza la caja de ahorro: reduce errores, anticipa riesgos
          y mejora la gestión operativa
        </p>

        {!user?.username && (
          <div
            className="mt-4"
            style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
          >
            <Link href="/auth/login">
              <Button label="Iniciar Sesión" icon="pi pi-sign-in" />
            </Link>
            <Link href="/auth/signup">
              <Button
                label="Registrarse"
                icon="pi pi-user-plus"
                severity="success"
              />
            </Link>
          </div>
        )}
      </Card>

      {/* Footer */}
      <footer className="w-full text-center mt-6 text-color-secondary">
        <Divider />
        <p>Proyecto modular en proceso by Luis Gonzalez & Christian Ramos</p>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} CUCEI - Universidad de Guadalajara
        </p>
        <div className="mt-2 flex justify-content-center gap-2">
          <a href="https://cucei.udg.mx" className="text-primary">
            cucei.udg.mx
          </a>
          <span>|</span>
          <a href="https://www.udg.mx" className="text-primary">
            udg.mx
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
