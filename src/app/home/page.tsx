"use client";

import Link from "next/link";
// import Image from "next/image";
import { useUser } from "@/context/UserContext";

// PrimeReact
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";

import "./home.scss";
import { useEffect } from "react";

// Datos de las características
const features = [
  {
    icon: "pi pi-wallet",
    title: "Gestión de Ahorros",
    description:
      "Administra los ahorros semanales de todos los socios de forma automática y transparente.",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    icon: "pi pi-money-bill",
    title: "Préstamos Inteligentes",
    description:
      "Solicita y aprueba préstamos con tasas justas y seguimiento en tiempo real.",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    icon: "pi pi-chart-line",
    title: "Análisis Predictivo",
    description:
      "Anticipa riesgos y toma mejores decisiones con nuestros modelos de predicción.",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    icon: "pi pi-shield",
    title: "Seguridad Total",
    description:
      "Tu información protegida con los más altos estándares de seguridad.",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  },
  {
    icon: "pi pi-bell",
    title: "Notificaciones",
    description:
      "Mantente informado con alertas instantáneas sobre movimientos y vencimientos.",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  },
  {
    icon: "pi pi-users",
    title: "Gestión de Socios",
    description:
      "Administra el registro, aprobación y seguimiento de todos los miembros.",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  },
];

// Datos de los pasos
const steps = [
  {
    number: 1,
    title: "Regístrate",
    description: "Crea tu cuenta y solicita ser parte de la caja de ahorro.",
  },
  {
    number: 2,
    title: "Ahorra Semanalmente",
    description: "Realiza tus aportaciones semanales de forma automática.",
  },
  {
    number: 3,
    title: "Solicita Préstamos",
    description:
      "Accede a préstamos con tasas preferenciales cuando lo necesites.",
  },
  {
    number: 4,
    title: "Crece tu Patrimonio",
    description: "Observa cómo tus ahorros crecen con intereses competitivos.",
  },
];

// Datos de estadísticas
const stats = [
  {
    icon: "pi pi-wallet",
    iconClass: "icon-savings",
    number: "$500K+",
    label: "En Ahorros",
  },
  {
    icon: "pi pi-money-bill",
    iconClass: "icon-loans",
    number: "150+",
    label: "Préstamos Activos",
  },
  {
    icon: "pi pi-users",
    iconClass: "icon-partners",
    number: "200+",
    label: "Socios Activos",
  },
  {
    icon: "pi pi-shield",
    iconClass: "icon-security",
    number: "99.9%",
    label: "Uptime",
  },
];

