"use client";

import { useState } from "react";
import { Link } from "react-router-dom";

// PrimeReact
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";

export const RecoverAccount = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    setTimeout(async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/auth/recover-account",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setErrorMessage("Usuario no encontrado.");
          } else {
            setErrorMessage(data.message || "Ha ocurrido un error.");
          }
          return;
        }

        setSuccessMessage("Se ha enviado un correo de recuperación.");
      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message || "Ha ocurrido un error.");
        }
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen bg-gray-100">
      <Card className="w-25rem shadow-3 p-4">
        <h2 className="text-center mb-4">Recuperar Cuenta</h2>

        {successMessage && (
          <Message
            severity="success"
            text={successMessage}
            className="mb-3"
            onClick={() => setSuccessMessage("")}
          />
        )}

        {errorMessage && (
          <Message
            severity="error"
            text={errorMessage}
            className="mb-3"
            onClick={() => setErrorMessage("")}
          />
        )}

        <form onSubmit={handleLogin} className="flex flex-column gap-3 mt-3">
          <span className="p-float-label">
            <InputText
              id="email"
              type="email"
              placeholder="Correo institucional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
            />
            <label htmlFor="email">Correo institucional</label>
          </span>

          <Button
            type="submit"
            label="Restablecer"
            icon="pi pi-refresh"
            className="w-full"
          />
        </form>

        <p className="mt-4 text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link to="/auth/signup" className="text-primary">
            Regístrate
          </Link>
        </p>
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
