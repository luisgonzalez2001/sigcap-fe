"use client";

import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import type { Partner } from "@/types/Partner";

interface PartnerSearchDropdownProps {
  partners: Partner[];
  selectedPartner: Partner | null;
  onSelect: (partner: Partner | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PartnerSearchDropdown = ({
  partners,
  selectedPartner,
  onSelect,
  placeholder = "Seleccionar socio...",
  disabled = false,
}: PartnerSearchDropdownProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>(partners);

  // Filtrar socios por nombre o número de socio
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredPartners(partners);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    const filtered = partners.filter((partner) => {
      const fullName = `${partner.id_usuario?.name || ""} ${
        partner.id_usuario?.lastName || ""
      }`.toLowerCase();
      const nSocio = String(partner.n_socio || "").toLowerCase();
      return fullName.includes(searchLower) || nSocio.includes(searchLower);
    });

    setFilteredPartners(filtered);
  }, [searchValue, partners]);

  // Template para mostrar cada opción del dropdown
  const partnerOptionTemplate = (option: Partner) => {
    return (
      <div className="flex align-items-center gap-2">
        <div
          className="flex align-items-center justify-content-center"
          style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontSize: "0.75rem",
            fontWeight: "bold",
          }}
        >
          {option.id_usuario?.name?.charAt(0).toUpperCase()}
          {option.id_usuario?.lastName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: "600" }}>
            {option.id_usuario?.name} {option.id_usuario?.lastName}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
            Socio #{option.n_socio}
          </div>
        </div>
      </div>
    );
  };

  // Template para el valor seleccionado
  const selectedPartnerTemplate = (option: Partner | null) => {
    if (!option) {
      return <span style={{ color: "#9ca3af" }}>{placeholder}</span>;
    }
    return (
      <div className="flex align-items-center gap-2">
        <span style={{ fontWeight: "600" }}>
          {option.id_usuario?.name} {option.id_usuario?.lastName}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
          (#{option.n_socio})
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-column gap-2">
      {/* Input de búsqueda */}
      <div className="flex gap-2">
        <span className="p-input-icon-left w-full">
          <i
            className="pi pi-search"
            style={{ marginLeft: "0.75rem", color: "#9ca3af" }}
          />
          <InputText
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar por nombre o # de socio..."
            className="w-full"
            disabled={disabled}
            style={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              padding: "0.75rem 1rem 0.75rem 2.5rem",
            }}
          />
        </span>
      </div>

      {/* Dropdown con socios filtrados */}
      <Dropdown
        value={selectedPartner}
        options={filteredPartners}
        onChange={(e) => onSelect(e.value)}
        dataKey="id"
        placeholder={placeholder}
        disabled={disabled}
        className="w-full"
        itemTemplate={partnerOptionTemplate}
        valueTemplate={selectedPartnerTemplate}
        filter={false}
        showClear
        emptyMessage="No se encontraron socios"
        style={{
          borderRadius: "8px",
        }}
      />

      {/* Contador de resultados */}
      {searchValue && (
        <small style={{ color: "#6b7280" }}>
          {filteredPartners.length} socio(s) encontrado(s)
        </small>
      )}
    </div>
  );
};

export default PartnerSearchDropdown;
