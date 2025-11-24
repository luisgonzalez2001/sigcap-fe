"use client";

import { useState } from "react";
import Link from "next/link";

// PrimeReact
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";

interface UserFormProps {
  isSignUp: boolean;
}

export const SignUP = ({ isSignUp }: UserFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCreated, setUserCreated] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isSignUp && password !== repeatPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    const userData = isSignUp
      ? { name, email, username, password }
      : { name, email, username, password: "cutonala1234" };

    setTimeout(async () => {
      try {
        const url = isSignUp
          ? "http://localhost:3000/auth/signup"
          : "http://localhost:3000/auth/signup/add-user";
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 409) {
            setError(
              "Este correo electrónico ya está registrado. Por favor, utiliza otro."
            );
          } else {
            setError(errorData.message || "Error al crear el usuario.");
          }
          return;
        }

        setUserCreated(true);
        setName("");
        setEmail("");
        setUsername("");
        setPassword("");
        setRepeatPassword("");
      } catch {
        setError("Error al crear el usuario.");
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen bg-gray-100">
      <Card className="w-25rem shadow-3 p-4">
        <h2 className="text-center mb-4">
          {isSignUp ? "SignUp" : "Añadir Usuario"}
        </h2>

        {userCreated && (
          <Message
            severity="success"
            text="¡Usuario creado correctamente!"
            className="mb-3"
            onClick={() => setUserCreated(false)}
          />
        )}

        {error && (
          <Message
            severity="error"
            text={error}
            className="mb-3"
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
            />
            <label htmlFor="name">Nombre</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
            />
            <label htmlFor="email">Email</label>
          </span>

          <span className="p-float-label">
            <InputText
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
              required
            />
            <label htmlFor="username">Usuario</label>
          </span>

          {isSignUp && (
            <>
              <span className="p-float-label">
                <Password
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  feedback={false}
                  toggleMask
                  className="w-full"
                  required
                />
                <label htmlFor="password">Contraseña</label>
              </span>

              <span className="p-float-label">
                <Password
                  id="repeatPassword"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  feedback={false}
                  toggleMask
                  className="w-full"
                  required
                />
                <label htmlFor="repeatPassword">Repetir Contraseña</label>
              </span>
            </>
          )}

          <Button
            type="submit"
            label="Registrar Usuario"
            icon="pi pi-user-plus"
            className="w-full"
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
