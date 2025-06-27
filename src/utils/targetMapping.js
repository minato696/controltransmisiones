// src/utils/targetMapping.js - CORREGIDO para manejo correcto de "Otro" ↔ "Otros"

/**
 * Sistema centralizado de mapeo entre abreviaturas de Target del frontend y valores del backend
 * CORREGIDO: Manejo específico para "Otro" (backend) ↔ "Otros" (frontend)
 */

// ==================== MAPEOS PRINCIPALES ====================

/**
 * Mapeo de abreviaturas del frontend a valores enum del backend
 */
export const targetToBackendEnum = {
  "Tde": "Tarde",
  "Fta": "Falta",
  "Enf": "Enfermedad",
  "P. Tec": "Problema_tecnico",
  "F. Serv": "Falla_de_servicios",
  "Otros": "Otro"  // IMPORTANTE: Frontend usa "Otros", Backend usa "Otro"
};

/**
 * Mapeo inverso: valores enum del backend a abreviaturas del frontend
 */
export const enumToTargetAbbr = {
  "Tarde": "Tde",
  "Falta": "Fta", 
  "Enfermedad": "Enf",
  "Problema_tecnico": "P. Tec",
  "Falla_de_servicios": "F. Serv",
  "Otro": "Otros"  // IMPORTANTE: Backend usa "Otro", Frontend usa "Otros"
};

/**
 * Mapeo de abreviaturas a etiquetas completas en español
 */
export const targetToFullLabel = {
  "Tde": "Tarde",
  "Fta": "Falta",
  "Enf": "Enfermedad",
  "P. Tec": "Problema técnico",
  "F. Serv": "Falla de servicios",
  "Otros": "Otros"
};

/**
 * Mapeo de valores del backend a etiquetas completas
 */
export const enumToFullLabel = {
  "Tarde": "Tarde",
  "Falta": "Falta",
  "Enfermedad": "Enfermedad",
  "Problema_tecnico": "Problema técnico",
  "Falla_de_servicios": "Falla de servicios",
  "Otro": "Otros"
};

// ==================== OPCIONES PARA UI ====================

/**
 * Opciones de target para menús dropdown con formato para UI
 */
export const targetOptions = [
  { value: "Tde", label: "Tarde (Tde)" },
  { value: "Fta", label: "Falta (Fta)" },
  { value: "Enf", label: "Enfermedad (Enf)" },
  { value: "P. Tec", label: "Problema técnico (P. Tec)" },
  { value: "F. Serv", label: "Falla de servicios (F. Serv)" },
  { value: "Otros", label: "Otros" }
];

// ==================== FUNCIONES DE CONVERSIÓN ====================

/**
 * Obtiene la etiqueta de visualización para una abreviatura
 * @param {string} abbr - Abreviatura del target
 * @param {boolean} includeAbbr - Si incluir la abreviatura en la etiqueta
 * @returns {string} Etiqueta de visualización para la UI
 */
export const getTargetLabel = (abbr, includeAbbr = true) => {
  if (!abbr) return "Desconocido";
  
  const fullLabel = targetToFullLabel[abbr];
  if (!fullLabel) return abbr;
  
  if (includeAbbr && abbr !== "Otros") {
    return `${fullLabel} (${abbr})`;
  }
  
  return fullLabel;
};

/**
 * Convierte un valor enum del backend a una abreviatura del frontend - CORREGIDO
 * @param {string} backendTarget - Valor enum del backend
 * @returns {string|null} Abreviatura del frontend o null si no existe
 */
