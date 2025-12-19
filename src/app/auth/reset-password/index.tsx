"use client";

import { useState } from "react";
import api from "@/services/api";
import { useSearchParams, useRouter } from "next/navigation";
import type { AxiosError } from "axios";

// PrimeReact
import { Card } from "primereact/card";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";

export const ResetPassword = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!token) {
      setError("Token de recuperación no proporcionado.");
      setLoading(false);
      return;
    }

    if (!password || !repeatPassword) {
      setError("Por favor, complete todos los campos.");
      setLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      await api.put("/auth/recover", { token, password });
      setSuccess("Contraseña actualizada correctamente");
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setError(err.response?.data?.message || "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen bg-gray-100">
      <Card className="w-25rem shadow-3 p-4">
        <h2 className="text-center mb-4">Establecer Contraseña</h2>

        {error && (
          <Message
            severity="error"
            text={error}
            className="mb-3"
            onClick={() => setError("")}
          />
        )}
        {success && (
          <Message
            severity="success"
            text={success}
            className="mb-3"
            onClick={() => setSuccess("")}
          />
        )}

        <form onSubmit={handleSubmit} className="flex flex-column gap-3">
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
            <label htmlFor="password">Nueva Contraseña</label>
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

          <Button
            type="submit"
            label="Confirmar"
            icon="pi pi-check"
            className="w-full"
            disabled={loading}
          />
        </form>
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
