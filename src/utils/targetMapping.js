// src/utils/targetMapping.js
/**
 * Sistema de mapeo entre abreviaturas de Target del frontend y valores enum del backend
 *
 * ¡ATENCIÓN! Asegúrate de que los valores del enum del backend coincidan EXACTAMENTE 
 * con los valores que envía y recibe tu API, incluyendo guiones bajos y mayúsculas/minúsculas.
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
 * @param {string} backendTarget - Valor enum del backend (ej: "Enfermedad")
 * @returns {string|null} Abreviatura del frontend (ej: "Enf") o null si no existe
 */
export const convertBackendTargetToAbbr = (backendTarget) => {
  if (!backendTarget) return null;
  
  // Agregar log para depuración
  console.log('DEPURACIÓN - convertBackendTargetToAbbr - Input:', backendTarget);
  
  // Verificar si existe una conversión directa
  const abreviatura = enumToTargetAbbr[backendTarget];
  
  if (abreviatura) {
    console.log('DEPURACIÓN - convertBackendTargetToAbbr - Output (convertido):', abreviatura);
    return abreviatura;
  }
  
  // Si no hay conversión directa, verificar si hay diferencias de formato
  // Como guiones bajos vs espacios o mayúsculas vs minúsculas
  for (const [enumValue, abbr] of Object.entries(enumToTargetAbbr)) {
    // Comparar ignorando case y reemplazando guiones bajos por espacios
    const normalizedEnum = enumValue.toLowerCase().replace(/_/g, ' ');
    const normalizedInput = backendTarget.toLowerCase().replace(/_/g, ' ');
    
    if (normalizedEnum === normalizedInput) {
      console.log('DEPURACIÓN - convertBackendTargetToAbbr - Output (normalizado):', abbr);
      return abbr;
    }
  }
  
  // Si no hay conversión, devolver el valor original y advertir
  console.warn(`Advertencia: No se encontró abreviatura para el target "${backendTarget}"`);
  console.log('DEPURACIÓN - convertBackendTargetToAbbr - Output (sin cambios):', backendTarget);
  return backendTarget;
};

/**
 * Convierte una abreviatura del frontend a un valor enum del backend
 * @param {string} abbr - Abreviatura del frontend (ej: "Enf")
 * @returns {string|null} Valor enum del backend (ej: "Enfermedad") o null si no existe
 */
export const convertAbbrToBackendTarget = (abbr) => {
  if (!abbr) return null;
  
  // Agregar log para depuración
  console.log('DEPURACIÓN - convertAbbrToBackendTarget - Input:', abbr);
  
  // Verificar si existe una conversión directa
  const enumValue = targetToBackendEnum[abbr];
  
  if (enumValue) {
    console.log('DEPURACIÓN - convertAbbrToBackendTarget - Output:', enumValue);
    return enumValue;
  }
  
  // Si no hay conversión directa, devolver el valor original y advertir
  console.warn(`Advertencia: No se encontró valor de backend para la abreviatura "${abbr}"`);
  console.log('DEPURACIÓN - convertAbbrToBackendTarget - Output (sin cambios):', abbr);
  return abbr;
};

/**
 * Función para depurar todos los targets y encontrar problemas
 */
export const debugAllTargets = () => {
  console.log("=== MAPEO DE TARGET: FRONTEND ↔ BACKEND ===");
  
  console.log("\nMapeo Frontend → Backend:");
  Object.entries(targetToBackendEnum).forEach(([abbr, enumVal]) => {
    console.log(`  "${abbr}" → "${enumVal}"`);
  });
  
  console.log("\nMapeo Backend → Frontend:");
  Object.entries(enumToTargetAbbr).forEach(([enumVal, abbr]) => {
    console.log(`  "${enumVal}" → "${abbr}"`);
  });
  
  // Verificar consistencia
  console.log("\nVerificando consistencia del mapeo:");
  let inconsistenciasEncontradas = false;
  
  Object.entries(targetToBackendEnum).forEach(([abbr, enumVal]) => {
    const reverseAbbr = enumToTargetAbbr[enumVal];
    if (reverseAbbr !== abbr) {
      console.warn(`  ❌ Inconsistencia: "${abbr}" → "${enumVal}", pero "${enumVal}" → "${reverseAbbr || 'undefined'}"`);
      inconsistenciasEncontradas = true;
    } else {
      console.log(`  ✅ OK: "${abbr}" ↔ "${enumVal}"`);
    }
  });
  
  if (!inconsistenciasEncontradas) {
    console.log("  ✅ Todas las conversiones son consistentes en ambas direcciones");
  }
  
  return !inconsistenciasEncontradas;
};

// Export default para compatibilidad
export default {
  targetToBackendEnum,
  enumToTargetAbbr,
  getTargetLabel,
  targetOptions,
  convertBackendTargetToAbbr,
  convertAbbrToBackendTarget,
  debugAllTargets
};