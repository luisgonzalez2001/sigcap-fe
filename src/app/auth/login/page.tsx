"use client";

import { useState } from "react";
import { useUser } from "../../../context/UserContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import type { AxiosError } from "axios";

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

const Login = () => {
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState(""); // email o teléfono
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { setUserUser, setSocioExtra } = useUser();
  const router = useRouter();

  const loginMethodOptions = [
    { label: "Correo", value: "email", icon: "pi pi-envelope" },
    { label: "Teléfono", value: "phone", icon: "pi pi-phone" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

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

    setTimeout(async () => {
      try {
        // Construir body según método de login
        const loginBody =
          loginMethod === "email"
            ? { email: identifier, password }
            : { phoneNumber: identifier, password };

        const { data } = await api.post("/auth/login", loginBody);

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUserUser(data.user);

        // Si el usuario es socio, obtener datos de partner
        if (data.user.rol === "socio") {
          const partnerRes = await api.get(`/partners/usuario/${data.user.id}`);
          const partner = Array.isArray(partnerRes.data)
            ? partnerRes.data[0]
            : partnerRes.data;
          console.log("Datos del partner:", partnerRes);
          if (partner && partner.n_socio) {
            const socioExtra = {
              id: partner.id,
              n_socio: partner.n_socio,
              monto_semanal: partner.monto_semanal,
            };
            setSocioExtra(socioExtra);
            localStorage.setItem("socioExtra", JSON.stringify(socioExtra));
          }
        } else {
          setSocioExtra(null);
          localStorage.removeItem("socioExtra");
        }
        router.push("/dashboard");
      } catch (error) {
        const err = error as AxiosError<{ message?: string }>;
        if (err.response) {
          switch (err.response.status) {
            case 401:
              setErrorMessage("Correo electrónico no verificado.");
              break;
            case 404:
              setErrorMessage("Usuario no encontrado.");
              break;
            case 403:
              setErrorMessage("Contraseña incorrecta.");
              break;
            default:
              setErrorMessage(
                err.response.data?.message || "Ha ocurrido un error.",
              );
          }
        } else {
          setErrorMessage(err.message || "Ha ocurrido un error.");
        }
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen bg-gray-100">
      <Card className="w-25rem shadow-3">
        <h2 className="text-center mb-4">Iniciar Sesión</h2>

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
          <div className="flex text-center mb-2">
            <SelectButton
              value={loginMethod}
              onChange={(e) => {
                setLoginMethod(e.value);
                setIdentifier(""); // Limpiar al cambiar método
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
            className="w-full"
            loading={loading}
          />
        </form>

        <p className="mt-3 text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link href="/auth/signup" className="text-primary">
            Regístrate
          </Link>
        </p>

        {errorMessage === "Contraseña incorrecta." && (
          <p className="text-red-500 text-sm mt-2 text-center">
            Si olvidaste tu contraseña, puedes{" "}
            <Link href="/auth/recover-account" className="text-primary">
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
};

export default Login;
