"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// PrimeReact
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";
import { CSSTransition } from "react-transition-group";

export const EmailVerified = () => {
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/auth/verify?token=${token}`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) throw new Error("Error al verificar email");

        setTimeout(() => {
          setSuccess(true);
          setTimeout(() => router.push("/auth/login"), 3000);
        }, 1500);
      } catch {
        router.push("/auth/login");
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex flex-column align-items-center justify-content-center min-h-screen">
      <ProgressSpinner
        style={{ width: "60px", height: "60px" }}
        strokeWidth="6"
        fill="var(--surface-ground)"
        animationDuration=".8s"
      />

      <CSSTransition
        in={success}
        timeout={1000}
        classNames="fade"
        unmountOnExit
      >
        <Card className="mt-4 text-center w-20rem shadow-2">
          <p className="text-lg font-semibold">
            ¡Tu cuenta ha sido verificada exitosamente!
          </p>
          <p className="text-sm text-color-secondary">
            Redirigiendo al inicio de sesión...
          </p>
        </Card>
      </CSSTransition>
    </div>
  );
};

export default EmailVerified;
