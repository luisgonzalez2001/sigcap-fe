"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/services/api";
import type { AxiosError } from "axios";
import type { LoginResponse } from "@/types/Auth";
import { getErrorMessage } from "@/types/Auth";

// PrimeReact
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";
import { SelectButton } from "primereact/selectbutton";

// Estilos
import "./Login.scss";

type LoginMethod = "email" | "phone";

// Mensajes según la razón de redirección
const REDIRECT_REASONS: Record<
  string,
  { severity: "info" | "warn"; message: string }
> = {
  inactivity: {
    severity: "warn",
    message:
      "Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.",
  },
  session_expired: {
    severity: "warn",
    message: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
  },
  unauthorized: {
    severity: "info",
    message: "Necesitas iniciar sesión para acceder a esa página.",
  },
};

// Componente interno que usa useSearchParams
function LoginForm() {
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState<{
    severity: "info" | "warn";
    message: string;
  } | null>(null);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Esperar a que el componente se monte en el cliente para evitar errores de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mostrar mensaje según la razón de redirección
  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason && REDIRECT_REASONS[reason]) {
      setInfoMessage(REDIRECT_REASONS[reason]);
    }
  }, [searchParams]);

  const loginMethodOptions = [
    { label: "Correo", value: "email", icon: "pi pi-envelope" },
    { label: "Teléfono", value: "phone", icon: "pi pi-phone" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setInfoMessage(null);

    // Validar campo
    if (!identifier.trim()) {
      setErrorMessage(
        loginMethod === "email"
          ? "Ingresa tu correo electrónico"
          : "Ingresa tu número de teléfono",
      );
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Ingresa tu contraseña");
      setLoading(false);
      return;
    }

    try {
      // Construir body según método de login
      const loginBody =
        loginMethod === "email"
          ? { email: identifier, password }
          : { phoneNumber: identifier, password };

      const { data } = await api.post<LoginResponse>("/auth/login", loginBody);

      // Usar el nuevo método de login del AuthContext
      await login(data);

      // Redirigir a la página original o dashboard según rol
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        // Siempre redirigir a dashboard
        router.push("/dashboard");
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      const errorCode = err.response?.data?.message || "";

      // Mapear errores específicos
      if (err.response) {
        switch (err.response.status) {
          case 401:
          case 403:
          case 404:
            // Usar el mensaje mapeado del error
            setErrorMessage(getErrorMessage(errorCode));
            break;
          default:
            setErrorMessage(
              getErrorMessage(errorCode) || "Ha ocurrido un error de conexión.",
            );
        }
      } else {
        setErrorMessage(err.message || "Ha ocurrido un error de conexión.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras se monta el componente para evitar errores de hidratación
  if (!mounted) {
    return (
      <div className="login-loading">
        <ProgressSpinner
          style={{ width: "50px", height: "50px" }}
          strokeWidth="4"
        />
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="login-container">
      <Card className="login-card">
        <h2 className="login-title">Iniciar Sesión</h2>

        {/* Mensaje informativo (razón de redirección) */}
        {infoMessage && (
          <Message
            severity={infoMessage.severity}
            text={infoMessage.message}
            className="mb-3 w-full"
            style={{ cursor: "pointer" }}
            onClick={() => setInfoMessage(null)}
          />
        )}

        {/* Mensaje de error */}
        {errorMessage && (
          <Message
            severity="error"
            text={errorMessage}
            className="mb-3 w-full"
            style={{ cursor: "pointer" }}
            onClick={() => setErrorMessage("")}
          />
        )}

        <form onSubmit={handleLogin} className="flex flex-column gap-3">
          {/* Selector de método de login */}
          <div className="login-method-selector mb-2 text-center">
            <SelectButton
              value={loginMethod}
              onChange={(e) => {
                if (e.value) {
                  setLoginMethod(e.value);
                  setIdentifier("");
                }
              }}
              options={loginMethodOptions}
              optionLabel="label"
              optionValue="value"
              className="w-full"
              itemTemplate={(option) => (
                <div className="flex align-items-center gap-2 px-2">
                  <i className={option.icon}></i>
                  <span>{option.label}</span>
                </div>
              )}
            />
          </div>

          {/* Campo de email o teléfono */}
          <span className="p-float-label">
            <InputText
              id="identifier"
              type={loginMethod === "email" ? "email" : "tel"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full"
              keyfilter={loginMethod === "phone" ? /[\d+\-\s()]/ : undefined}
            />
            <label htmlFor="identifier">
              {loginMethod === "email"
                ? "Correo electrónico"
                : "Número de teléfono"}
            </label>
          </span>

          <span className="p-float-label">
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
              inputStyle={{ width: "100%" }}
            />
            <label htmlFor="password">Contraseña</label>
          </span>

          <Button
            type="submit"
            label="Ingresar"
            icon="pi pi-sign-in"
            className="w-full login-button"
            loading={loading}
          />
        </form>

        <p className="mt-3 text-center text-sm text-600">
          ¿No tienes una cuenta?{" "}
          <Link href="/auth/signup" className="login-link">
            Regístrate
          </Link>
        </p>

        {errorMessage === "Contraseña incorrecta." && (
          <p className="text-sm mt-2 text-center" style={{ color: "#ef4444" }}>
            Si olvidaste tu contraseña, puedes{" "}
            <Link href="/auth/recover-account" className="login-link">
              restablecerla aquí
            </Link>
            .
          </p>
        )}
      </Card>

      {/* Loader con PrimeReact Dialog */}
      <Dialog
        visible={loading}
        closable={false}
        showHeader={false}
        className="flex justify-content-center align-items-center"
        onHide={() => setLoading(false)}
      >
        <ProgressSpinner />
      </Dialog>
    </div>
  );
}

// Componente de loading para el Suspense
function LoginLoading() {
  return (
    <div className="login-loading">
      <ProgressSpinner
        style={{ width: "50px", height: "50px" }}
        strokeWidth="4"
      />
      <p>Cargando...</p>
    </div>
  );
}

// Componente principal con Suspense wrapper
const Login = () => {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
};

export default Login;
