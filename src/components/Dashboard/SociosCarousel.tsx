import { Carousel } from "primereact/carousel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import SocioCard from "./SocioCard";
import type { Partner } from "@/types/Partner";
import type { ResumenSocio } from "@/types/CajaSemanal";
import { useState } from "react";

interface SociosCarouselProps {
  socios: Partner[];
  onEdit: (partner: Partner) => void;
  onNew: () => void;
  resumenPorSocio?: Map<number, ResumenSocio>;
}

const SociosCarousel = ({
  socios,
  onEdit,
  onNew,
  resumenPorSocio,
}: SociosCarouselProps) => {
  const [searchValue, setSearchValue] = useState("");

  // Filtrar socios por nombre o número de socio
  const filteredSocios = socios.filter((socio) => {
    if (!searchValue.trim()) return true;

    const searchLower = searchValue.toLowerCase();
    const fullName = `${socio.id_usuario?.name || ""} ${
      socio.id_usuario?.lastName || ""
    }`.toLowerCase();
    const nSocio = String(socio.n_socio || "").toLowerCase();

    return fullName.includes(searchLower) || nSocio.includes(searchLower);
  });

  // Template para cada item del carousel
  const socioTemplate = (socio: Partner) => {
    return (
      <SocioCard
        socio={socio}
        onEdit={onEdit}
        resumenPorSocio={resumenPorSocio}
      />
    );
  };

  // Responsive options: 1 card en móvil, 2 en tablet pequeño, 3 en tablet grande
  const responsiveOptions = [
    {
      breakpoint: "1440px",
      numVisible: 3,
      numScroll: 1,
    },
    {
      breakpoint: "1024px",
      numVisible: 2,
      numScroll: 1,
    },
    {
      breakpoint: "560px",
      numVisible: 1,
      numScroll: 1,
    },
  ];

  if (socios.length === 0) {
    return (
      <div>
        {/* Controles superiores */}
        <div className="flex flex-column gap-3 mb-4">
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
          <Button
            label="Nuevo Socio"
            icon="pi pi-plus"
            onClick={onNew}
            className="w-full"
            style={{
              backgroundColor: "#6366F1",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontWeight: "600",
            }}
          />
        </div>

        {/* Mensaje de no hay socios */}
        <div className="text-center py-8" style={{ color: "#6c757d" }}>
          <i className="pi pi-users mb-3" style={{ fontSize: "2.5rem" }}></i>
          <p>No se encontraron socios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="socios-carousel">
      {/* Controles superiores */}
      <div className="flex flex-column gap-3 mb-4">
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
        <Button
          label="Nuevo Socio"
          icon="pi pi-plus"
          onClick={onNew}
          className="w-full"
          style={{
            backgroundColor: "#6366F1",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1.5rem",
            fontWeight: "600",
          }}
        />
      </div>

      {/* Carousel */}
      {filteredSocios.length === 0 ? (
        <div className="text-center py-8" style={{ color: "#6c757d" }}>
          <i className="pi pi-search mb-3" style={{ fontSize: "2.5rem" }}></i>
          <p>No se encontraron socios con ese nombre.</p>
        </div>
      ) : (
        <Carousel
          value={filteredSocios}
          numVisible={1}
          numScroll={1}
          responsiveOptions={responsiveOptions}
          itemTemplate={socioTemplate}
          circular
          autoplayInterval={0}
        />
      )}
    </div>
  );
};

export default SociosCarousel;