export const convertBackendTargetToAbbr = (backendTarget) => {
  if (!backendTarget) return null;
  
  console.log('🔄 MAPEO - convertBackendTargetToAbbr - Input:', backendTarget);
  
  // 1. CASO ESPECIAL PRIORITARIO: "Otro" del backend → "Otros" del frontend
  if (backendTarget === 'Otro') {
    console.log('✅ MAPEO - Conversión especial: "Otro" → "Otros"');
    return 'Otros';
  }
  
  // 2. Conversión directa usando el mapeo
  const abreviatura = enumToTargetAbbr[backendTarget];
  if (abreviatura) {
    console.log('✅ MAPEO - convertBackendTargetToAbbr - Output (directo):', abreviatura);
    return abreviatura;
  }
  
  // 3. Normalización y búsqueda
  const normalizedInput = normalizeTargetValue(backendTarget);
  
  for (const [enumValue, abbr] of Object.entries(enumToTargetAbbr)) {
    const normalizedEnum = normalizeTargetValue(enumValue);
    
    if (normalizedEnum === normalizedInput) {
      console.log('✅ MAPEO - convertBackendTargetToAbbr - Output (normalizado):', abbr);
      return abbr;
    }
  }
  
  // 4. Búsqueda parcial
  for (const [enumValue, abbr] of Object.entries(enumToTargetAbbr)) {
    const normalizedEnum = normalizeTargetValue(enumValue);
    
    if (normalizedInput.includes(normalizedEnum) || normalizedEnum.includes(normalizedInput)) {
      console.log('✅ MAPEO - convertBackendTargetToAbbr - Output (parcial):', abbr);
      return abbr;
    }
  }
  
  // 5. Casos especiales y variaciones
  const specialCases = getSpecialCasesBackendToAbbr();
  const specialResult = specialCases[normalizedInput];
  if (specialResult) {
    console.log('✅ MAPEO - convertBackendTargetToAbbr - Output (caso especial):', specialResult);
    return specialResult;
  }
  
  // 6. Valor por defecto
  console.warn(`⚠️ MAPEO - No se encontró abreviatura para "${backendTarget}". Usando "Otros"`);
  return "Otros";
};

/**
 * Convierte una abreviatura del frontend a un valor enum del backend - CORREGIDO
 * @param {string} abbr - Abreviatura del frontend
 * @returns {string|null} Valor enum del backend o null si no existe
 */
export const convertAbbrToBackendTarget = (abbr) => {
  if (!abbr) return null;
  
  console.log('🔄 MAPEO - convertAbbrToBackendTarget - Input:', abbr);
  
  // 1. CASO ESPECIAL PRIORITARIO: "Otros" del frontend → "Otro" del backend
  if (abbr === 'Otros') {
    console.log('✅ MAPEO - Conversión especial: "Otros" → "Otro"');
    return 'Otro';
  }
  
  // 2. Conversión directa
  const enumValue = targetToBackendEnum[abbr];
  if (enumValue) {
    console.log('✅ MAPEO - convertAbbrToBackendTarget - Output (directo):', enumValue);
    return enumValue;
  }
  
  // 3. Casos especiales
  const specialCases = getSpecialCasesAbbrToBackend();
  const normalizedAbbr = abbr.toLowerCase().trim();
  const specialResult = specialCases[normalizedAbbr];
  
  if (specialResult) {
    console.log('✅ MAPEO - convertAbbrToBackendTarget - Output (caso especial):', specialResult);
    return specialResult;
  }
  
  // 4. Si no hay coincidencia, usar el valor original
  console.warn(`⚠️ MAPEO - No se encontró valor backend para "${abbr}". Usando valor original`);
  return abbr;
};

// ==================== FUNCIONES DE VALIDACIÓN ====================

/**
 * Valida si una abreviatura es válida - CORREGIDO
 * @param {string} abbr - Abreviatura a validar
 * @returns {boolean} True si es válida
 */
export const isValidTargetAbbr = (abbr) => {
  if (!abbr) return false;
  
  // Incluir "Otros" como válido explícitamente
  if (abbr === 'Otros') return true;
  
  return targetToBackendEnum.hasOwnProperty(abbr);
};

/**
 * Valida si un valor enum del backend es válido - CORREGIDO
 * @param {string} enumValue - Valor enum a validar
 * @returns {boolean} True si es válido
 */
export const isValidBackendEnum = (enumValue) => {
  if (!enumValue) return false;
  
  // Incluir "Otro" como válido explícitamente
  if (enumValue === 'Otro') return true;
  
  return enumToTargetAbbr.hasOwnProperty(enumValue);
};

/**
 * Obtiene el target apropiado según el estado de transmisión
 * @param {string} estado - Estado de transmisión (si, no, tarde, pendiente)
 * @param {string} currentTarget - Target actual (opcional)
 * @returns {string|null} Target apropiado o null
 */
