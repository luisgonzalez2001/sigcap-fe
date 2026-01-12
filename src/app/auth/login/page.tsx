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

// Estilos
import "./Login.scss";

export const Login = () => {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { setUserUser } = useUser();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    setTimeout(async () => {
      try {
        const { data } = await api.post("/auth/login", { email, password });

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUserUser(data.user);
        console.log("inicio correcto");
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
                err.response.data?.message || "Ha ocurrido un error."
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
        <h2 className="text-center mb-4">Login</h2>

        {errorMessage && (
          <Message
            severity="error"
            text={errorMessage}
            className="mb-3"
            onClick={() => setErrorMessage("")}
          />
        )}

        <form onSubmit={handleLogin} className="flex flex-column gap-3">
          <span className="p-float-label">
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
            <label htmlFor="email">Correo</label>
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
