"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import type { AxiosError } from "axios";

// PrimeReact
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";

//types
import { CreateUserDto } from "@/types/UserDto";

// Estilos
import "./Signup.scss";

const SignUP = () => {
  const router = useRouter();
  const isSignUp = true;
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [lastName, setlastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCreated, setUserCreated] = useState(false);
  const [error, setError] = useState("");

  // Esperar a que el componente se monte en el cliente para evitar errores de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Validación de contraseña
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === repeatPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validar longitud de contraseña
    if (isSignUp && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setLoading(false);
      return;
    }

    // Validar que coincidan las contraseñas
    if (isSignUp && !doPasswordsMatch) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    const userData: CreateUserDto = isSignUp
      ? { name, lastName, email, phoneNumber, password }
      : { name, lastName, email, phoneNumber, password: "1234" };

    try {
      const url = isSignUp ? "/auth/signup" : "/auth/signup/add-user";
      const headers = isSignUp
        ? { "Content-Type": "application/json" }
        : {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          };
      await api.post(url, userData, { headers });
      setUserCreated(true);
      setName("");
      setlastName("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
      setRepeatPassword("");

      // Esperar 3 segundos y redirigir a login
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      if (err.response && err.response.status === 409) {
        setError(
          "Este correo electrónico ya está registrado. Por favor, utiliza otro.",
        );
      } else {
        setError(err.response?.data?.message || "Error al crear el usuario.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras se monta el componente para evitar errores de hidratación
  if (!mounted) {
    return (
      <div className="flex justify-content-center align-items-center min-h-screen bg-gray-100">
        <ProgressSpinner
          style={{ width: "50px", height: "50px" }}
          strokeWidth="4"
        />
      </div>
    );
  }

  return (
    <div className="signup-container flex justify-content-center align-items-center mt-6 bg-gray-100">
      <Card className="w-full max-w-25rem shadow-3 p-3 m-3">
        <h2 className="text-center mb-4">
          {isSignUp ? "Registro" : "Añadir Usuario"}
        </h2>

        {userCreated && (
          <Message
            severity="info"
            text="¡Registro exitoso! Necesitas verificar tu correo electrónico. Redirigiendo al login..."
            className="mb-3 w-full"
          />
        )}

        {error && (
          <Message
            severity="error"
            text={error}
            className="mb-3 w-full"
            style={{ cursor: "pointer" }}
            onClick={() => setError("")}
          />
        )}

        <form onSubmit={handleSubmit} className="flex flex-column gap-3">
          <span className="p-float-label">
            <InputText
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              required
              disabled={userCreated}
            />
            <label htmlFor="name">Nombre(s)</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="lastname"
              value={lastName}
              onChange={(e) => setlastName(e.target.value)}
              className="w-full"
              required
              disabled={userCreated}
            />
            <label htmlFor="username">Apellido(s)</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
              disabled={userCreated}
            />
            <label htmlFor="email">Email</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full"
              required
              disabled={userCreated}
            />
            <label htmlFor="phoneNumber">Teléfono</label>
          </span>

          {isSignUp && (
            <>
              <div>
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
                    required
                    disabled={userCreated}
                    invalid={password.length > 0 && !isPasswordValid}
                  />
                  <label htmlFor="password">Contraseña</label>
                </span>
                {password.length > 0 && !isPasswordValid && (
                  <small className="p-error block mt-1">
                    La contraseña debe tener al menos 8 caracteres
                  </small>
                )}
              </div>

              <div>
                <span className="p-float-label">
                  <Password
                    id="repeatPassword"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    feedback={false}
                    toggleMask
                    className="w-full"
                    inputClassName="w-full"
                    inputStyle={{ width: "100%" }}
                    required
                    disabled={userCreated}
                    invalid={repeatPassword.length > 0 && !doPasswordsMatch}
                  />
                  <label htmlFor="repeatPassword">Repetir Contraseña</label>
                </span>
                {repeatPassword.length > 0 && !doPasswordsMatch && (
                  <small className="p-error block mt-1">
                    Las contraseñas no coinciden
                  </small>
                )}
              </div>
            </>
          )}

          <Button
            type="submit"
            label="Registrar Usuario"
            icon="pi pi-user-plus"
            className="w-full"
            disabled={
              userCreated ||
              (isSignUp && (!isPasswordValid || !doPasswordsMatch))
            }
          />
        </form>

        {isSignUp && (
          <p className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/auth/login" className="text-primary">
              Inicia sesión
            </Link>
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

export default SignUP;