export const getTargetForEstado = (estado, currentTarget = null) => {
  const estadoLower = estado?.toLowerCase();
  
  switch (estadoLower) {
    case 'si':
    case 'pendiente':
      return null; // Estos estados no requieren target
      
    case 'no':
      return currentTarget || 'Fta'; // Por defecto "Falta"
      
    case 'tarde':
      return currentTarget || 'Tde'; // Por defecto "Tarde"
      
    default:
      return currentTarget;
  }
};

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Normaliza un valor de target para comparación
 * @param {string} value - Valor a normalizar
 * @returns {string} Valor normalizado
 */
const normalizeTargetValue = (value) => {
  if (typeof value !== 'string') return '';
  
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Obtiene casos especiales para conversión backend a abreviatura - CORREGIDO
 * @returns {Object} Mapa de casos especiales
 */
const getSpecialCasesBackendToAbbr = () => ({
  'enfermedad': 'Enf',
  'falta': 'Fta',
  'tarde': 'Tde',
  'problema': 'P. Tec',
  'tecnico': 'P. Tec',
  'problema tecnico': 'P. Tec',
  'problema_tecnico': 'P. Tec',
  'falla': 'F. Serv',
  'servicio': 'F. Serv',
  'falla de servicios': 'F. Serv',
  'falla_de_servicios': 'F. Serv',
  'otro': 'Otros',  // CORREGIDO: "otro" (minúscula) → "Otros"
  'otros': 'Otros'
});

/**
 * Obtiene casos especiales para conversión abreviatura a backend - CORREGIDO
 * @returns {Object} Mapa de casos especiales
 */
const getSpecialCasesAbbrToBackend = () => ({
  'enf': 'Enfermedad',
  'fta': 'Falta',
  'tde': 'Tarde',
  'p. tec': 'Problema_tecnico',
  'p.tec': 'Problema_tecnico',
  'ptec': 'Problema_tecnico',
  'f. serv': 'Falla_de_servicios',
  'f.serv': 'Falla_de_servicios',
  'fserv': 'Falla_de_servicios',
  'otros': 'Otro',  // CORREGIDO: "otros" (minúscula) → "Otro"
  'otro': 'Otro'
});

// ==================== FUNCIONES DE PROCESAMIENTO DE REPORTES ====================

/**
 * Procesa el target de un reporte según su estado
 * @param {Object} reporte - Objeto reporte
 * @returns {Object} Reporte con target procesado
 */
export const processReportTarget = (reporte) => {
  if (!reporte) return reporte;
  
  const estadoLower = reporte.estado?.toLowerCase();
  
  // Para "Transmitió tarde", determinar target desde el motivo
  if (estadoLower === 'tarde' && reporte.motivo && !reporte.target) {
    const targetFromMotivo = getTargetFromMotivo(reporte.motivo);
    return {
      ...reporte,
      target: targetFromMotivo
    };
  }
  
  // Para otros estados, asegurar que el target sea apropiado
  const appropriateTarget = getTargetForEstado(reporte.estado, reporte.target);
  
  if (reporte.target !== appropriateTarget) {
    return {
      ...reporte,
      target: appropriateTarget
    };
  }
  
  return reporte;
};

/**
 * Extrae el target desde un motivo para casos de "Transmitió tarde" - CORREGIDO
 * @param {string} motivo - Motivo del reporte
 * @returns {string} Target extraído o 'Otros'
 */
export const getTargetFromMotivo = (motivo) => {
  if (!motivo) return 'Tde';
  
  const motivoLower = motivo.toLowerCase();
  
  // Buscar coincidencias con targets conocidos
  const motivoToTarget = {
    'tarde': 'Tde',
    'tde': 'Tde',
    'falta': 'Fta',
    'fta': 'Fta',
    'enfermedad': 'Enf',
    'enf': 'Enf',
    'problema técnico': 'P. Tec',
    'problema tecnico': 'P. Tec',
    'p. tec': 'P. Tec',
    'falla de servicios': 'F. Serv',
    'f. serv': 'F. Serv'
  };
  
  for (const [key, target] of Object.entries(motivoToTarget)) {
    if (motivoLower.includes(key)) {
      return target;
    }
  }
  
  // CORREGIDO: Si no encuentra coincidencia, devolver "Otros" en lugar de "Tde"
  return 'Otros';
};

// ==================== FUNCIONES DE DEPURACIÓN ====================

/**
 * Función para depurar todos los mapeos y encontrar inconsistencias
 */
export const debugAllTargets = () => {
  console.log("=== SISTEMA DE MAPEO DE TARGETS ===");
  
  console.log("\n1. Mapeo Frontend → Backend:");
  Object.entries(targetToBackendEnum).forEach(([abbr, enumVal]) => {
    console.log(`   "${abbr}" → "${enumVal}"`);
  });
  
  console.log("\n2. Mapeo Backend → Frontend:");
  Object.entries(enumToTargetAbbr).forEach(([enumVal, abbr]) => {
    console.log(`   "${enumVal}" → "${abbr}"`);
  });
  
  console.log("\n3. Verificando consistencia bidireccional:");
  let inconsistencias = 0;
  
  // Verificar Frontend → Backend → Frontend
  Object.entries(targetToBackendEnum).forEach(([abbr, enumVal]) => {
    const reverseAbbr = enumToTargetAbbr[enumVal];
    if (reverseAbbr !== abbr) {
      console.warn(`   ❌ "${abbr}" → "${enumVal}" → "${reverseAbbr || 'undefined'}"`);
      inconsistencias++;
    } else {
      console.log(`   ✅ "${abbr}" ↔ "${enumVal}"`);
    }
  });
  
  console.log("\n4. Probando conversiones con ejemplos reales:");
  const testCases = [
    // Backend values
    "Enfermedad",
    "Problema_tecnico",
    "Falla_de_servicios",
    "Tarde",
    "Falta",
    "Otro",
    // Frontend values
    "Enf",
    "P. Tec",
    "F. Serv",
    "Tde",
    "Fta",
    "Otros"
  ];
  
  testCases.forEach(test => {
    if (isValidBackendEnum(test)) {
      const abbr = convertBackendTargetToAbbr(test);
      const backToEnum = convertAbbrToBackendTarget(abbr);
      console.log(`   Backend: "${test}" → "${abbr}" → "${backToEnum}" : ${test === backToEnum ? '✅' : '❌'}`);
    } else if (isValidTargetAbbr(test)) {
      const enumVal = convertAbbrToBackendTarget(test);
      const backToAbbr = convertBackendTargetToAbbr(enumVal);
      console.log(`   Frontend: "${test}" → "${enumVal}" → "${backToAbbr}" : ${test === backToAbbr ? '✅' : '❌'}`);
    }
  });
  
  console.log(`\n5. Resumen: ${inconsistencias === 0 ? '✅ Sistema consistente' : `❌ ${inconsistencias} inconsistencias encontradas`}`);
  
  return inconsistencias === 0;
};

/**
 * Imprime una tabla con todos los mapeos disponibles
 */
export const printTargetMappingTable = () => {
  console.log("\n╔════════════════╦═══════════════════════╦═════════════════════════╗");
  console.log("║  Abreviatura   ║    Valor Backend      ║      Etiqueta UI        ║");
  console.log("╠════════════════╬═══════════════════════╬═════════════════════════╣");
  
  Object.entries(targetToBackendEnum).forEach(([abbr, backend]) => {
    const label = getTargetLabel(abbr);
    console.log(`║ ${abbr.padEnd(14)} ║ ${backend.padEnd(21)} ║ ${label.padEnd(23)} ║`);
  });
  
  console.log("╚════════════════╩═══════════════════════╩═════════════════════════╝");
};

// ==================== EXPORT DEFAULT ====================

export default {
  // Mapeos principales
  targetToBackendEnum,
  enumToTargetAbbr,
  targetToFullLabel,
  enumToFullLabel,
  
  // Opciones para UI
  targetOptions,
  
  // Funciones de conversión
  getTargetLabel,
  convertBackendTargetToAbbr,
  convertAbbrToBackendTarget,
  
  // Funciones de validación
  isValidTargetAbbr,
  isValidBackendEnum,
  getTargetForEstado,
  
  // Funciones de procesamiento
  processReportTarget,
  getTargetFromMotivo,
  
  // Funciones de depuración
  debugAllTargets,
  printTargetMappingTable
};