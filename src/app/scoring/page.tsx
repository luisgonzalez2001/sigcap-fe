"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Knob } from "primereact/knob";
import { Dialog } from "primereact/dialog";
import {
  getScoringList,
  getScoringBySocio,
  recalcularScoring,
  recalcularScoringMasivo,
} from "@/services/scoring-api";
import type {
  ScoringSocioResumen,
  ScoringResult,
  NivelRiesgo,
} from "@/types/Scoring";
import ScoringCarousel from "@/components/Scoring/ScoringCarousel";
import MlServiceStatus from "@/components/Scoring/MlServiceStatus";

const riesgoOptions = [
  { label: "Todos", value: null },
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
  if (score >= 75) return "#059669"; // Verde para score alto (75-100)
  if (score >= 50) return "#2563EB"; // Azul para score medio-alto (50-74)
  if (score >= 30) return "#D97706"; // Naranja para score medio-bajo (30-49)
  return "#DC2626"; // Rojo para score bajo (0-29)
};

const ScoringPage = () => {
  const toast = useRef<Toast>(null);

  const [scorings, setScorings] = useState<ScoringSocioResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [riesgoFilter, setRiesgoFilter] = useState<NivelRiesgo | null>(null);

  // Detalle dialog
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [scoringDetalle, setScoringDetalle] = useState<ScoringResult | null>(
    null,
  );
  const [selectedSocio, setSelectedSocio] =
    useState<ScoringSocioResumen | null>(null);
  const [recalculando, setRecalculando] = useState<string | null>(null);
  const [recalculandoMasivo, setRecalculandoMasivo] = useState(false);

  // Cargar scoring list
  const loadScorings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getScoringList();
      setScorings(data);
    } catch (err) {
      console.error("Error al cargar scoring:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el scoring de socios",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // cargar datos
  useEffect(() => {
    loadScorings();
  }, [loadScorings]);

  // Ver detalle
  const handleVerDetalle = async (socio: ScoringSocioResumen) => {
    setSelectedSocio(socio);
    setDetalleVisible(true);
    setDetalleLoading(true);
    try {
      const data = await getScoringBySocio(socio.id_socio);
      setScoringDetalle(data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el detalle del scoring",
        life: 3000,
      });
    } finally {
      setDetalleLoading(false);
    }
  };

  // Recalcular scoring
  const handleRecalcular = async (socioId: string) => {
    setRecalculando(socioId);
    try {
      await recalcularScoring(socioId);
      toast.current?.show({
        severity: "success",
        summary: "Scoring recalculado",
        detail: "El scoring se actualizó correctamente",
        life: 3000,
      });
      loadScorings();
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo recalcular el scoring",
        life: 3000,
      });
    } finally {
      setRecalculando(null);
    }
  };

  // Recalcular scoring masivo
  const handleRecalcularMasivo = async () => {
    setRecalculandoMasivo(true);
    try {
      await recalcularScoringMasivo();
      toast.current?.show({
        severity: "success",
        summary: "Scoring recalculado",
        detail: "El scoring de todos los socios se actualizó correctamente",
        life: 3000,
      });
      await loadScorings();
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo recalcular el scoring masivo",
        life: 3000,
      });
    } finally {
      setRecalculandoMasivo(false);
    }
  };

  // Filtrar
  const filteredScorings = (scorings || []).filter((s) => {
    const matchSearch =
      !searchValue.trim() ||
      s.nombre_socio.toLowerCase().includes(searchValue.toLowerCase()) ||
      String(s.n_socio).includes(searchValue);
    const matchRiesgo = !riesgoFilter || s.riesgo === riesgoFilter;
    return matchSearch && matchRiesgo;
  });

  // Estadísticas
  const stats = {
    total: (scorings || []).length,
    bajo: (scorings || []).filter((s) => s.riesgo === "bajo").length,
    medio: (scorings || []).filter((s) => s.riesgo === "medio").length,
    alto: (scorings || []).filter((s) => s.riesgo === "alto").length,
    promedio:
      (scorings || []).length > 0
        ? Math.round(
            (scorings || []).reduce((sum, s) => sum + s.score, 0) /
              (scorings || []).length,
          )
        : 0,
  };

  // Formatear moneda
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

  // Column templates
  const socioBodyTemplate = (rowData: ScoringSocioResumen) => (
    <div className="flex align-items-center gap-2">
      <div
        className="flex align-items-center justify-content-center"
        style={{
          width: "2rem",
          height: "2rem",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontSize: "0.7rem",
          fontWeight: "bold",
        }}
      >
        {rowData.nombre_socio
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()}
      </div>
      <div>
        <div className="font-semibold text-900">{rowData.nombre_socio}</div>
        <div className="text-sm text-600">#{rowData.n_socio}</div>
      </div>
    </div>
  );

  const scoreBodyTemplate = (rowData: ScoringSocioResumen) => (
    <div className="flex align-items-center gap-2">
      <Knob
        value={rowData.score}
        max={100}
        readOnly
        size={45}
        valueColor={getScoreColor(rowData.score)}
        rangeColor="#E2E8F0"
        valueTemplate="{value}"
        textColor={getScoreColor(rowData.score)}
        strokeWidth={8}
      />
    </div>
  );

  const riesgoBodyTemplate = (rowData: ScoringSocioResumen) => {
    const config = getRiesgoConfig(rowData.riesgo as NivelRiesgo);
    return <Tag value={config.label} severity={config.severity} />;
  };

  const montoMaxBodyTemplate = (rowData: ScoringSocioResumen) => (
    <span className="font-semibold text-green-700">
      {formatCurrency(rowData.monto_maximo_recomendado)}
    </span>
  );

  const estadoBodyTemplate = (rowData: ScoringSocioResumen) => (
    <div className="flex align-items-center gap-2">
      {rowData.elegible ? (
        <Tag value="Elegible" severity="success" icon="pi pi-check" />
      ) : (
        <Tag value="No elegible" severity="danger" icon="pi pi-times" />
      )}
    </div>
  );

  const accionesBodyTemplate = (rowData: ScoringSocioResumen) => (
    <div className="flex gap-1">
      <Button
        icon="pi pi-eye"
        severity="info"
        text
        rounded
        size="small"
        tooltip="Ver detalle"
        onClick={() => handleVerDetalle(rowData)}
      />
      <Button
        icon="pi pi-refresh"
        severity="warning"
        text
        rounded
        size="small"
        tooltip="Recalcular"
        loading={recalculando === rowData.id_socio}
        onClick={() => handleRecalcular(rowData.id_socio)}
      />
    </div>
  );

  if (loading && scorings.length === 0) {
    return (
      <div
        className="p-4 lg:p-6 flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <Toast ref={toast} />

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-900 m-0 mb-2">
          <i className="pi pi-chart-line mr-2" style={{ color: "#9333EA" }} />
          Scoring Crediticio
        </h1>
        <p className="text-600 m-0">
          Resumen de scoring ML para todos los socios
        </p>
      </div>

      {/* Estado del servicio ML */}
      <div className="mb-4">
        <MlServiceStatus />
      </div>

      {/* Stats */}
      <div className="grid mb-4">
        <div className="col-6 md:col-4 lg:col-2">
          <Card className="shadow-2">
            <div className="text-center">
              <div className="text-600 text-sm mb-1">Promedio</div>
              <div
                className="text-900 font-bold text-2xl"
                style={{ color: getScoreColor(stats.promedio) }}
              >
                {stats.promedio}
              </div>
            </div>
          </Card>
        </div>
        <div className="col-6 md:col-4 lg:col-2">
          <Card className="shadow-2">
            <div className="text-center">
              <div className="text-600 text-sm mb-1">Total Socios</div>
              <div className="text-900 font-bold text-2xl">{stats.total}</div>
            </div>
          </Card>
        </div>
        <div className="col-6 md:col-4 lg:col-2">
          <Card
            className="shadow-2"
            style={{ borderLeft: "3px solid #059669" }}
          >
            <div className="text-center">
              <div className="text-600 text-sm mb-1">Riesgo Bajo</div>
              <div className="text-900 font-bold text-2xl text-green-600">
                {stats.bajo}
              </div>
            </div>
          </Card>
        </div>
        <div className="col-6 md:col-4 lg:col-2">
          <Card
            className="shadow-2"
            style={{ borderLeft: "3px solid #2563EB" }}
          >
            <div className="text-center">
              <div className="text-600 text-sm mb-1">Riesgo Medio</div>
              <div className="text-900 font-bold text-2xl text-blue-600">
                {stats.medio}
              </div>
            </div>
          </Card>
        </div>
        <div className="col-6 md:col-4 lg:col-2">
          <Card
            className="shadow-2"
            style={{ borderLeft: "3px solid #D97706" }}
          >
            <div className="text-center">
              <div className="text-600 text-sm mb-1">Riesgo Alto</div>
              <div className="text-900 font-bold text-2xl text-yellow-700">
                {stats.alto}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabla - Desktop */}
      <div className="hidden lg:block">
        <Card className="shadow-2">
          <div className="flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
            <h2 className="text-xl font-bold m-0">Socios y Scoring</h2>
            <div className="flex flex-wrap gap-2 align-items-center">
              <div className="relative">
                <i
                  className="pi pi-search absolute text-gray-500"
                  style={{
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <InputText
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Buscar socio..."
                  style={{
                    paddingLeft: "2.5rem",
                    borderRadius: "8px",
                    minWidth: 200,
                  }}
                />
              </div>
              <Dropdown
                value={riesgoFilter}
                options={riesgoOptions}
                onChange={(e) => setRiesgoFilter(e.value)}
                placeholder="Nivel de riesgo"
                style={{ minWidth: "150px" }}
              />
              <Button
                icon="pi pi-sync"
                severity="help"
                size="small"
                rounded
                tooltip="Recalcular scoring de todos los socios"
                tooltipOptions={{ position: "bottom" }}
                loading={recalculandoMasivo}
                onClick={handleRecalcularMasivo}
              />
            </div>
          </div>

          <DataTable
            value={filteredScorings}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            loading={loading}
            emptyMessage="No se encontraron registros de scoring."
            className="text-sm"
            responsiveLayout="scroll"
            sortField="score"
            sortOrder={-1}
          >
            <Column
              header="Socio"
              body={socioBodyTemplate}
              style={{ minWidth: "180px" }}
              sortable
              sortField="nombre_socio"
            />
            <Column
              header="Score"
              body={scoreBodyTemplate}
              style={{ width: "80px" }}
              sortable
              sortField="score"
            />
            <Column
              header="Riesgo"
              body={riesgoBodyTemplate}
              style={{ width: "100px" }}
              sortable
              sortField="riesgo"
            />
            <Column
              header="Monto Máximo"
              body={montoMaxBodyTemplate}
              style={{ minWidth: "130px" }}
              sortable
              sortField="monto_maximo_recomendado"
            />
            <Column
              header="Elegibilidad"
              body={estadoBodyTemplate}
              style={{ minWidth: "130px" }}
            />
            <Column
              header="Última Actualización"
              field="fecha_calculo"
              body={(row: ScoringSocioResumen) => (
                <span className="text-sm text-600">
                  {formatDate(row.fecha_calculo)}
                </span>
              )}
              style={{ minWidth: "120px" }}
              sortable
            />
            <Column
              header=""
              body={accionesBodyTemplate}
              style={{ width: "90px" }}
            />
          </DataTable>
        </Card>
      </div>

      {/* Carousel - Vista Mobile/Tablet */}
      <div className="lg:hidden">
        <ScoringCarousel
          scorings={scorings}
          onVerDetalle={handleVerDetalle}
          onRecalcular={handleRecalcular}
          recalculando={recalculando}
          onRecalcularMasivo={handleRecalcularMasivo}
          recalculandoMasivo={recalculandoMasivo}
        />
      </div>

      {/* Detalle Dialog */}
      <Dialog
        header={
          selectedSocio
            ? `Scoring de ${selectedSocio.nombre_socio}`
            : "Detalle Scoring"
        }
        visible={detalleVisible}
        style={{ width: "95vw", maxWidth: "550px" }}
        onHide={() => {
          setDetalleVisible(false);
          setScoringDetalle(null);
          setSelectedSocio(null);
        }}
        draggable={false}
        resizable={false}
      >
        {detalleLoading ? (
          <div className="flex justify-content-center py-6">
            <ProgressSpinner style={{ width: "50px", height: "50px" }} />
          </div>
        ) : scoringDetalle ? (
          <div className="flex flex-column gap-4">
            {/* Score central */}
            <div className="flex flex-column align-items-center py-3">
              <Knob
                value={scoringDetalle.score}
                max={100}
                readOnly
                size={120}
                valueColor={getScoreColor(scoringDetalle.score)}
                rangeColor="#E2E8F0"
                valueTemplate="{value}"
                textColor={getScoreColor(scoringDetalle.score)}
              />
              <Tag
                value={
                  getRiesgoConfig(scoringDetalle.riesgo as NivelRiesgo).label
                }
                severity={
                  getRiesgoConfig(scoringDetalle.riesgo as NivelRiesgo).severity
                }
                className="mt-2"
                style={{ fontSize: "0.9rem" }}
              />
            </div>

            {/* Recomendaciones */}
            <div
              className="p-3 border-round"
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              <h4 className="m-0 mb-2 text-900">
                <i className="pi pi-info-circle mr-2 text-blue-600" />
                Recomendaciones
              </h4>
              <div className="flex flex-column gap-2 text-sm">
                <div className="flex justify-content-between">
                  <span className="text-600">Monto máximo recomendado:</span>
                  <span className="font-bold text-green-700">
                    {formatCurrency(scoringDetalle.monto_maximo_recomendado)}
                  </span>
                </div>
                <div className="flex justify-content-between">
                  <span className="text-600">Monto óptimo sugerido:</span>
                  <span className="font-bold text-900">
                    {formatCurrency(scoringDetalle.monto_optimo_sugerido)}
                  </span>
                </div>
                <div className="flex justify-content-between">
                  <span className="text-600">Elegible para préstamo:</span>
                  <span
                    className={`font-bold ${scoringDetalle.elegible ? "text-green-700" : "text-red-700"}`}
                  >
                    {scoringDetalle.elegible ? "Sí" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Factores Principales */}
            {scoringDetalle.factores_principales &&
              scoringDetalle.factores_principales.length > 0 && (
                <div>
                  <h4 className="m-0 mb-3 text-900">
                    <i className="pi pi-star mr-2 text-yellow-600" />
                    Factores Principales
                  </h4>
                  <div className="flex flex-column gap-2">
                    {scoringDetalle.factores_principales.map(
                      (factor, index) => (
                        <div
                          key={index}
                          className="flex align-items-start gap-2 p-2 border-round"
                          style={{
                            backgroundColor: "#F0FDF4",
                            border: "1px solid #BBF7D0",
                          }}
                        >
                          <i
                            className="pi pi-check-circle text-green-600 mt-1"
                            style={{ fontSize: "0.875rem" }}
                          />
                          <span className="text-sm text-700">{factor}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Fecha */}
            <div className="text-sm text-500 text-center">
              Calculado el {formatDate(scoringDetalle.fecha_calculo)}
              {scoringDetalle.fecha_expiracion && (
                <>
                  <br />
                  <span className="text-xs">
                    Expira el {formatDate(scoringDetalle.fecha_expiracion)}
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-600">
            <i className="pi pi-exclamation-triangle text-3xl mb-3" />
            <p>No se encontró información de scoring</p>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ScoringPage;
