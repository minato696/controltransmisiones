// src/utils/targetMapping.js - VERSIÓN LIMPIA
/**
 * Sistema de mapeo entre abreviaturas de Target del frontend y valores enum del backend
 *
 * Este archivo soluciona el problema de conversión entre los valores del backend
 * y las abreviaturas usadas en el frontend
 */

// 1. Map from frontend abbreviation to backend enum value
export const targetToBackendEnum = {
  "Tde": "Tarde",
  "Fta": "Falta",
  "Enf": "Enfermedad",
  "P. Tec": "Problema_tecnico",
  "F. Serv": "Falla_de_servicios",
  "Otros": "Otro"
};

// 2. Map from backend enum value to frontend abbreviation
export const enumToTargetAbbr = {
  "Tarde": "Tde",
  "Falta": "Fta", 
  "Enfermedad": "Enf",
  "Problema_tecnico": "P. Tec",
  "Falla_de_servicios": "F. Serv",
  "Otro": "Otros"
};

/**
 * Obtiene la etiqueta de visualización para una abreviatura
 * @param {string} abbr - Abreviatura del target
 * @returns {string} Etiqueta de visualización para la UI
 */
export const getTargetLabel = (abbr) => {
  switch(abbr) {
    case "Tde": return "Tarde (Tde)";
    case "Fta": return "Falta (Fta)";
    case "Enf": return "Enfermedad (Enf)";
    case "P. Tec": return "Problema técnico (P. Tec)";
    case "F. Serv": return "Falla de servicios (F. Serv)";
    case "Otros": return "Otros";
    default: return abbr || "Desconocido";
  }
};

/**
 * Opciones de target para menús dropdown
 * Contiene value (abreviatura) y label (etiqueta de visualización)
 */
export const targetOptions = [
  { value: "Tde", label: "Tarde (Tde)" },
  { value: "Fta", label: "Falta (Fta)" },
  { value: "Enf", label: "Enfermedad (Enf)" },
  { value: "P. Tec", label: "Problema técnico (P. Tec)" },
  { value: "F. Serv", label: "Falla de servicios (F. Serv)" },
  { value: "Otros", label: "Otros" }
];

/**
 * Convierte un valor enum del backend a una abreviatura del frontend
 * 
 * @param {string} backendTarget - Valor enum del backend (ej: "Enfermedad")
 * @returns {string|null} Abreviatura del frontend (ej: "Enf") o null si no existe
 */
export const convertBackendTargetToAbbr = (backendTarget) => {
  if (!backendTarget) return null;
  
  // 1. Verificar si existe una conversión directa
  const abreviatura = enumToTargetAbbr[backendTarget];
  
  if (abreviatura) {
    return abreviatura;
  }
  
  // 2. Verificar con diferentes formatos
  // Crear versiones normalizadas para comparación
  const normalizedInput = typeof backendTarget === 'string' 
    ? backendTarget.toLowerCase().replace(/_/g, ' ').trim()
    : '';
  
  for (const [enumValue, abbr] of Object.entries(enumToTargetAbbr)) {
    // Normalizar valor enum
    const normalizedEnum = enumValue.toLowerCase().replace(/_/g, ' ').trim();
    
    if (normalizedEnum === normalizedInput) {
      return abbr;
    }
  }
  
  // 3. Verificar con una búsqueda parcial (para mayor tolerancia)
  for (const [enumValue, abbr] of Object.entries(enumToTargetAbbr)) {
    const normalizedEnum = enumValue.toLowerCase().replace(/_/g, ' ').trim();
    
    if (normalizedInput.includes(normalizedEnum) || normalizedEnum.includes(normalizedInput)) {
      return abbr;
    }
  }
  
  // 4. Última opción: Intentar mapear directamente según casos especiales
  const specialCases = {
    'enfermedad': 'Enf',
    'falta': 'Fta',
    'tarde': 'Tde',
    'problema': 'P. Tec',
    'tecnico': 'P. Tec',
    'problema_tecnico': 'P. Tec',
    'falla': 'F. Serv',
    'servicio': 'F. Serv',
    'falla_de_servicios': 'F. Serv',
    'otro': 'Otros',
    'otros': 'Otros'
  };
  
  for (const [key, value] of Object.entries(specialCases)) {
    if (normalizedInput.includes(key)) {
      return value;
    }
  }
  
  // Si no hay coincidencia, usar el valor "Otros" como predeterminado
  return "Otros";
};

/**
 * Convierte una abreviatura del frontend a un valor enum del backend
 * 
 * @param {string} abbr - Abreviatura del frontend (ej: "Enf")
 * @returns {string|null} Valor enum del backend (ej: "Enfermedad") o null si no existe
 */
export const convertAbbrToBackendTarget = (abbr) => {
  if (!abbr) return null;
  
  // 1. Verificar si existe una conversión directa
  const enumValue = targetToBackendEnum[abbr];
  
  if (enumValue) {
    return enumValue;
  }
  
  // 2. Casos especiales para mayor tolerancia
  const lowerAbbr = abbr.toLowerCase().trim();
  
  const specialCases = {
    'enf': 'Enfermedad',
    'fta': 'Falta',
    'tde': 'Tarde',
    'p. tec': 'Problema_tecnico',
    'p.tec': 'Problema_tecnico', 
    'ptec': 'Problema_tecnico',
    'f. serv': 'Falla_de_servicios',
    'f.serv': 'Falla_de_servicios',
    'fserv': 'Falla_de_servicios',
    'otros': 'Otro',
    'otro': 'Otro'
  };
  
  for (const [key, value] of Object.entries(specialCases)) {
    if (lowerAbbr === key || lowerAbbr.includes(key)) {
      return value;
    }
  }
  
  // Si no hay coincidencia, usar el valor original
  return abbr;
};

// Export default para compatibilidad
export default {
  targetToBackendEnum,
  enumToTargetAbbr,
  getTargetLabel,
  targetOptions,
  convertBackendTargetToAbbr,
  convertAbbrToBackendTarget
};