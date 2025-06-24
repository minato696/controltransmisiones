import axios from 'axios';

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
 * Convertir fecha de YYYY-MM-DD a DD/MM/YYYY (formato Backend)
 */
export const convertirFechaASwagger = (fechaISO) => {
  if (!fechaISO) return '';
  const [year, month, day] = fechaISO.split('-');
  return `${day}/${month}/${year}`;
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
  switch (estado) {
    case 'si': return 'Si';
    case 'no': return 'No';
    case 'tarde': return 'Tarde';
    case 'pendiente': return 'Pendiente';
    default: return 'Pendiente';
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
 * Crear un nuevo reporte
 */
export const createReporte = async (reporteData) => {
  try {
    console.log('DEPURACIÓN - API - Datos recibidos en createReporte:', reporteData);
    
    // Asegurarse de que hora_real esté presente y sea un string válido
    const horaReal = reporteData.hora_real || reporteData.horaReal || "05:00";
    console.log('DEPURACIÓN - API - Hora real utilizada:', horaReal);
    
    const reporte = {
      fecha: convertirFechaASwagger(reporteData.fecha),
      hora_real: horaReal, 
      motivo: reporteData.motivo || null,               
      estadoTransmision: convertirEstadoAEnum(reporteData.estadoTransmision),
      filialId: reporteData.filialId,                   
      programaId: reporteData.programaId,
      // Nuevos campos
      hora_tt: reporteData.hora_tt || null,
      target: reporteData.target || null
    };

    // Log para debugging - Este es el objeto que se enviará al backend
    console.log('DEPURACIÓN - API - Objeto final enviado al backend:', reporte);

    // Validación extra
    if (!reporte.fecha) {
      throw new Error('Campo obligatorio faltante: fecha');
    }

    if (typeof reporte.filialId !== 'number' || typeof reporte.programaId !== 'number') {
      throw new Error('filialId y programaId deben ser números');
    }
    
    // Antes de enviar al backend, comprobamos que hora_real sea un string
    if (reporte.hora_real && typeof reporte.hora_real !== 'string') {
      console.warn('DEPURACIÓN - API - hora_real no es string, convirtiendo:', reporte.hora_real);
      reporte.hora_real = String(reporte.hora_real);
    }
    
    const response = await api.post(REPORTE_ENDPOINTS.CREATE, [reporte]);
    console.log('DEPURACIÓN - API - Respuesta del backend:', response.data);
    
    return Array.isArray(response.data) ? response.data[0] : response.data;
  } catch (error) {
    console.error('DEPURACIÓN - API - Error en createReporte:', error);
    throw error;
  }
};

/**
 * Actualizar un reporte existente
 */
export const updateReporte = async (id, reporteData) => {
  try {
    const reporte = {
      id_reporte: id,
      fecha: convertirFechaASwagger(reporteData.fecha),
      hora_real: reporteData.hora_real || reporteData.horaReal || "05:00",
      motivo: reporteData.motivo || "OK",
      estadoTransmision: convertirEstadoAEnum(reporteData.estadoTransmision),
      filialId: reporteData.filialId,
      programaId: reporteData.programaId,
      // Nuevos campos
      hora_tt: reporteData.hora_tt || null,
      target: reporteData.target || null
    };
    
    const response = await api.put(`${REPORTE_ENDPOINTS.UPDATE}/${id}`, reporte);
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

/**
 * Guardar o actualizar un reporte
 */
export const guardarOActualizarReporte = async (filialId, programaId, fecha, datosReporte) => {
  try {
    console.log('DEPURACIÓN - API - Datos recibidos en guardarOActualizarReporte:', {
      filialId, programaId, fecha, datosReporte
    });
    
    // Extraer la hora real de todas las posibles fuentes
    const horaReal = datosReporte.horaReal || datosReporte.hora_real || "05:00";
    console.log('DEPURACIÓN - API - Hora real extraída:', horaReal);
    
    const reporteData = {
      filialId: filialId,
      programaId: programaId,
      fecha: fecha,
      estadoTransmision: datosReporte.estado || 'pendiente',
      motivo: datosReporte.motivo || null,
      hora_real: horaReal,
      observaciones: datosReporte.observaciones || null,
      // Nuevos campos
      hora_tt: datosReporte.hora_tt || null,
      target: datosReporte.target || null
    };
    
    console.log('DEPURACIÓN - API - Objeto preparado para enviar:', reporteData);
    
    // Si tenemos un ID, actualizar; si no, crear nuevo
    if (datosReporte.id_reporte) {
      console.log('DEPURACIÓN - API - Actualizando reporte existente:', datosReporte.id_reporte);
      return await updateReporte(datosReporte.id_reporte, reporteData);
    } else {
      console.log('DEPURACIÓN - API - Creando nuevo reporte');
      return await createReporte(reporteData);
    }
    
  } catch (error) {
    console.error('DEPURACIÓN - API - Error en guardarOActualizarReporte:', error);
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

/**
 /**
 * Transformar reportes del backend
 */
export const transformarReportes = (reportesBackend) => {
  return reportesBackend.map(reporte => {
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
    
    // Buscar hora con diferentes nombres
    const horaReal = reporte.hora_real || reporte.hora || reporte.horaReal || '';
    
    // Incluir los nuevos campos hora_tt y target
    const reporteTransformado = {
      id_reporte: reporte.id_reporte || reporte.id,
      filialId: filialId,
      programaId: programaId,
      fecha: fechaTransformada,
      estado: estadoTransformado,
      motivo: reporte.motivo || '',
      horaReal: horaReal,
      hora_tt: reporte.hora_tt || '', // Nuevo campo
      target: reporte.target || '',   // Nuevo campo
      observaciones: reporte.observaciones || '',
      estadoTransmision: reporte.estadoTransmision,
      isActivo: reporte.isActivo,
      createdAt: reporte.createdAt,
      updateAt: reporte.updateAt
    };
    
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