const Home = () => {
  const { user } = useUser();

  //useEffect para redirigir si ya está logueado
  useEffect(() => {
    if (user?.name) {
      window.location.href = "/dashboard";
    }
  }, [user]);

  return (
    <div className="home-container">
      {/* ========== HERO SECTION ========== */}
      <section className="hero-section">
        <div
          className="hero-content flex flex-column align-items-center justify-content-center text-center px-4 py-8"
          style={{ minHeight: "100vh" }}
        >
          {/* Logo */}
          {/* <div className="university-logo-container animate-bounce-in">
            <Image
              src="images/escudo_udg.jpeg"
              alt="Universidad de Guadalajara"
              width={90}
              height={90}
              style={{ objectFit: "contain" }}
              unoptimized
            />
          </div> */}

          {/* Badge */}
          {/* <span className="hero-badge animate-fade-in-up delay-1">
            🎓 Proyecto CUCEI - UDG
          </span> */}

          {/* Título */}
          <h1 className="hero-title animate-fade-in-up delay-2">SIGCAP</h1>

          {/* Subtítulo */}
          <p className="hero-subtitle animate-fade-in-up delay-3">
            Sistema Inteligente de Gestión de Caja de Ahorro con Análisis
            Predictivo. Digitaliza, simplifica y potencia tu caja de ahorro.
          </p>

          {/* Botones CTA */}
          {!user?.name && (
            <div className="flex gap-3 mt-5 flex-wrap justify-content-center animate-fade-in-up delay-4">
              <Link href="/auth/login">
                <Button
                  label="Iniciar Sesión"
                  icon="pi pi-sign-in"
                  className="btn-gradient p-button-lg"
                  style={{ borderRadius: "50px", padding: "1rem 2rem" }}
                />
              </Link>
              <Link href="/auth/signup">
                <Button
                  label="Crear Cuenta"
                  icon="pi pi-user-plus"
                  className="btn-gradient-success p-button-lg"
                  style={{ borderRadius: "50px", padding: "1rem 2rem" }}
                />
              </Link>
            </div>
          )}

          {user?.name && (
            <div className="flex gap-3 mt-5 animate-fade-in-up delay-4">
              <Link href="/dashboard">
                <Button
                  label="Ir al Dashboard"
                  icon="pi pi-th-large"
                  className="btn-gradient p-button-lg"
                  style={{ borderRadius: "50px", padding: "1rem 2rem" }}
                />
              </Link>
            </div>
          )}

          {/* Scroll indicator */}
          <div
            className="animate-float mt-6"
            style={{ position: "absolute", bottom: "2rem" }}
          >
            <i
              className="pi pi-chevron-down"
              style={{ fontSize: "2rem", color: "rgba(255,255,255,0.5)" }}
            />
          </div>
        </div>
      </section>

      {/* ========== STATS SECTION ========== */}
      <section className="stats-section px-4">
        <div className="stats-card">
          <div className="grid">
            {stats.map((stat, index) => (
              <div key={index} className="col-6 md:col-3">
                <div className="stat-item">
                  <div className={`stat-icon ${stat.iconClass}`}>
                    <i className={stat.icon} />
                  </div>
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES SECTION ========== */}
      <section className="features-section px-4">
        <h2 className="section-title">¿Qué puedes hacer con SIGCAP?</h2>
        <p className="section-subtitle">
          Una plataforma completa para gestionar tu caja de ahorro de forma
          moderna, segura y eficiente.
        </p>

        <div className="grid" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {features.map((feature, index) => (
            <div key={index} className="col-12 md:col-6 lg:col-4 p-3">
              <div className="feature-card">
                <div
                  className="feature-icon"
                  style={{ background: feature.gradient }}
                >
                  <i className={feature.icon} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== HOW IT WORKS SECTION ========== */}
      <section className="how-it-works-section px-4 text-center">
        <h2 className="section-title">¿Cómo funciona?</h2>
        <p className="section-subtitle">
          En solo 4 pasos puedes comenzar a disfrutar de todos los beneficios.
        </p>

        <div
          className="grid justify-content-center"
          style={{ maxWidth: "1000px", margin: "0 auto" }}
        >
          {steps.map((step, index) => (
            <div key={index} className="col-12 sm:col-6 lg:col-3">
              <div className="step-card">
                <div className="step-number">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      {!user?.name && (
        <section className="cta-section">
          <div className="cta-content px-4">
            <h2 className="cta-title">¿Listo para comenzar?</h2>
            <p className="cta-subtitle">
              Únete a nuestra comunidad de ahorradores y accede a todos los
              beneficios que SIGCAP tiene para ti.
            </p>
            <div className="cta-buttons">
              <Link href="/auth/signup">
                <button className="btn-primary-gradient">
                  <i className="pi pi-user-plus mr-2" />
                  Registrarme Ahora
                </button>
              </Link>
              <Link href="/auth/login">
                <button className="btn-outline-light">
                  <i className="pi pi-sign-in mr-2" />
                  Ya tengo cuenta
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========== FOOTER ========== */}
      <footer className="footer-section">
        <div className="text-center px-4">
          <div className="footer-logo mb-3">SIGCAP</div>
          <p style={{ maxWidth: "500px", margin: "0 auto 1.5rem" }}>
            Sistema Inteligente de Gestión de Caja de Ahorro con Análisis
            Predictivo y Arquitectura Distribuida
          </p>

          <div className="footer-links mb-4">
            <a
              href="https://cucei.udg.mx"
              target="_blank"
              rel="noopener noreferrer"
            >
              CUCEI
            </a>
            <a
              href="https://www.udg.mx"
              target="_blank"
              rel="noopener noreferrer"
            >
              UDG
            </a>
          </div>

          <Divider className="footer-divider" />

          <div className="footer-credits">
            {/* <p className="mb-2">
              Proyecto Modular desarrollado por{" "}
              <strong style={{ color: "#667eea" }}>Luis González</strong> &{" "}
              <strong style={{ color: "#667eea" }}>Christian Ramos</strong>
            </p> */}
            <p>
              &copy; {new Date().getFullYear()} CUCEI - Universidad de
              Guadalajara. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
