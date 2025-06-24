import axios from 'axios';
import { convertAbbrToBackendTarget, convertBackendTargetToAbbr } from '../utils/targetMapping';

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
      console.error('Error del servidor:', error.response?.data?.message || error.message);
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
      horaInicio: data.horario
    };
    
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
      horaInicio: data.horario
    };
    
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
      isActivo: data.isActivo
    };
    
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
      isActivo: data.isActivo
    };
    
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
    createdAt: transformarFechaDesdeBackend(filial.createdAt),
    updatedAt: transformarFechaDesdeBackend(filial.updateAt),
    createdAtOriginal: filial.createdAt,
    updatedAtOriginal: filial.updateAt,
    reportes: filial.reportes || []
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
 * Convertir fecha de YYYY-MM-DD a DD/MM/YYYY (formato Backend) - CORREGIDA
 * Maneja múltiples formatos de entrada
 */
export const convertirFechaASwagger = (fechaInput) => {
  console.log('DEPURACIÓN - convertirFechaASwagger - Entrada:', fechaInput);
  
  // Si es null o undefined, usar fecha actual
  if (!fechaInput) {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const año = hoy.getFullYear();
    console.log(`DEPURACIÓN - Usando fecha actual: ${dia}/${mes}/${año}`);
    return `${dia}/${mes}/${año}`;
  }
  
  // Si es objeto Date, convertir a formato DD/MM/YYYY
  if (fechaInput instanceof Date) {
    const dia = String(fechaInput.getDate()).padStart(2, '0');
    const mes = String(fechaInput.getMonth() + 1).padStart(2, '0');
    const año = fechaInput.getFullYear();
    console.log(`DEPURACIÓN - Convertido desde Date: ${dia}/${mes}/${año}`);
    return `${dia}/${mes}/${año}`;
  }
  
  // Si ya está en formato DD/MM/YYYY, devolverlo tal cual
  if (typeof fechaInput === 'string' && fechaInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    console.log('DEPURACIÓN - Ya está en formato DD/MM/YYYY:', fechaInput);
    return fechaInput;
  }
  
  // Si está en formato YYYY-MM-DD (ISO)
  if (typeof fechaInput === 'string' && fechaInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = fechaInput.split('-');
    console.log(`DEPURACIÓN - Convertido desde YYYY-MM-DD: ${day}/${month}/${year}`);
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
        console.log(`DEPURACIÓN - Convertido desde string genérico: ${dia}/${mes}/${año}`);
        return `${dia}/${mes}/${año}`;
      }
    } catch (error) {
      console.warn('DEPURACIÓN - Error al convertir string a fecha:', error);
    }
  }
  
  // Si nada funciona, devolver el input original con advertencia
  console.warn('DEPURACIÓN - No se pudo convertir la fecha, devolviendo original:', fechaInput);
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
      console.warn('DEPURACIÓN - Estado no reconocido:', estado);
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
 * Crear un nuevo reporte - IMPLEMENTACIÓN PARA "SÍ TRANSMITIÓ" Y "NO TRANSMITIÓ"
 */







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

// src/services/api.js - FUNCIONES CORREGIDAS PARA "TRANSMITIO TARDE"

/**
 * Crear un nuevo reporte - IMPLEMENTACIÓN CORREGIDA
 */
