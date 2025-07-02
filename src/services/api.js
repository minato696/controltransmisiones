// src/services/api.js - CORREGIDO para manejo correcto de "Otros" con motivos personalizados
import axios from 'axios';

// ==================== IMPORTACIONES DEL SISTEMA DE MAPEO ====================
import { 
  convertAbbrToBackendTarget, 
  convertBackendTargetToAbbr,
  getTargetLabel,
  processReportTarget,
  isValidTargetAbbr,
  getTargetFromMotivo
} from '../utils/targetMapping';

// Función auxiliar para manejar conversiones especiales - MEJORADA
const convertTargetSafe = (target) => {
  // Si ya es "Otro" (backend), devolver tal cual
  if (target === 'Otro') {
    return 'Otro';
  }
  // Si es "Otros" (frontend), convertir
  if (target === 'Otros') {
    return 'Otro';
  }
  // Para otros casos, usar la función estándar
  return convertAbbrToBackendTarget(target);
};

// Configuración base
const API_BASE_URL = 'http://192.168.10.213:5886';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== UTILIDADES DE FECHA Y ZONA HORARIA ====================

// Configurar zona horaria de Perú (UTC-5)
const TIMEZONE_PERU = 'America/Lima';

// Obtener fecha actual en zona horaria de Perú
const obtenerFechaPeruana = () => {
  return new Date().toLocaleString('sv-SE', {
    timeZone: TIMEZONE_PERU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(' ', 'T');
};

// Formatear fecha para Spring Boot (ISO 8601) con zona horaria de Perú
const formatearFechaParaBackend = (fecha = null) => {
  const fechaAUsar = fecha || new Date();
  
  // Convertir a zona horaria de Perú y formatear en ISO 8601
  const fechaISO = fechaAUsar.toLocaleString('sv-SE', {
    timeZone: TIMEZONE_PERU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(' ', 'T');  // Cambiar espacio por 'T' para ISO 8601
  
  return fechaISO;
};

// Interceptor para requests - agregar información de timezone
api.interceptors.request.use(
  (config) => {
    // Agregar timezone info a los headers
    config.headers['X-Timezone'] = TIMEZONE_PERU;
    config.headers['X-Local-Time'] = obtenerFechaPeruana();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Solo errores críticos
    if (error.response?.status >= 500) {
      console.error('❌ Error del servidor:', error.response?.data?.message || error.message);
    }
    return Promise.reject(error);
  }
);

// ==================== PROGRAMAS ====================
export const getProgramas = async () => {
  try {
    const response = await api.get('/programa/listar');
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getPrograma = async (id) => {
  try {
    const response = await api.get(`/programa/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createPrograma = async (data) => {
  try {
    const programaCompleto = {
      nombre: data.nombre,
      isActivo: data.isActivo,
      diasSemana: data.diasSemana,
      horaInicio: data.horario,
      filialesIds: data.filialesIds || [] // Añadido para asociar con filiales
    };
    
    console.log('Enviando programa al backend:', programaCompleto);
    const response = await api.post('/programa', programaCompleto);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updatePrograma = async (id, data) => {
  try {
    const programaActualizado = {
      nombre: data.nombre,
      isActivo: data.isActivo,
      diasSemana: data.diasSemana,
      horaInicio: data.horario,
      filialesIds: data.filialesIds || [] // Añadido para asociar con filiales
    };
    
    console.log('Actualizando programa en backend:', programaActualizado);
    const response = await api.put(`/programa/${id}`, programaActualizado);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deletePrograma = async (id) => {
  try {
    const response = await api.delete(`/programa/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== FILIALES ====================
export const getFiliales = async () => {
  try {
    const response = await api.get('/filial/listar');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFilial = async (id) => {
  try {
    const response = await api.get(`/filial/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createFilial = async (data) => {
  try {
    const filialCompleta = {
      nombre: data.nombre.toUpperCase(),
      isActivo: data.isActivo,
      programaIds: data.programaIds || [] // Añadido para asociar con programas
    };
    
    console.log('Enviando filial al backend:', filialCompleta);
    const response = await api.post('/filial', filialCompleta);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateFilial = async (id, data) => {
  try {
    const filialActualizada = {
      nombre: data.nombre.toUpperCase(),
      isActivo: data.isActivo,
      programaIds: data.programaIds || [] // Añadido para asociar con programas
    };
    
    console.log('Actualizando filial en backend:', filialActualizada);
    const response = await api.put(`/filial/${id}`, filialActualizada);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteFilial = async (id) => {
  try {
    const response = await api.delete(`/filial/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== TRANSFORMACIONES DE DATOS ====================

// Transformar fechas del backend para mostrar en zona horaria local
const transformarFechaDesdeBackend = (fechaBackend) => {
  if (!fechaBackend) return null;
  
  try {
    const fecha = new Date(fechaBackend);
    
    return fecha.toLocaleString('es-PE', {
      timeZone: TIMEZONE_PERU,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return fechaBackend;
  }
};

// Transformar programas del backend al formato del frontend
export const transformarProgramas = (programasBackend) => {
  return programasBackend.map(programa => {
    return {
      id: programa.id,
      nombre: programa.nombre,
      horario: programa.horaInicio || '00:00',
      isActivo: programa.isActivo,
      diasSemana: programa.diasSemana,
      filialesIds: programa.filialesIds || [], // Añadido para asociar con filiales
      createdAt: transformarFechaDesdeBackend(programa.createdAt),
      updatedAt: transformarFechaDesdeBackend(programa.updateAt),
      horaInicioOriginal: programa.horaInicio,
      createdAtOriginal: programa.createdAt,
      updatedAtOriginal: programa.updateAt,
      reportes: programa.reportes || []
    };
  });
};

// Transformar filiales del backend al formato del frontend
export const transformarFiliales = (filialesBackend) => {
  return filialesBackend.map(filial => ({
    id: filial.id,
    nombre: filial.nombre.toUpperCase(),
    isActivo: filial.isActivo,
    programaIds: filial.programaIds || [], // Añadido para asociar con programas
    createdAt: transformarFechaDesdeBackend(filial.createdAt),
    updatedAt: transformarFechaDesdeBackend(filial.updateAt),
    createdAtOriginal: filial.createdAt,
    updatedAtOriginal: filial.updateAt,
    reportes: filial.reportes || [],
    // Añadir acceso directo a los programas si están incluidos en la respuesta
    programas: filial.programas || []
  }));
};

// Convertir hora del frontend al formato del backend
export const convertirHoraParaBackend = (horaString) => {
  const [hour, minute] = horaString.split(':').map(Number);
  
  return {
    hour: hour || 0,
    minute: minute || 0,
    second: 0,
    nano: 0
  };
};

// ==================== FUNCIONES INTEGRADAS ====================

// Obtener programas transformados para el frontend
export const getProgramasTransformados = async () => {
  try {
    const programas = await getProgramas();
    const programasTransformados = transformarProgramas(programas);
    return programasTransformados;
  } catch (error) {
    return [];
  }
};

// Obtener filiales transformadas para el frontend
export const getFilialesTransformadas = async () => {
  try {
    const filiales = await getFiliales();
    const filialesTransformadas = transformarFiliales(filiales);
    return filialesTransformadas;
  } catch (error) {
    return [];
  }
};

// Crear programa con formato correcto para el backend
export const crearProgramaCompleto = async (datosPrograma) => {
  try {
    const programaParaBackend = {
      nombre: datosPrograma.nombre,
      isActivo: datosPrograma.isActivo,
      diasSemana: datosPrograma.diasSemana,
      horario: datosPrograma.horario
    };
    
    return await createPrograma(programaParaBackend);
  } catch (error) {
    throw error;
  }
};

// ==================== UTILIDADES PARA CONVERSIONES ====================

/**
 * Convertir fecha de YYYY-MM-DD a DD/MM/YYYY (formato Backend)
 * Maneja múltiples formatos de entrada
 */
export const convertirFechaASwagger = (fechaInput) => {
  console.log('🔄 MAPEO - convertirFechaASwagger - Entrada:', fechaInput);
  
  // Si es null o undefined, usar fecha actual
  if (!fechaInput) {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const año = hoy.getFullYear();
    console.log(`✅ MAPEO - Usando fecha actual: ${dia}/${mes}/${año}`);
    return `${dia}/${mes}/${año}`;
  }
  
  // Si es objeto Date, convertir a formato DD/MM/YYYY
  if (fechaInput instanceof Date) {
    const dia = String(fechaInput.getDate()).padStart(2, '0');
    const mes = String(fechaInput.getMonth() + 1).padStart(2, '0');
    const año = fechaInput.getFullYear();
    console.log(`✅ MAPEO - Convertido desde Date: ${dia}/${mes}/${año}`);
    return `${dia}/${mes}/${año}`;
  }
  
  // Si ya está en formato DD/MM/YYYY, devolverlo tal cual
  if (typeof fechaInput === 'string' && fechaInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    console.log('✅ MAPEO - Ya está en formato DD/MM/YYYY:', fechaInput);
    return fechaInput;
  }
  
  // Si está en formato YYYY-MM-DD (ISO)
  if (typeof fechaInput === 'string' && fechaInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = fechaInput.split('-');
    console.log(`✅ MAPEO - Convertido desde YYYY-MM-DD: ${day}/${month}/${year}`);
    return `${day}/${month}/${year}`;
  }
  
  // Si está en otro formato de string, intentar convertirlo
  if (typeof fechaInput === 'string') {
    try {
      // Intentar analizar como fecha y convertir
      const fecha = new Date(fechaInput);
      if (!isNaN(fecha.getTime())) {
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const año = fecha.getFullYear();
        console.log(`✅ MAPEO - Convertido desde string genérico: ${dia}/${mes}/${año}`);
        return `${dia}/${mes}/${año}`;
      }
    } catch (error) {
      console.warn('⚠️ MAPEO - Error al convertir string a fecha:', error);
    }
  }
  
  // Si nada funciona, devolver el input original con advertencia
  console.warn('⚠️ MAPEO - No se pudo convertir la fecha, devolviendo original:', fechaInput);
  return fechaInput;
};

/**
 * Convertir fecha de DD/MM/YYYY a YYYY-MM-DD (desde Backend)
 */
export const convertirFechaDesdeSwagger = (fechaSwagger) => {
  if (!fechaSwagger) return '';
  const [day, month, year] = fechaSwagger.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Convertir estado del frontend al enum EstadoTransmision del backend
 */
export const convertirEstadoAEnum = (estado) => {
  if (!estado) return 'Pendiente';
  
  // Normalizar el estado a minúsculas para comparación
  const estadoLower = estado.toLowerCase();
  
  switch (estadoLower) {
    case 'si':
      return 'Si'; // Importante: el backend espera "Si" con mayúscula inicial
    case 'no':
      return 'No'; // Importante: el backend espera "No" con mayúscula inicial
    case 'tarde':
      return 'Tarde'; // Importante: el backend espera "Tarde" con mayúscula inicial
    case 'pendiente':
      return 'Pendiente'; // Importante: el backend espera "Pendiente" con mayúscula inicial
    default:
      // Log de depuración para estado no reconocido
      console.warn('⚠️ MAPEO - Estado no reconocido:', estado);
      return 'Pendiente';
  }
};

/**
 * Convertir enum EstadoTransmision del backend al estado del frontend
 */
export const convertirEnumAEstado = (estadoEnum) => {
  if (!estadoEnum) return 'pendiente';
  
  switch (estadoEnum.toLowerCase()) {
    case 'si': return 'si';
    case 'no': return 'no';
    case 'tarde': return 'tarde';
    case 'pendiente': return 'pendiente';
    default: return 'pendiente';
  }
};

/**
 * Convertir estado del frontend a isActivo (para compatibilidad)
 */
export const convertirEstadoAIsActivo = (estado) => {
  switch (estado) {
    case 'si': return true;
    case 'no': return false;
    case 'tarde': return true;
    case 'pendiente': return true;
    default: return true;
  }
};

/**
 * Convertir isActivo a estado del frontend (para compatibilidad)
 */
export const convertirIsActivoAEstado = (isActivo, motivo) => {
  if (isActivo) {
    if (motivo && motivo.toLowerCase().includes('tarde')) {
      return 'tarde';
    }
    return 'si';
  } else {
    return 'no';
  }
};

// ==================== REPORTES ====================

// Endpoints de reportes
const REPORTE_ENDPOINTS = {
  GET_BY_ID: '/reporte',
  CREATE: '/reporte/add',
  UPDATE: '/reporte',
  DELETE: '/reporte',
  LISTAR: '/reporte/listar'
};

/**
 * Obtener un reporte específico por ID
 */
export const getReportePorId = async (id) => {
  try {
    const response = await api.get(`${REPORTE_ENDPOINTS.GET_BY_ID}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Eliminar un reporte
 */
export const deleteReporte = async (id) => {
  try {
    const response = await api.delete(`${REPORTE_ENDPOINTS.DELETE}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== FUNCIONES MEJORADAS CON SISTEMA DE MAPEO ====================

/**
 * Crear un nuevo reporte - CORREGIDO para manejo de "Otros" con motivo personalizado
 */
export const createReporte = async (reporteData) => {
  try {
    console.log('🔄 MAPEO - API - Datos recibidos en createReporte:', reporteData);
    
    // ===== PASO 1: Determinar el estado =====
    const estado = reporteData.estadoTransmision || reporteData.estado || 'Pendiente';
    const esSiTransmitio = estado === 'Si' || estado === 'si';
    const esNoTransmitio = estado === 'No' || estado === 'no';
    const esTardio = estado === 'Tarde' || estado === 'tarde';
    
    console.log('🔍 MAPEO - Estado determinado:', estado);
    
    // ===== PASO 2: Formatear la fecha correctamente =====
    const fechaFormateada = convertirFechaASwagger(reporteData.fecha);
    
    // ===== PASO 3: Procesar datos con el sistema de mapeo =====
    let horaUsuario = null;
    let horaTT = null;
    let targetUsuario = null;
    let motivoUsuario = null;
    
    // Extraer la hora real (para "Sí transmitió" y "Transmitió Tarde")
    if (esSiTransmitio || esTardio) {
      horaUsuario = reporteData.hora || reporteData.horaReal || reporteData.hora_real || "05:00";
      
      // Asegurar que la hora sea string
      if (typeof horaUsuario !== 'string') {
        horaUsuario = String(horaUsuario);
      }
    }
    
    // Extraer la hora TT (solo para "Transmitió Tarde")
    if (esTardio) {
      if (reporteData.hora_tt !== undefined) {
        horaTT = reporteData.hora_tt;
      } else {
        // Si no hay hora_tt específica, usar 10 minutos después de la hora real
        const [horas, minutos] = horaUsuario.split(':').map(Number);
        let minutosRetrasados = minutos + 10;
        let horasRetrasadas = horas;
        
        if (minutosRetrasados >= 60) {
          horasRetrasadas += 1;
          minutosRetrasados -= 60;
        }
        
        horaTT = `${String(horasRetrasadas).padStart(2, '0')}:${String(minutosRetrasados).padStart(2, '0')}`;
      }
    }
    
    // Procesar target usando el sistema de mapeo
    if (esNoTransmitio) {
      // IMPORTANTE: Verificar "Otros"/"Otro" ANTES de convertir - CORREGIDO
      const esOtros = reporteData.target === 'Otros' || reporteData.target === 'Otro';
      console.log('🔍 MAPEO - ¿Es Otros?:', esOtros, 'Target original:', reporteData.target);
      
      if (reporteData.target !== undefined && reporteData.target !== null) {
        // Validar target antes de convertir - CORREGIDO para incluir "Otros"
        if (isValidTargetAbbr(reporteData.target) || reporteData.target === 'Otros' || reporteData.target === 'Otro') {
          console.log('🔄 MAPEO - Convirtiendo target válido:', reporteData.target);
          targetUsuario = convertTargetSafe(reporteData.target);
          console.log('✅ MAPEO - Target convertido a backend:', targetUsuario);
        } else {
          console.warn('⚠️ MAPEO - Target no válido, usando original:', reporteData.target);
          targetUsuario = reporteData.target;
        }
      }
      
      // Si el target original era "Otros" o "Otro", extraer el motivo personalizado
      if (esOtros) {
        motivoUsuario = reporteData.motivo || null;
        console.log('📝 MAPEO - Motivo personalizado para "Otros":', motivoUsuario);
      } else {
        motivoUsuario = null; // Para targets predefinidos, motivo es null
      }
    }
    
    // Procesar motivo para "Transmitió Tarde"
    if (esTardio) {
      motivoUsuario = reporteData.motivo || null;
    }
    
    // ===== PASO 4: Crear el objeto según el estado =====
    let reporteObjeto;
    
    if (esSiTransmitio) {
      // Objeto para "Sí transmitió"
      reporteObjeto = {
        fecha: fechaFormateada,
        estadoTransmision: "Si",
        target: null,
        motivo: null,
        filialId: parseInt(reporteData.filialId),
        programaId: parseInt(reporteData.programaId),
        hora: horaUsuario,
        hora_tt: null
      };
      console.log('✅ MAPEO - Reporte "Sí transmitió" preparado');
    } 
    else if (esNoTransmitio) {
      // Objeto para "No transmitió"
      reporteObjeto = {
        fecha: fechaFormateada,
        estadoTransmision: "No",
        target: targetUsuario,
        motivo: motivoUsuario, // CORREGIDO: Asegurar que se preserve el motivo personalizado
        filialId: parseInt(reporteData.filialId),
        programaId: parseInt(reporteData.programaId),
        hora: null,
        hora_tt: null
      };
      console.log('✅ MAPEO - Reporte "No transmitió" preparado con target:', targetUsuario, 'y motivo:', motivoUsuario);
    }
    else if (esTardio) {
      // Objeto para "Transmitió Tarde"
      reporteObjeto = {
        fecha: fechaFormateada,
        estadoTransmision: "Tarde",
        target: null,           // Target es null para transmisión tardía según el backend
        motivo: motivoUsuario,  // Motivo puede ser null o tener valor
        filialId: parseInt(reporteData.filialId),
        programaId: parseInt(reporteData.programaId),
        hora: horaUsuario,      // Hora real de transmisión
        hora_tt: horaTT         // Hora tardía
      };
      console.log('✅ MAPEO - Reporte "Transmitió Tarde" preparado');
    }
    else {
      // Estado Pendiente u otro
      reporteObjeto = {
        fecha: fechaFormateada,
        estadoTransmision: "Pendiente",
        target: null,
        motivo: null,
        filialId: parseInt(reporteData.filialId),
        programaId: parseInt(reporteData.programaId),
        hora: null,
        hora_tt: null
      };
    }
    
    // ===== PASO 5: Enviar al backend como array =====
    console.log('📤 MAPEO - Objeto final a enviar:', reporteObjeto);
    
    // IMPORTANTE: Enviar como array con un solo objeto
    const response = await api.post(REPORTE_ENDPOINTS.CREATE, [reporteObjeto]);
    console.log('✅ MAPEO - Respuesta del backend:', response.data);
    
    return Array.isArray(response.data) ? response.data[0] : response.data;
  } catch (error) {
    console.error('❌ MAPEO - Error en createReporte:', error);
    throw error;
  }
};

/**
 * Actualizar un reporte existente - CORREGIDO para manejo de "Otros" con motivo personalizado
 */
export const updateReporte = async (id, reporteData) => {
  try {
    console.log('🔄 MAPEO - Actualizando reporte ID:', id, 'con datos:', reporteData);
    
    // ===== PASO 1: Determinar el estado =====
    const estado = reporteData.estadoTransmision || reporteData.estado || 'Pendiente';
    const esSiTransmitio = estado === 'Si' || estado === 'si';
    const esNoTransmitio = estado === 'No' || estado === 'no';
    const esTardio = estado === 'Tarde' || estado === 'tarde';
    
    console.log('🔍 MAPEO - Estado determinado:', estado);
    
    // ===== PASO 2: Formatear fecha =====
    const fechaFormateada = convertirFechaASwagger(reporteData.fecha);
    
    // ===== PASO 3: Procesar datos con el sistema de mapeo =====
    let horaUsuario = null;
    let horaTT = null;
    let targetUsuario = null;
    let motivoUsuario = null;
    
    // Extraer la hora real (para "Sí transmitió" y "Transmitió Tarde")
    if (esSiTransmitio || esTardio) {
      horaUsuario = reporteData.hora || reporteData.horaReal || reporteData.hora_real || "05:00";
      
      // Asegurar que la hora sea string
      if (typeof horaUsuario !== 'string') {
        horaUsuario = String(horaUsuario);
      }
    }
    
    // Extraer la hora TT (solo para "Transmitió Tarde")
    if (esTardio) {
      if (reporteData.hora_tt !== undefined) {
        horaTT = reporteData.hora_tt;
      } else {
        // Si no hay hora_tt específica, usar 10 minutos después de la hora real
        const [horas, minutos] = horaUsuario.split(':').map(Number);
        let minutosRetrasados = minutos + 10;
        let horasRetrasadas = horas;
        
        if (minutosRetrasados >= 60) {
          horasRetrasadas += 1;
          minutosRetrasados -= 60;
        }
        
        horaTT = `${String(horasRetrasadas).padStart(2, '0')}:${String(minutosRetrasados).padStart(2, '0')}`;
      }
    }
    
    // Procesar target usando el sistema de mapeo  
    if (esNoTransmitio) {
      // IMPORTANTE: Verificar si es "Otros"/"Otro" ANTES de convertir - CORREGIDO
      const esOtros = reporteData.target === 'Otros' || reporteData.target === 'Otro';
      console.log('🔍 MAPEO - ¿Es Otros?:', esOtros, 'Target original:', reporteData.target);
      
      if (reporteData.target !== undefined && reporteData.target !== null) {
        // Validar y convertir target - CORREGIDO para incluir "Otros"
        if (isValidTargetAbbr(reporteData.target) || reporteData.target === 'Otros' || reporteData.target === 'Otro') {
          console.log('🔄 MAPEO - Convirtiendo target válido:', reporteData.target);
          targetUsuario = convertTargetSafe(reporteData.target);
          console.log('✅ MAPEO - Target convertido a backend:', targetUsuario);
        } else {
          console.warn('⚠️ MAPEO - Target no válido, usando original:', reporteData.target);
          targetUsuario = reporteData.target;
        }
      }
      
      // Si el target original era "Otros" o "Otro", extraer el motivo personalizado
      if (esOtros) {
        motivoUsuario = reporteData.motivo || null;
        console.log('📝 MAPEO - Motivo personalizado para "Otros":', motivoUsuario);
      } else {
        motivoUsuario = null; // Para targets predefinidos, motivo es null
      }
    }
    
    // Procesar motivo para "Transmitió Tarde"
    if (esTardio) {
      motivoUsuario = reporteData.motivo || null;
    }
    
    // ===== PASO 4: Crear objeto de actualización según el estado =====
    let updateObjeto;
    
    if (esSiTransmitio) {
      // Objeto para "Sí transmitió"
      updateObjeto = {
        id_reporte: id,
        fecha: fechaFormateada,
        estadoTransmision: "Si",
        target: null,
        motivo: null,
        filialId: parseInt(reporteData.filialId),
        programaId: parseInt(reporteData.programaId),
        hora: horaUsuario,
        hora_tt: null
      };
    } 
    else if (esNoTransmitio) {
      // Objeto para "No transmitió"
      updateObjeto = {
        id_reporte: id,
        fecha: fechaFormateada,
        estadoTransmision: "No",
        target: targetUsuario,
        motivo: motivoUsuario, // CORREGIDO: Asegurar que se preserve el motivo personalizado
        filialId: parseInt(reporteData.filialId),
        programaId: parseInt(reporteData.programaId),
        hora: null,
        hora_tt: null
      };
    }
    else if (esTardio) {
      // Objeto para "Transmitió Tarde"
      updateObjeto = {
        id_reporte: id,
        fecha: fechaFormateada,
        estadoTransmision: "Tarde",
        target: null,           // Target es null para transmisión tardía según el backend
        motivo: motivoUsuario,  // Motivo puede ser null o tener valor
        filialId: parseInt(reporteData.filialId),
        programaId: parseInt(reporteData.programaId),
        hora: horaUsuario,      // Hora real de transmisión
        hora_tt: horaTT         // Hora tardía
      };
    }
    else {
      // Estado Pendiente u otro
      updateObjeto = {
        id_reporte: id,
        fecha: fechaFormateada,
        estadoTransmision: "Pendiente",
        target: null,
        motivo: null,
        filialId: parseInt(reporteData.filialId),
        programaId: parseInt(reporteData.programaId),
        hora: null,
        hora_tt: null
      };
    }
    
    console.log('📤 MAPEO - Objeto final para actualización:', updateObjeto);
    
    // ===== PASO 5: Enviar actualización al backend =====
    const response = await api.put(`${REPORTE_ENDPOINTS.UPDATE}/${id}`, updateObjeto);
    console.log('✅ MAPEO - Respuesta del backend para actualización:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ MAPEO - Error en updateReporte:', error);
    throw error;
  }
};

/**
 * Guardar o actualizar un reporte - CORREGIDO para manejo de "Otros" con motivo personalizado
 */
export const guardarOActualizarReporte = async (filialId, programaId, fecha, datosReporte) => {
  try {
    console.log('🔄 MAPEO - Datos recibidos en guardarOActualizarReporte:', {
      filialId, programaId, fecha, datosReporte
    });
    
    // ===== PASO 1: Procesar el reporte con el sistema de mapeo =====
    const reporteProcesado = processReportTarget(datosReporte);
    console.log('🔍 MAPEO - Reporte procesado:', reporteProcesado);
    
    // ===== PASO 2: Determinar el estado =====
    const estado = reporteProcesado.estadoTransmision || reporteProcesado.estado || 'Pendiente';
    const esSiTransmitio = estado === 'Si' || estado === 'si';
    const esNoTransmitio = estado === 'No' || estado === 'no';
    const esTardio = estado === 'Tarde' || estado === 'tarde';
    
    console.log('🔍 MAPEO - Estado determinado:', estado);
    
    // ===== PASO 3: Preparar datos según el estado =====
    let reporteObjeto = {
      filialId: parseInt(filialId),
      programaId: parseInt(programaId),
      fecha: fecha
    };
    
    if (esSiTransmitio) {
      // Extraer la hora proporcionada por el usuario
      let horaUsuario = reporteProcesado.hora || reporteProcesado.horaReal || reporteProcesado.hora_real || "05:00";
      
      // Asegurar que sea string
      if (typeof horaUsuario !== 'string') {
        horaUsuario = String(horaUsuario);
      }
      
      // Preparar objeto para "Sí transmitió"
      reporteObjeto = {
        ...reporteObjeto,
        estadoTransmision: "Si",
        target: null,
        motivo: null,
        hora: horaUsuario,
        hora_tt: null
      };
    } 
    else if (esNoTransmitio) {
      // Extraer el target seleccionado por el usuario
      let targetUsuario = null;
      let motivoUsuario = null;
      
      // IMPORTANTE: Verificar si es "Otros" o "Otro" ANTES de procesar - CORREGIDO
      const esOtros = reporteProcesado.target === 'Otros' || reporteProcesado.target === 'Otro';
      console.log('🔍 MAPEO - ¿Es Otros?:', esOtros, 'Target original:', reporteProcesado.target);
      
      if (reporteProcesado.target !== undefined && reporteProcesado.target !== null) {
        // Validar y convertir de abreviatura (frontend) a valor completo (backend) - CORREGIDO
        if (isValidTargetAbbr(reporteProcesado.target) || reporteProcesado.target === 'Otros' || reporteProcesado.target === 'Otro') {
          console.log('🔄 MAPEO - Convirtiendo target válido:', reporteProcesado.target);
          targetUsuario = convertTargetSafe(reporteProcesado.target);
          console.log('✅ MAPEO - Target convertido a backend:', targetUsuario);
        } else {
          console.warn('⚠️ MAPEO - Target no válido, usando original:', reporteProcesado.target);
          targetUsuario = reporteProcesado.target;
        }
      }
      
      // Si el target original era "Otros" o "Otro", extraer el motivo personalizado
      if (esOtros) {
        motivoUsuario = reporteProcesado.motivo || null;
        console.log('📝 MAPEO - Motivo personalizado para "Otros":', motivoUsuario);
      } else {
        motivoUsuario = null; // Para targets predefinidos, motivo es null
      }
      
      // Preparar objeto para "No transmitió"
      reporteObjeto = {
        ...reporteObjeto,
        estadoTransmision: "No",
        target: targetUsuario,
        motivo: motivoUsuario, // CORREGIDO: Asegurar que se preserve el motivo personalizado
        hora: null,
        hora_tt: null
      };
    }
    else if (esTardio) {
      // Extraer hora real y hora tardía
      let horaUsuario = reporteProcesado.hora || reporteProcesado.horaReal || "05:00";
      let horaTT = reporteProcesado.hora_tt;
      let motivoUsuario = null;
      let targetSeleccionado = reporteProcesado.target;
      
      // Si no hay hora_tt, usar 10 minutos después de la hora real
      if (!horaTT) {
        const [horas, minutos] = horaUsuario.split(':').map(Number);
        let minutosRetrasados = minutos + 10;
        let horasRetrasadas = horas;
        
        if (minutosRetrasados >= 60) {
          horasRetrasadas += 1;
          minutosRetrasados -= 60;
        }
        
        horaTT = `${String(horasRetrasadas).padStart(2, '0')}:${String(minutosRetrasados).padStart(2, '0')}`;
      }
      
      // Determinar el motivo basado en el target o el motivo explícito
      if (targetSeleccionado === 'Otros') {
        // Si es "Otros", usar el motivo personalizado
        motivoUsuario = reporteProcesado.motivo || null;
      } else if (targetSeleccionado) {
        // Si hay un target predefinido, usar la etiqueta completa como motivo
        const targetLabel = getTargetLabel(targetSeleccionado, false);
        motivoUsuario = targetLabel;
        console.log('🔄 MAPEO - Usando etiqueta de target como motivo:', motivoUsuario);
      } else {
        // Si no hay target, usar el motivo tal cual
        motivoUsuario = reporteProcesado.motivo || null;
      }
      
      // Preparar objeto para "Transmitió Tarde"
      reporteObjeto = {
        ...reporteObjeto,
        estadoTransmision: "Tarde",
        target: null,            // Target siempre es null para transmisión tardía según el backend
        motivo: motivoUsuario,   // Motivo basado en target o motivo personalizado
        hora: horaUsuario,       // Hora real de transmisión
        hora_tt: horaTT          // Hora tardía
      };
    }
    else {
      // Estado Pendiente u otro
      reporteObjeto = {
        ...reporteObjeto,
        estadoTransmision: "Pendiente",
        target: null,
        motivo: null,
        hora: null,
        hora_tt: null
      };
    }
    
    console.log('📤 MAPEO - Objeto preparado:', reporteObjeto);
    
    // ===== PASO 4: Decidir entre crear o actualizar =====
    if (datosReporte.id_reporte) {
      console.log('🔄 MAPEO - Actualizando reporte existente ID:', datosReporte.id_reporte);
      return await updateReporte(datosReporte.id_reporte, reporteObjeto);
    } else {
      console.log('🔄 MAPEO - Creando nuevo reporte');
      return await createReporte(reporteObjeto);
    }
    
  } catch (error) {
    console.error('❌ MAPEO - Error en guardarOActualizarReporte:', error);
    throw error;
  }
};

// ... (resto de las funciones permanecen igual)

/**
 * Obtener reportes por rango de fechas
 */
export const getReportesPorFechas = async (fechaInicio, fechaFin) => {
  try {
    const response = await api.get(REPORTE_ENDPOINTS.LISTAR);
    const reportesTransformados = transformarReportes(response.data || []);
    
    let reportesFiltrados = [];
    if (Array.isArray(reportesTransformados)) {
      reportesFiltrados = reportesTransformados.filter(reporte => {
        const fechaReporte = reporte.fecha;
        return fechaReporte >= fechaInicio && fechaReporte <= fechaFin;
      });
    }
    
    return reportesFiltrados;
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

/**
 * Obtener todos los reportes
 */
export const getReportes = async () => {
  try {
    const response = await api.get(REPORTE_ENDPOINTS.LISTAR);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

/**
 * Transformar reportes - FUNCIÓN MEJORADA CON SISTEMA DE MAPEO
 */
export const transformarReportes = (reportesBackend) => {
  console.log('🔄 MAPEO - Iniciando transformación de reportes del backend', 
              {cantidad: reportesBackend?.length || 0});
  
  if (!reportesBackend || !Array.isArray(reportesBackend)) {
    console.warn('⚠️ MAPEO - No hay reportes para transformar o formato inválido', reportesBackend);
    return [];
  }
  
  return reportesBackend.map(reporte => {
    console.log('🔄 MAPEO - Transformando reporte individual:', reporte);
    
    // Priorizar campos directos filialId y programaId
    let filialId = reporte.filialId || reporte.filial_id || reporte.filial?.id;
    let programaId = reporte.programaId || reporte.programa_id || reporte.programa?.id;
    
    // Convertir fecha del backend (DD/MM/YYYY) a formato frontend (YYYY-MM-DD)
    let fechaTransformada = '';
    if (reporte.fecha) {
      try {
        if (reporte.fecha.includes('/')) {
          fechaTransformada = convertirFechaDesdeSwagger(reporte.fecha);
        } else {
          fechaTransformada = reporte.fecha;
        }
      } catch (error) {
        console.error('❌ MAPEO - Error al transformar fecha:', error);
        fechaTransformada = reporte.fecha;
      }
    }
    
    // Convertir estadoTransmision del enum al formato del frontend
    let estadoTransformado = 'pendiente';
    
    if (reporte.estadoTransmision) {
      estadoTransformado = convertirEnumAEstado(reporte.estadoTransmision);
    } else {
      // Fallback: usar isActivo si no hay estadoTransmision
      const isActivo = reporte.isActivo !== undefined ? reporte.isActivo : 
                       reporte.is_activo !== undefined ? reporte.is_activo :
                       reporte.activo !== undefined ? reporte.activo : null;
      
      if (isActivo === true) {
        estadoTransformado = 'si';
      } else if (isActivo === false) {
        estadoTransformado = 'no';
      }
      
      // Detectar "tarde" por motivo
      if (reporte.motivo && reporte.motivo.toLowerCase().includes('tarde')) {
        estadoTransformado = 'tarde';
      }
    }
    
    // Buscar hora real con diferentes nombres y asegurarse que es un string
    let horaReal = reporte.hora_real || reporte.hora || reporte.horaReal || '';
    
    // Normalizar hora_real si viene como objeto (para compatibilidad con API)
    if (typeof horaReal === 'object' && horaReal !== null) {
      const hour = horaReal.hour || 0;
      const minute = horaReal.minute || 0;
      horaReal = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    // Asegurar que hora_tt también sea string
    let horaTT = reporte.hora_tt || '';
    if (typeof horaTT === 'object' && horaTT !== null) {
      const hour = horaTT.hour || 0;
      const minute = horaTT.minute || 0;
      horaTT = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    // Convertir el target del backend a la abreviatura del frontend usando el sistema de mapeo
    let targetTransformado = null;
    let motivoTransformado = reporte.motivo || '';
    
    // CASO ESPECIAL: Para "Transmitio Tarde", el target es null según el backend
    if (estadoTransformado === 'tarde') {
      // Intentar extraer el target del motivo
      if (motivoTransformado) {
        targetTransformado = getTargetFromMotivo(motivoTransformado);
        console.log('🔍 MAPEO - Target extraído del motivo para reporte tarde:', targetTransformado);
      } else {
        // Si no hay motivo, usar Tde como predeterminado
        targetTransformado = 'Tde';
      }
    } 
    // Para "No transmitió", procesar el target normalmente
    else if (estadoTransformado === 'no' && reporte.target) {
      targetTransformado = convertBackendTargetToAbbr(reporte.target);
      console.log('🔄 MAPEO - Target convertido de backend:', reporte.target, '→', targetTransformado);
    } 
    // En caso de no transmitir y no tener target, asignar uno por defecto
    else if (estadoTransformado === 'no') {
      targetTransformado = 'Fta'; // Valor por defecto para "No transmitió"
      console.log('⚠️ MAPEO - Asignando target por defecto para No transmitió:', targetTransformado);
    }
    
    // Crear el reporte transformado base
    const reporteTransformado = {
      id_reporte: reporte.id_reporte || reporte.id,
      filialId: filialId,
      programaId: programaId,
      fecha: fechaTransformada,
      estado: estadoTransformado,
      motivo: motivoTransformado,
      horaReal: horaReal,
      hora_tt: horaTT,
      target: targetTransformado,
      observaciones: reporte.observaciones || '',
      estadoTransmision: reporte.estadoTransmision,
      isActivo: reporte.isActivo,
      createdAt: reporte.createdAt,
      updateAt: reporte.updateAt
    };
    
    // Procesar el reporte con el sistema de mapeo para asegurar consistencia
    const reporteFinal = processReportTarget(reporteTransformado);
    
    console.log('✅ MAPEO - Reporte transformado final:', reporteFinal);
    return reporteFinal;
  });
};

// ==================== SINCRONIZACIÓN ====================

// Sincronizar datos del backend
export const sincronizarDatos = async () => {
  try {
    const [programasBackend, filialesBackend] = await Promise.all([
      getProgramasTransformados(),
      getFilialesTransformadas()
    ]);
    
    return {
      programas: programasBackend,
      filiales: filialesBackend,
      sincronizado: true,
      timezone: TIMEZONE_PERU,
      timestamp: obtenerFechaPeruana()
    };
    
  } catch (error) {
    return {
      programas: [],
      filiales: [],
      sincronizado: false,
      timezone: TIMEZONE_PERU,
      timestamp: obtenerFechaPeruana(),
      error: error.message
    };
  }
};

// ==================== UTILIDADES ====================

// Test de conexión
export const testConnection = async () => {
  try {
    const response = await api.get('/programa/listar');
    return {
      success: true,
      status: response.status,
      message: 'Conexión establecida correctamente',
      timezone: TIMEZONE_PERU,
      serverTime: response.headers['date'],
      localTime: obtenerFechaPeruana()
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      message: error.message || 'Error de conexión desconocido',
      timezone: TIMEZONE_PERU,
      localTime: obtenerFechaPeruana()
    };
  }
};

// Verificar salud del API
export const checkApiHealth = async () => {
  try {
    const [testPrograma, testFilial] = await Promise.all([
      api.get('/programa/listar'),
      api.get('/filial/listar')
    ]);
    
    let reporteStatus = false;
    try {
      const testReporte = await api.get('/reporte/listar');
      reporteStatus = testReporte.status === 200;
    } catch (error) {
      reporteStatus = false;
    }
    
    return {
      status: 'healthy',
      endpoints: {
        programa: testPrograma.status === 200,
        filial: testFilial.status === 200,
        reporte: reporteStatus
      },
      timezone: TIMEZONE_PERU,
      timestamp: obtenerFechaPeruana()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timezone: TIMEZONE_PERU,
      timestamp: obtenerFechaPeruana()
    };
  }
};

// ==================== EXPORTAR CONFIGURACIÓN ====================
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 10000,
  TIMEZONE: TIMEZONE_PERU,
  ENDPOINTS: {
    PROGRAMA_LISTAR: '/programa/listar',
    PROGRAMA_DETALLE: '/programa',
    FILIAL_LISTAR: '/filial/listar',
    FILIAL_DETALLE: '/filial',
    REPORTE: '/reporte',
    REPORTE_ADD: '/reporte/add',
    REPORTE_LISTAR: '/reporte/listar'
  }
};

// ==================== UTILIDADES EXPORTADAS ====================
export {
  obtenerFechaPeruana,
  formatearFechaParaBackend,
  transformarFechaDesdeBackend,
  TIMEZONE_PERU
};

// ==================== EXPORTAR FUNCIONES DEL SISTEMA DE MAPEO ====================
export {
  convertAbbrToBackendTarget,
  convertBackendTargetToAbbr,
  getTargetLabel,
  processReportTarget,
  isValidTargetAbbr,
  convertTargetSafe
};

export default api;