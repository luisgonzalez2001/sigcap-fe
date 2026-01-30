"use client";

import { createContext, useContext, useRef, ReactNode } from "react";
import { Toast } from "primereact/toast";
import type { ToastMessage } from "primereact/toast";

interface ToastContextType {
  showToast: (message: ToastMessage) => void;
  showSuccess: (summary: string, detail?: string) => void;
  showError: (summary: string, detail?: string) => void;
  showInfo: (summary: string, detail?: string) => void;
  showWarn: (summary: string, detail?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toastRef = useRef<Toast>(null);

  const showToast = (message: ToastMessage) => {
    toastRef.current?.show(message);
  };

  const showSuccess = (summary: string, detail?: string) => {
    showToast({
      severity: "success",
      summary,
      detail,
      life: 3000,
    });
  };

  const showError = (summary: string, detail?: string) => {
    showToast({
      severity: "error",
      summary,
      detail,
      life: 4000,
    });
  };

  const showInfo = (summary: string, detail?: string) => {
    showToast({
      severity: "info",
      summary,
      detail,
      life: 3000,
    });
  };

  const showWarn = (summary: string, detail?: string) => {
    showToast({
      severity: "warn",
      summary,
      detail,
      life: 4000,
    });
  };

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showInfo, showWarn }}
    >
      <Toast ref={toastRef} position="top-right" />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
