import { Carousel } from "primereact/carousel";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Knob } from "primereact/knob";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { useState } from "react";
import type { ScoringSocioResumen, NivelRiesgo } from "@/types/Scoring";

interface ScoringCarouselProps {
  scorings: ScoringSocioResumen[];
  onVerDetalle: (socio: ScoringSocioResumen) => void;
  onRecalcular: (socioId: string) => void;
  recalculando: string | null;
  onRecalcularMasivo: () => void;
  recalculandoMasivo: boolean;
}

const riesgoOptions = [
  { label: "Bajo", value: "bajo" },
  { label: "Medio", value: "medio" },
  { label: "Alto", value: "alto" },
];

const getRiesgoConfig = (nivel: NivelRiesgo) => {
  const config: Record<
    NivelRiesgo,
    {
      label: string;
      severity: "success" | "info" | "warning" | "danger";
      color: string;
    }
  > = {
    bajo: { label: "Bajo", severity: "success", color: "#059669" },
    medio: { label: "Medio", severity: "info", color: "#2563EB" },
    alto: { label: "Alto", severity: "warning", color: "#D97706" },
  };
  return config[nivel] || config.medio;
};

const getScoreColor = (score: number): string => {
  if (score >= 75) return "#059669";
  if (score >= 50) return "#2563EB";
  if (score >= 30) return "#D97706";
  return "#DC2626";
};

const formatCurrency = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

type RiesgoFilterValue = NivelRiesgo | "";

const ScoringCarousel = ({
  scorings,
  onVerDetalle,
  onRecalcular,
  recalculando,
  onRecalcularMasivo,
  recalculandoMasivo,
}: ScoringCarouselProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [riesgoFilter, setRiesgoFilter] = useState<RiesgoFilterValue>("");

  const filteredScorings = scorings.filter((s) => {
    const matchSearch =
      !searchValue.trim() ||
      s.nombre_socio.toLowerCase().includes(searchValue.toLowerCase()) ||
      String(s.n_socio).includes(searchValue);
    const matchRiesgo = !riesgoFilter || s.riesgo === riesgoFilter;
    return matchSearch && matchRiesgo;
  });

  const responsiveOptions = [
    { breakpoint: "1440px", numVisible: 3, numScroll: 1 },
    { breakpoint: "1024px", numVisible: 2, numScroll: 1 },
    { breakpoint: "560px", numVisible: 1, numScroll: 1 },
  ];

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const scoringCardTemplate = (socio: ScoringSocioResumen) => {
    const riesgoConfig = getRiesgoConfig(socio.riesgo as NivelRiesgo);

    return (
      <div style={{ position: "relative", padding: "1rem 0.5rem" }}>
        <Card className="shadow-3">
          <div className="flex flex-column align-items-center text-center gap-3 py-2">
            {/* Avatar */}
            <div
              className="flex align-items-center justify-content-center"
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontSize: "1.25rem",
                fontWeight: "bold",
              }}
            >
              {getInitials(socio.nombre_socio)}
            </div>

            {/* Name */}
            <div className="w-full">
              <p
                className="m-0"
                style={{ fontSize: "1.125rem", fontWeight: "bold" }}
              >
                {socio.nombre_socio}
              </p>
              <p
                className="m-0 mt-1"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                  color: "#6366F1",
                }}
              >
                Socio #{socio.n_socio}
              </p>
            </div>

            {/* Score Knob */}
            <Knob
              value={socio.score}
              max={100}
              readOnly
              size={80}
              valueColor={getScoreColor(socio.score)}
              rangeColor="#E2E8F0"
              valueTemplate="{value}"
              textColor={getScoreColor(socio.score)}
              strokeWidth={8}
            />

            {/* Riesgo + Elegibilidad */}
            <div className="flex gap-2 align-items-center justify-content-center">
              <Tag
                value={riesgoConfig.label}
                severity={riesgoConfig.severity}
              />
              {socio.elegible ? (
                <Tag value="Elegible" severity="success" icon="pi pi-check" />
              ) : (
                <Tag value="No elegible" severity="danger" icon="pi pi-times" />
              )}
            </div>

            {/* Monto máximo */}
            <div
              className="w-full p-2 border-round"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <p className="m-0" style={{ fontSize: "0.75rem", color: "#666" }}>
                Monto máximo recomendado
              </p>
              <p
                className="m-0 mt-1"
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "bold",
                  color: "#16a34a",
                }}
              >
                {formatCurrency(socio.monto_maximo_recomendado)}
              </p>
            </div>

            {/* Fecha */}
            <p className="m-0" style={{ fontSize: "0.75rem", color: "#999" }}>
              Actualizado: {formatDate(socio.fecha_calculo)}
            </p>

            {/* Actions */}
            <div className="flex gap-2 w-full justify-content-center">
              <Button
                label="Ver detalle"
                icon="pi pi-eye"
                severity="info"
                size="small"
                outlined
                onClick={() => onVerDetalle(socio)}
              />
              <Button
                icon="pi pi-refresh"
                severity="warning"
                size="small"
                outlined
                tooltip="Recalcular"
                loading={recalculando === socio.id_socio}
                onClick={() => onRecalcular(socio.id_socio)}
              />
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="scoring-carousel">
      {/* Filters */}
      <div className="flex flex-column gap-3 mb-4">
        <Button
          label="Recalcular scoring general"
          icon="pi pi-sync"
          severity="help"
          size="small"
          className="w-full"
          loading={recalculandoMasivo}
          onClick={onRecalcularMasivo}
          style={{ borderRadius: "8px" }}
        />
        <div className="flex gap-2">
          <span className="p-input-icon-left w-full">
            <i
              className="pi pi-search"
              style={{ display: "inline-block", marginLeft: "1rem" }}
            />
            <InputText
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar por nombre o # de socio..."
              className="w-full"
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                padding: "0.75rem 1rem 0.75rem 2.5rem",
              }}
            />
          </span>
        </div>
        <Dropdown
          value={riesgoFilter}
          options={riesgoOptions}
          onChange={(e) =>
            setRiesgoFilter((e.value ?? "") as RiesgoFilterValue)
          }
          placeholder="Filtrar por nivel de riesgo"
          showClear
          className="w-full"
          style={{ borderRadius: "8px" }}
        />
      </div>

      {/* Content */}
      {filteredScorings.length === 0 ? (
        <div className="text-center py-8" style={{ color: "#6c757d" }}>
          <i
            className="pi pi-chart-line mb-3"
            style={{ fontSize: "2.5rem" }}
          ></i>
          <p>No se encontraron registros de scoring.</p>
        </div>
      ) : (
        <Carousel
          value={filteredScorings}
          numVisible={1}
          numScroll={1}
          responsiveOptions={responsiveOptions}
          itemTemplate={scoringCardTemplate}
          circular
          autoplayInterval={0}
          showIndicators={false}
        />
      )}
    </div>
  );
};

export default ScoringCarousel;
