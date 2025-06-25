// src/utils/targetMapping.js - VERSIÓN MEJORADA
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
 * VERSIÓN MEJORADA que soluciona problemas de conversión
 * 
 * @param {string} backendTarget - Valor enum del backend (ej: "Enfermedad")
 * @returns {string|null} Abreviatura del frontend (ej: "Enf") o null si no existe
 */
export const convertBackendTargetToAbbr = (backendTarget) => {
  if (!backendTarget) return null;
  
  // Agregar log para depuración
  console.log('DEPURACIÓN - convertBackendTargetToAbbr - Input:', backendTarget);
  
  // 1. Verificar si existe una conversión directa
  const abreviatura = enumToTargetAbbr[backendTarget];
  
  if (abreviatura) {
    console.log('DEPURACIÓN - convertBackendTargetToAbbr - Output (convertido):', abreviatura);
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
      console.log('DEPURACIÓN - convertBackendTargetToAbbr - Output (normalizado):', abbr);
      return abbr;
    }
  }
  
  // 3. Verificar con una búsqueda parcial (para mayor tolerancia)
  for (const [enumValue, abbr] of Object.entries(enumToTargetAbbr)) {
    const normalizedEnum = enumValue.toLowerCase().replace(/_/g, ' ').trim();
    
    if (normalizedInput.includes(normalizedEnum) || normalizedEnum.includes(normalizedInput)) {
      console.log('DEPURACIÓN - convertBackendTargetToAbbr - Output (coincidencia parcial):', abbr);
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
      console.log('DEPURACIÓN - convertBackendTargetToAbbr - Output (caso especial):', value);
      return value;
    }
  }
  
  // Si no hay coincidencia, usar el valor "Otros" como predeterminado
  console.warn(`Advertencia: No se encontró abreviatura para el target "${backendTarget}". Usando "Otros" como valor predeterminado.`);
  return "Otros";
};

/**
 * Convierte una abreviatura del frontend a un valor enum del backend
 * VERSIÓN MEJORADA que soluciona problemas de conversión
 * 
 * @param {string} abbr - Abreviatura del frontend (ej: "Enf")
 * @returns {string|null} Valor enum del backend (ej: "Enfermedad") o null si no existe
 */
export const convertAbbrToBackendTarget = (abbr) => {
  if (!abbr) return null;
  
  // Agregar log para depuración
  console.log('DEPURACIÓN - convertAbbrToBackendTarget - Input:', abbr);
  
  // 1. Verificar si existe una conversión directa
  const enumValue = targetToBackendEnum[abbr];
  
  if (enumValue) {
    console.log('DEPURACIÓN - convertAbbrToBackendTarget - Output:', enumValue);
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
      console.log('DEPURACIÓN - convertAbbrToBackendTarget - Output (caso especial):', value);
      return value;
    }
  }
  
  // Si no hay coincidencia, usar el valor original pero advertir
  console.warn(`Advertencia: No se encontró valor de backend para la abreviatura "${abbr}". Usando valor original.`);
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
  
  // Probar ejemplos reales
  console.log("\nPruebas de conversión de ejemplos reales:");
  const testCases = [
    "Enfermedad",
    "Problema_tecnico",
    "Falla_de_servicios",
    "Tarde",
    "Falta",
    "Otro"
  ];
  
  testCases.forEach(test => {
    const abbr = convertBackendTargetToAbbr(test);
    const backToEnum = convertAbbrToBackendTarget(abbr);
    console.log(`  "${test}" → "${abbr}" → "${backToEnum}" : ${test === backToEnum ? '✅' : '❌'}`);
  });
  
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