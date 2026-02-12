"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Knob } from "primereact/knob";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { getScoringBySocio } from "@/services/scoring-api";
import type { ScoringResult, NivelRiesgo } from "@/types/Scoring";

interface CreditScoringCardProps {
  socioId: string;
}

const getRiesgoConfig = (nivel: NivelRiesgo) => {
  const config: Record<
    NivelRiesgo,
    {
      label: string;
      severity: "success" | "info" | "warning" | "danger";
      color: string;
      description: string;
    }
  > = {
    bajo: {
      label: "Bajo",
      severity: "success",
      color: "#059669",
      description: "Excelente historial crediticio",
    },
    medio: {
      label: "Medio",
      severity: "info",
      color: "#2563EB",
      description: "Buen historial crediticio",
    },
    alto: {
      label: "Alto",
      severity: "warning",
      color: "#D97706",
      description: "Historial crediticio con áreas de mejora",
    },
  };
  return config[nivel] || config.medio;
};

const getScoreColor = (score: number): string => {
  if (score >= 75) return "#059669"; // Verde para score alto (75-100)
  if (score >= 50) return "#2563EB"; // Azul para score medio-alto (50-74)
  if (score >= 30) return "#D97706"; // Naranja para score medio-bajo (30-49)
  return "#DC2626"; // Rojo para score bajo (0-29)
};

export default function CreditScoringCard({ socioId }: CreditScoringCardProps) {
  const [scoring, setScoring] = useState<ScoringResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!socioId) return;

    const loadScoring = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await getScoringBySocio(socioId);
        setScoring(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadScoring();
  }, [socioId]);

  if (loading) {
    return (
      <Card className="shadow-sm w-full">
        <div
          className="flex align-items-center gap-3"
          style={{ padding: "0.5rem" }}
        >
          <Skeleton shape="circle" size="5rem" />
          <div className="flex-1">
            <Skeleton width="60%" height="1rem" className="mb-2" />
            <Skeleton width="80%" height="1.5rem" className="mb-2" />
            <Skeleton width="40%" height="0.875rem" />
          </div>
        </div>
      </Card>
    );
  }

  if (error || !scoring) {
    return null; // Silently fail - scoring may not be available yet
  }

  const riesgoConfig = getRiesgoConfig(scoring.riesgo as NivelRiesgo);
  const scoreColor = getScoreColor(scoring.score);

  return (
    <Card className="shadow-sm w-full">
      <div
        className="flex align-items-center gap-4"
        style={{ padding: "0.5rem" }}
      >
        <div className="flex flex-column align-items-center">
          <Knob
            value={scoring.score}
            max={100}
            readOnly
            size={80}
            valueColor={scoreColor}
            rangeColor="#E2E8F0"
            valueTemplate="{value}"
            textColor={scoreColor}
          />
        </div>
        <div className="flex-1">
          <div className="flex align-items-center gap-2 mb-1">
            <p
              className="m-0"
              style={{ color: "#6B7280", fontSize: "0.875rem" }}
            >
              Credit Score
            </p>
            <Tag
              value={riesgoConfig.label}
              severity={riesgoConfig.severity}
              style={{ fontSize: "0.7rem" }}
            />
          </div>
          <p
            className="m-0 mb-1"
            style={{ fontSize: "0.8rem", color: "#6B7280" }}
          >
            {riesgoConfig.description}
          </p>
          {scoring.monto_maximo_recomendado > 0 && (
            <p
              className="m-0"
              style={{ fontSize: "0.75rem", color: "#059669" }}
            >
              <i
                className="pi pi-check-circle mr-1"
                style={{ fontSize: "0.625rem" }}
              />
              Puedes solicitar hasta{" "}
              <strong>
                {scoring.monto_maximo_recomendado.toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </strong>
            </p>
          )}
        </div>
      </div>

      {/* Factores principales */}
      {scoring.factores_principales &&
        scoring.factores_principales.length > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #E5E7EB" }}>
            <p className="text-sm text-600 m-0 mb-2 font-semibold">
              Factores Principales
            </p>
            <div className="flex flex-column gap-1">
              {scoring.factores_principales.slice(0, 3).map((factor, index) => (
                <div
                  key={index}
                  className="flex align-items-center gap-1"
                  style={{ fontSize: "0.7rem", color: "#6B7280" }}
                >
                  <i
                    className="pi pi-check text-green-600"
                    style={{ fontSize: "0.6rem" }}
                  />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>
        )}
    </Card>
  );
}