export const createReporte = async (reporteData) => {
  try {
    console.log('DEPURACIÓN - API - Datos recibidos en createReporte:', reporteData);
    
    // ===== PASO 1: Determinar el estado =====
    const estado = reporteData.estadoTransmision || reporteData.estado || 'Pendiente';
    const esSiTransmitio = estado === 'Si' || estado === 'si';
    const esNoTransmitio = estado === 'No' || estado === 'no';
    const esTardio = estado === 'Tarde' || estado === 'tarde';
    
    console.log('DEPURACIÓN - Estado determinado:', estado);
    
    // ===== PASO 2: Formatear la fecha correctamente =====
    let fechaFormateada;
    
    if (typeof reporteData.fecha === 'string') {
      if (reporteData.fecha.includes('/')) {
        // Ya está en formato DD/MM/YYYY
        fechaFormateada = reporteData.fecha;
      } else if (reporteData.fecha.includes('-')) {
        // Convertir de YYYY-MM-DD a DD/MM/YYYY
        const [year, month, day] = reporteData.fecha.split('-');
        fechaFormateada = `${day}/${month}/${year}`;
      } else {
        // Intentar como fecha genérica
        const fecha = new Date(reporteData.fecha);
        const day = String(fecha.getDate()).padStart(2, '0');
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const year = fecha.getFullYear();
        fechaFormateada = `${day}/${month}/${year}`;
      }
    } else if (reporteData.fecha instanceof Date) {
      // Convertir desde objeto Date
      const day = String(reporteData.fecha.getDate()).padStart(2, '0');
      const month = String(reporteData.fecha.getMonth() + 1).padStart(2, '0');
      const year = reporteData.fecha.getFullYear();
      fechaFormateada = `${day}/${month}/${year}`;
    } else {
      // Usar fecha actual como último recurso
      const hoy = new Date();
      const day = String(hoy.getDate()).padStart(2, '0');
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      const year = hoy.getFullYear();
      fechaFormateada = `${day}/${month}/${year}`;
    }
    
    console.log('DEPURACIÓN - Fecha formateada:', fechaFormateada);
    
    // ===== PASO 3: Extraer datos específicos según el estado =====
    let horaUsuario = null;
    let horaTT = null;
    let targetUsuario = null;
    let motivoUsuario = null;
    
    // Extraer la hora real (para "Sí transmitió" y "Transmitió Tarde")
    if (esSiTransmitio || esTardio) {
      if (reporteData.hora !== undefined) {
        horaUsuario = reporteData.hora;
      } else if (reporteData.horaReal !== undefined) {
        horaUsuario = reporteData.horaReal;
      } else if (reporteData.hora_real !== undefined) {
        horaUsuario = reporteData.hora_real;
      } else {
        // Solo en caso de no encontrar ningún valor
        horaUsuario = "05:00";
      }
      
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
    
    // Extraer target (solo para "No transmitió")
    if (esNoTransmitio) {
      if (reporteData.target !== undefined && reporteData.target !== null) {
        // Convertir de abreviatura (frontend) a valor completo (backend)
        targetUsuario = convertAbbrToBackendTarget(reporteData.target);
      }
    }
    
    // Extraer motivo (para "No transmitió" con Otros, o "Transmitió Tarde" opcional)
    if ((esNoTransmitio && reporteData.target === 'Otros') || esTardio) {
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
    } 
    else if (esNoTransmitio) {
      // Objeto para "No transmitió"
      reporteObjeto = {
        fecha: fechaFormateada,
        estadoTransmision: "No",
        target: targetUsuario,
        motivo: motivoUsuario,
        filialId: parseInt(reporteData.filialId),
        programaId: parseInt(reporteData.programaId),
        hora: null,
        hora_tt: null
      };
    }
    else if (esTardio) {
      // Objeto para "Transmitió Tarde" - AJUSTADO AL FORMATO DEL BACKEND
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
    console.log('DEPURACIÓN - Objeto final a enviar:', reporteObjeto);
    
    // IMPORTANTE: Enviar como array con un solo objeto
    const response = await api.post(REPORTE_ENDPOINTS.CREATE, [reporteObjeto]);
    console.log('DEPURACIÓN - Respuesta del backend:', response.data);
    
    return Array.isArray(response.data) ? response.data[0] : response.data;
  } catch (error) {
    console.error('DEPURACIÓN - Error en createReporte:', error);
    throw error;
  }
};

/**
 * Actualizar un reporte existente - IMPLEMENTACIÓN CORREGIDA
 */
export const updateReporte = async (id, reporteData) => {
  try {
    console.log('DEPURACIÓN - Actualizando reporte ID:', id, 'con datos:', reporteData);
    
    // ===== PASO 1: Determinar el estado =====
    const estado = reporteData.estadoTransmision || reporteData.estado || 'Pendiente';
    const esSiTransmitio = estado === 'Si' || estado === 'si';
    const esNoTransmitio = estado === 'No' || estado === 'no';
    const esTardio = estado === 'Tarde' || estado === 'tarde';
    
    console.log('DEPURACIÓN - Estado determinado:', estado);
    
    // ===== PASO 2: Formatear fecha si es necesario =====
    let fechaFormateada;
    
    if (typeof reporteData.fecha === 'string') {
      if (reporteData.fecha.includes('/')) {
        // Ya está en formato DD/MM/YYYY
        fechaFormateada = reporteData.fecha;
      } else {
        // Intentar convertir
        try {
          fechaFormateada = convertirFechaASwagger(reporteData.fecha);
        } catch (e) {
          console.error('Error al convertir fecha:', e);
          fechaFormateada = reporteData.fecha; // Usar la original
        }
      }
    } else if (reporteData.fecha instanceof Date) {
      // Convertir objeto Date
      const day = String(reporteData.fecha.getDate()).padStart(2, '0');
      const month = String(reporteData.fecha.getMonth() + 1).padStart(2, '0');
      const year = reporteData.fecha.getFullYear();
      fechaFormateada = `${day}/${month}/${year}`;
    } else {
      // Usar la fecha tal cual
      fechaFormateada = reporteData.fecha;
    }
    
    console.log('DEPURACIÓN - Fecha formateada:', fechaFormateada);
    
    // ===== PASO 3: Extraer datos específicos según el estado =====
    let horaUsuario = null;
    let horaTT = null;
    let targetUsuario = null;
    let motivoUsuario = null;
    
    // Extraer la hora real (para "Sí transmitió" y "Transmitió Tarde")
    if (esSiTransmitio || esTardio) {
      if (reporteData.hora !== undefined) {
        horaUsuario = reporteData.hora;
      } else if (reporteData.horaReal !== undefined) {
        horaUsuario = reporteData.horaReal;
      } else if (reporteData.hora_real !== undefined) {
        horaUsuario = reporteData.hora_real;
      } else {
        // Solo en caso de no encontrar ningún valor
        horaUsuario = "05:00";
      }
      
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
    
    // Extraer target (solo para "No transmitió")
    if (esNoTransmitio) {
      if (reporteData.target !== undefined && reporteData.target !== null) {
        // Convertir de abreviatura (frontend) a valor completo (backend)
        targetUsuario = convertAbbrToBackendTarget(reporteData.target);
      }
    }
    
    // Extraer motivo (para "No transmitió" con Otros, o "Transmitió Tarde" opcional)
    if ((esNoTransmitio && reporteData.target === 'Otros') || esTardio) {
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
        motivo: motivoUsuario,
        filialId: parseInt(reporteData.filialId),
        programaId: parseInt(reporteData.programaId),
        hora: null,
        hora_tt: null
      };
    }
    else if (esTardio) {
      // Objeto para "Transmitió Tarde" - AJUSTADO AL FORMATO DEL BACKEND
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
    
    console.log('DEPURACIÓN - Objeto final para actualización:', updateObjeto);
    
    // ===== PASO 5: Enviar actualización al backend =====
    const response = await api.put(`${REPORTE_ENDPOINTS.UPDATE}/${id}`, updateObjeto);
    console.log('DEPURACIÓN - Respuesta del backend para actualización:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('DEPURACIÓN - Error en updateReporte:', error);
    throw error;
  }
};

/**
 * Guardar o actualizar un reporte - IMPLEMENTACIÓN CORREGIDA
 */
export const guardarOActualizarReporte = async (filialId, programaId, fecha, datosReporte) => {
  try {
    console.log('DEPURACIÓN - Datos recibidos en guardarOActualizarReporte:', {
      filialId, programaId, fecha, datosReporte
    });
    
    // ===== PASO 1: Determinar el estado =====
    const estado = datosReporte.estadoTransmision || datosReporte.estado || 'Pendiente';
    const esSiTransmitio = estado === 'Si' || estado === 'si';
    const esNoTransmitio = estado === 'No' || estado === 'no';
    const esTardio = estado === 'Tarde' || estado === 'tarde';
    
    console.log('DEPURACIÓN - Estado determinado:', estado);
    
    // ===== PASO 2: Preparar datos según el estado =====
    let reporteObjeto = {
      filialId: parseInt(filialId),
      programaId: parseInt(programaId),
      fecha: fecha
    };
    
    if (esSiTransmitio) {
      // Extraer la hora proporcionada por el usuario
      let horaUsuario = null;
      
      if (datosReporte.hora !== undefined) {
        horaUsuario = datosReporte.hora;
      } else if (datosReporte.horaReal !== undefined) {
        horaUsuario = datosReporte.horaReal;
      } else if (datosReporte.hora_real !== undefined) {
        horaUsuario = datosReporte.hora_real;
      } else {
        // Solo como último recurso
        horaUsuario = "05:00";
      }
      
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
      
      if (datosReporte.target !== undefined && datosReporte.target !== null) {
        // Convertir de abreviatura (frontend) a valor completo (backend)
        targetUsuario = convertAbbrToBackendTarget(datosReporte.target);
        
        // Si el target es "Otros", extraer el motivo personalizado
        if (datosReporte.target === 'Otros') {
          motivoUsuario = datosReporte.motivo || null;
        }
      }
      
      // Preparar objeto para "No transmitió"
      reporteObjeto = {
        ...reporteObjeto,
        estadoTransmision: "No",
        target: targetUsuario,
        motivo: motivoUsuario,
        hora: null,
        hora_tt: null
      };
    }
    else if (esTardio) {
      // Extraer hora real y hora tardía
      let horaUsuario = null;
      let horaTT = null;
      let motivoUsuario = null;
      let targetSeleccionado = null;
      
      // Hora real
      if (datosReporte.hora !== undefined) {
        horaUsuario = datosReporte.hora;
      } else if (datosReporte.horaReal !== undefined) {
        horaUsuario = datosReporte.horaReal;
      } else {
        horaUsuario = "05:00";
      }
      
      // Hora tardía
      if (datosReporte.hora_tt !== undefined) {
        horaTT = datosReporte.hora_tt;
      } else {
        // Si no hay hora_tt, usar 10 minutos después de la hora real
        const [horas, minutos] = horaUsuario.split(':').map(Number);
        let minutosRetrasados = minutos + 10;
        let horasRetrasadas = horas;
        
        if (minutosRetrasados >= 60) {
          horasRetrasadas += 1;
          minutosRetrasados -= 60;
        }
        
        horaTT = `${String(horasRetrasadas).padStart(2, '0')}:${String(minutosRetrasados).padStart(2, '0')}`;
      }
      
      // Guardar el target seleccionado para poder usarlo como motivo
      if (datosReporte.target) {
        targetSeleccionado = datosReporte.target;
      }
      
      // Determinar el motivo basado en el target o el motivo explícito
      if (targetSeleccionado === 'Otros') {
        // Si es "Otros", usar el motivo personalizado
        motivoUsuario = datosReporte.motivo || null;
      } else if (targetSeleccionado) {
        // Si hay un target predefinido, usarlo como motivo
        motivoUsuario = targetSeleccionado;
      } else {
        // Si no hay target, usar el motivo tal cual
        motivoUsuario = datosReporte.motivo || null;
      }
      
      // Preparar objeto para "Transmitió Tarde" - AJUSTADO AL FORMATO DEL BACKEND
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
    
    console.log('DEPURACIÓN - Objeto preparado:', reporteObjeto);
    
    // ===== PASO 3: Decidir entre crear o actualizar =====
    if (datosReporte.id_reporte) {
      console.log('DEPURACIÓN - Actualizando reporte existente ID:', datosReporte.id_reporte);
      return await updateReporte(datosReporte.id_reporte, reporteObjeto);
    } else {
      console.log('DEPURACIÓN - Creando nuevo reporte');
      return await createReporte(reporteObjeto);
    }
    
  } catch (error) {
    console.error('DEPURACIÓN - Error en guardarOActualizarReporte:', error);
    throw error;
  }
};



export const inspeccionarReporteBackend = async (reporteId) => {
  try {
    console.log('INSPECCIÓN - Obteniendo reporte con ID:', reporteId);
    const response = await api.get(`${REPORTE_ENDPOINTS.GET_BY_ID}/${reporteId}`);
    
    console.log('INSPECCIÓN - Respuesta del backend:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Inspeccionar específicamente la estructura de hora_real
    const horaReal = response.data.hora_real;
    console.log('INSPECCIÓN - Tipo de hora_real:', typeof horaReal);
    console.log('INSPECCIÓN - Valor de hora_real:', horaReal);
    
    if (typeof horaReal === 'object') {
      console.log('INSPECCIÓN - hora_real es un objeto. Propiedades:');
      for (const prop in horaReal) {
        console.log(`  ${prop}: ${horaReal[prop]} (${typeof horaReal[prop]})`);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('INSPECCIÓN - Error al obtener reporte:', error);
    throw error;
  }
};

// Función para probar la creación de un reporte simple para depuración
export const crearReporteTest = async () => {
  try {
    const reporteSimple = {
      fecha: formatearFechaParaBackend(), // fecha actual
      hora_real: "05:00",
      motivo: "Test desde frontend",
      estadoTransmision: "Si",
      filialId: 1, // Usar un ID válido
      programaId: 1 // Usar un ID válido
    };
    
    console.log('TEST - Enviando reporte simple al backend:', reporteSimple);
    
    const response = await api.post(REPORTE_ENDPOINTS.CREATE, [reporteSimple]);
    console.log('TEST - Respuesta del backend:', response.data);
    
    // Si se creó correctamente, intentamos obtenerlo para ver su estructura
    if (Array.isArray(response.data) && response.data.length > 0) {
      const reporteId = response.data[0].id || response.data[0].id_reporte;
      await inspeccionarReporteBackend(reporteId);
    }
    
    return Array.isArray(response.data) ? response.data[0] : response.data;
  } catch (error) {
    console.error('TEST - Error al crear reporte de prueba:', error);
    throw error;
  }
};

// Función para inspeccionar cómo maneja el backend el formato de hora
export const probarFormatosHora = async () => {
  const formatos = [
    { formato: "05:00", descripcion: "String simple HH:MM" },
    { formato: { hour: 5, minute: 0 }, descripcion: "Objeto con hour y minute" },
    { formato: "05:00:00", descripcion: "String con segundos HH:MM:SS" },
    { formato: 5, descripcion: "Número (solo hora)" }
  ];
  
  const resultados = [];
  
  for (const test of formatos) {
    try {
      const reporteTest = {
        fecha: formatearFechaParaBackend(),
        hora_real: test.formato,
        motivo: `Test formato: ${test.descripcion}`,
        estadoTransmision: "Si",
        filialId: 1,
        programaId: 1
      };
      
      console.log(`TEST FORMATO - Probando: ${test.descripcion}`, reporteTest);
      
      const response = await api.post(REPORTE_ENDPOINTS.CREATE, [reporteTest]);
      const resultado = Array.isArray(response.data) ? response.data[0] : response.data;
      
      resultados.push({
        formato: test.formato,
        descripcion: test.descripcion,
        exito: true,
        respuesta: resultado
      });
      
    } catch (error) {
      resultados.push({
        formato: test.formato,
        descripcion: test.descripcion,
        exito: false,
        error: error.message
      });
    }
  }
  
  console.log('RESULTADOS DE PRUEBAS DE FORMATO:');
  console.table(resultados);
  
  return resultados;
};

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

// src/services/api.js - FUNCIÓN transformarReportes CORREGIDA

// src/services/api.js - FUNCIÓN transformarReportes CORREGIDA

export const transformarReportes = (reportesBackend) => {
  console.log('DEPURACIÓN - Iniciando transformación de reportes del backend', 
              {cantidad: reportesBackend?.length || 0});
  
  if (!reportesBackend || !Array.isArray(reportesBackend)) {
    console.warn('ADVERTENCIA: No hay reportes para transformar o formato inválido', reportesBackend);
    return [];
  }
  
  return reportesBackend.map(reporte => {
    console.log('DEPURACIÓN - Transformando reporte individual:', reporte);
    
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
        console.error('Error al transformar fecha:', error);
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
    
    // Convertir el target del backend a la abreviatura del frontend
    let targetTransformado = null;
    let motivoTransformado = reporte.motivo || '';
    
    // CASO ESPECIAL: Para "Transmitio Tarde", el target es null según el backend
    if (estadoTransformado === 'tarde') {
      // Verificar si el motivo coincide con alguno de los motivos predefinidos
      const motivosPredefinidos = {
        'Tarde': 'Tde',
        'Tde': 'Tde',
        'Falta': 'Fta',
        'Fta': 'Fta',
        'Enfermedad': 'Enf',
        'Enf': 'Enf',
        'Problema técnico': 'P. Tec',
        'Problema tecnico': 'P. Tec',
        'P. Tec': 'P. Tec',
        'Falla de servicios': 'F. Serv',
        'F. Serv': 'F. Serv'
      };
      
      // Comprobar si el motivo coincide con alguno de los predefinidos
      let encontrado = false;
      if (motivoTransformado) {
        for (const [motivoKey, targetValue] of Object.entries(motivosPredefinidos)) {
          // Comprobar si el motivo coincide exactamente o contiene la clave
          if (motivoTransformado === motivoKey || 
              motivoTransformado.toLowerCase().includes(motivoKey.toLowerCase())) {
            targetTransformado = targetValue;
            encontrado = true;
            // No limpiamos el motivo, lo mantenemos para referencia
            break;
          }
        }
      }
      
      // Si no encontramos coincidencia con los motivos predefinidos, es un motivo personalizado
      if (!encontrado && motivoTransformado) {
        targetTransformado = 'Otros';
        // Mantenemos el motivo personalizado
      } else if (!motivoTransformado) {
        // Si no hay motivo, usamos Tde como predeterminado
        targetTransformado = 'Tde';
      }
      
      console.log('DEPURACIÓN - Reporte tarde con motivo:', motivoTransformado, 'Target asignado:', targetTransformado);
    } 
    // Para "No transmitió", procesar el target normalmente
    else if (estadoTransformado === 'no' && reporte.target) {
      targetTransformado = convertBackendTargetToAbbr(reporte.target);
      console.log('DEPURACIÓN - Target convertido de backend:', reporte.target, '→', targetTransformado);
    } 
    // En caso de no transmitir y no tener target, asignar uno por defecto
    else if (estadoTransformado === 'no') {
      targetTransformado = 'Fta'; // Valor por defecto para "No transmitió"
      console.log('DEPURACIÓN - Asignando target por defecto para No transmitió:', targetTransformado);
    }
    
    // Incluir los nuevos campos hora_tt y target
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
    
    console.log('DEPURACIÓN - Reporte transformado final:', reporteTransformado);
    return reporteTransformado;
  });
};


/**
 * Función para crear múltiples reportes
 */
export const createReportesBatch = async (reportesArray) => {
  try {
    const reportesBackend = reportesArray.map(reporteData => ({
      fecha: convertirFechaASwagger(reporteData.fecha),
      hora_real: reporteData.hora_real || reporteData.horaReal || "05:00",
      motivo: reporteData.motivo || "OK",
      estadoTransmision: convertirEstadoAEnum(reporteData.estadoTransmision),
      filialId: reporteData.filialId,
      programaId: reporteData.programaId
    }));
    
    const response = await api.post(REPORTE_ENDPOINTS.CREATE, reportesBackend);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== VERIFICACIÓN DE ESTRUCTURA ====================

/**
 * Función para verificar estructura de datos del backend
 */
export const verificarEstructuraBackend = async () => {
  try {
    const programas = await getProgramas();
    const filiales = await getFiliales();
    const reportes = await getReportes();
    return { programas, filiales, reportes };
  } catch (error) {
    throw error;
  }
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

export default api;