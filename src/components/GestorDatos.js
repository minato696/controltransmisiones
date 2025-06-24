// src/components/GestorDatos.js
import { useState, useEffect } from 'react';
import { 
  getProgramasTransformados, 
  getFilialesTransformadas,
  formatearFechaParaBackend,
  TIMEZONE_PERU,
  guardarOActualizarReporte,
  getReportesPorFechas,
  API_CONFIG
} from '../services/api';
import { 
  obtenerFechaLocal, 
  formatearFechaHoraCompleta, 
  formatearFechaParaBackendReporte,
  getSemanaFromDate,
  generarClave,
  generarClaveNota
} from './UtilidadesFecha';

/**
 * Hook personalizado para manejo de datos y estado del sistema
 */

export const useGestorDatos = ({ 
  programasBackend = [], 
  filialesBackend = [], 
  estadoConexion,
  onSincronizar 
}) => {
  // ==================== ESTADOS PRINCIPALES ====================
  const [programas, setProgramas] = useState([]);
  const [filiales, setFiliales] = useState([]);
  const [usingBackendData, setUsingBackendData] = useState(false);
  
  // Estados de fechas
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const ahora = new Date();
    return new Date(ahora.toLocaleString('en-US', {timeZone: TIMEZONE_PERU}));
  });
  
  // Estados de programa y reportes
  const [programaActivo, setProgramaActivo] = useState(null);
  const [reportes, setReportes] = useState({});
  const [reportesBackend, setReportesBackend] = useState({});
  
  // Estados de loading y sincronización
  const [loading, setLoading] = useState(true);
  const [guardandoReporte, setGuardandoReporte] = useState(false);
  const [cargandoReportes, setCargandoReportes] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  
  // Estados para notas generales
  const [notasGenerales, setNotasGenerales] = useState({});
  const [guardandoNota, setGuardandoNota] = useState(false);

  // ==================== INICIALIZACIÓN ====================
  
  useEffect(() => {
    inicializarDatos();
    
    // Actualizar fecha actual cada minuto
    const intervalId = setInterval(() => {
      const fechaActual = obtenerFechaLocal();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Actualizar datos cuando cambian los props del backend
  useEffect(() => {
    if (programasBackend.length > 0 || filialesBackend.length > 0) {
      actualizarDatosDesdeBackend();
    }
  }, [programasBackend.length, filialesBackend.length]);

  // Asegurar programa activo cuando hay datos disponibles
  useEffect(() => {
    if (!programaActivo && (programas.length > 0 || programasBackend.length > 0)) {
      const programasAUsar = programas.length > 0 ? programas : programasBackend;
      if (programasAUsar.length > 0) {
        setProgramaActivo(programasAUsar[0]);
      }
    }
  }, [programas.length, programasBackend.length, programaActivo]);

  // Cargar reportes cuando cambia programa o fecha
  useEffect(() => {
    const cargarReportesConDelay = async () => {
      if (programaActivo && estadoConexion?.connected) {
        setTimeout(async () => {
          await cargarReportesDesdeBackend();
        }, 100);
      }
    };
    
    cargarReportesConDelay();
  }, [programaActivo?.id, fechaSeleccionada.getTime(), estadoConexion?.connected]);

  // ==================== FUNCIONES DE INICIALIZACIÓN ====================
  
  const inicializarDatos = async () => {
    if (programasBackend.length > 0 || filialesBackend.length > 0) {
      actualizarDatosDesdeBackend();
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (estadoConexion?.connected) {
        await cargarDatosDelBackend();
      }
    } catch (error) {
      await cargarDatosLocales();
    } finally {
      if (programasBackend.length > 0 || filialesBackend.length > 0 || estadoConexion?.connected) {
        setLoading(false);
      }
    }
  };

  const cargarDatosDelBackend = async () => {
    try {
      setSincronizando(true);
      
      const [programasData, filialesData] = await Promise.all([
        getProgramasTransformados(),
        getFilialesTransformadas()
      ]);
      
      setProgramas(programasData);
      setFiliales(filialesData);
      setUsingBackendData(true);
      setUltimaActualizacion(obtenerFechaLocal());
      
      if (programasData.length > 0 && !programaActivo) {
        setProgramaActivo(programasData[0]);
      }
      
    } catch (error) {
      throw error;
    } finally {
      setSincronizando(false);
    }
  };

  const actualizarDatosDesdeBackend = () => {
    let datosActualizados = false;

    if (programasBackend.length > 0) {
      setProgramas(programasBackend);
      setUsingBackendData(true);
      datosActualizados = true;
      
      if (!programaActivo) {
        setProgramaActivo(programasBackend[0]);
      }
    }
    
    if (filialesBackend.length > 0) {
      setFiliales(filialesBackend);
      setUsingBackendData(true);
      datosActualizados = true;
    }
    
    if (datosActualizados) {
      setUltimaActualizacion(obtenerFechaLocal());
      setLoading(false);
    }
  };

  const cargarDatosLocales = async () => {
    try {
      setProgramas([]);
      setFiliales([]);
      setUsingBackendData(false);
      setProgramaActivo(null);
    } catch (error) {
      // Silencioso
    }
  };

  // Mejora para la función cargarReportesDesdeBackend en GestorDatos.js
// Reemplaza esta función en el archivo GestorDatos.js

const cargarReportesDesdeBackend = async () => {
  try {
    if (!programaActivo || !estadoConexion?.connected) {
      console.warn('No se pueden cargar reportes: no hay programa activo o no hay conexión');
      return;
    }

    setCargandoReportes(true);
    
    // Obtener fechas para consulta
    const semanaActual = getSemanaFromDate(fechaSeleccionada);
    const fechaInicio = formatearFechaParaBackendReporte(semanaActual.inicio);
    const fechaFin = formatearFechaParaBackendReporte(semanaActual.fin);
    
    console.log(`DEPURACIÓN - Cargando reportes para semana ${fechaInicio} al ${fechaFin}`);
    
    // Obtener reportes del backend
    const reportesData = await getReportesPorFechas(fechaInicio, fechaFin);
    console.log('DEPURACIÓN - Reportes obtenidos del backend:', reportesData);
    
    if (!reportesData || reportesData.length === 0) {
      console.log('No se encontraron reportes para el período seleccionado');
      setCargandoReportes(false);
      return;
    }
    
    // Procesar reportes
    const reportesMap = {};
    const reportesBackendMap = {};
    
    // Procesar todos los reportes, no solo los del programa actual
    // para mantener consistencia al cambiar de programa
    reportesData.forEach(reporte => {
      // Validar que el reporte tenga datos mínimos
      if (!reporte.filialId || !reporte.fecha) {
        console.warn('ADVERTENCIA: Reporte con datos incompletos:', reporte);
        return;
      }
      
      try {
        const fechaObj = new Date(reporte.fecha + 'T00:00:00');
        const clave = generarClave(reporte.filialId, reporte.programaId, fechaObj);
        
        // Verificar que la transformación del target sea correcta
        if (reporte.estado === 'no' && !reporte.target && reporte.target !== '') {
          console.warn('ADVERTENCIA: Reporte "no transmitió" sin target:', reporte);
          
          // Si es "no transmitió" y no tiene target, asignar uno por defecto
          if (!reporte.target) {
            reporte.target = 'Fta'; // Abreviatura para "Falta"
            console.log('DEPURACIÓN - Asignando target por defecto:', reporte.target);
          }
        }
        
        // Guardar reporte en el mapa
        reportesMap[clave] = {
          estado: reporte.estado || 'pendiente',
          motivo: reporte.motivo || '',
          horaReal: reporte.horaReal || '',
          hora_tt: reporte.hora_tt || '',
          target: reporte.target || '',
          observaciones: reporte.observaciones || ''
        };
        
        // Guardar ID del reporte para referencia
        if (reporte.id_reporte) {
          reportesBackendMap[clave] = reporte.id_reporte;
        }
        
        console.log(`DEPURACIÓN - Reporte procesado para clave ${clave}:`, reportesMap[clave]);
      } catch (error) {
        console.error('Error al procesar reporte:', error, reporte);
      }
    });
    
    // Actualizar estados
    setReportes(prevReportes => ({ ...prevReportes, ...reportesMap }));
    setReportesBackend(prevBackend => ({ ...prevBackend, ...reportesBackendMap }));
    
    console.log(`DEPURACIÓN - Carga completada: ${Object.keys(reportesMap).length} reportes procesados`);
    
  } catch (error) {
    console.error('Error al cargar reportes desde backend:', error);
  } finally {
    setCargandoReportes(false);
  }
};



// Función mejorada para obtenerEstadoReporte
// Reemplaza esta función en el archivo GestorDatos.js

const obtenerEstadoReporte = (filialId, programaId, fecha) => {
  // Verificar parámetros
  if (!filialId || !programaId || !fecha) {
    console.warn('ADVERTENCIA: Parámetros incompletos en obtenerEstadoReporte', {
      filialId, programaId, fecha
    });
    return { estado: 'pendiente', motivo: '', horaReal: '' };
  }

  // Generar clave para buscar en el objeto de reportes
  const clave = generarClave(filialId, programaId, fecha);
  
  // Buscar el reporte en la estructura local
  const reporteLocal = reportes[clave];
  
  // Buscar el ID del reporte en el backend (si existe)
  const reporteBackendId = reportesBackend[clave];
  
  // Debug para verificar qué reportes tenemos
  console.log(`DEPURACIÓN - obtenerEstadoReporte para clave: ${clave}`);
  console.log('- Reporte local:', reporteLocal);
  console.log('- ID Reporte backend:', reporteBackendId);
  
  // Si encontramos un reporte local, lo devolvemos
  if (reporteLocal) {
    // Asegurarse que todas las propiedades existan
    const reporteCompleto = {
      estado: reporteLocal.estado || 'pendiente',
      motivo: reporteLocal.motivo || '',
      horaReal: reporteLocal.horaReal || '',
      hora_tt: reporteLocal.hora_tt || '',
      target: reporteLocal.target || '', // Asegurar que target siempre exista
      observaciones: reporteLocal.observaciones || '',
      id_reporte: reporteBackendId
    };
    
    // Si el target no está definido pero tenemos un motivo, intentar inferir el target
    if (!reporteCompleto.target && reporteCompleto.motivo) {
      try {
        // Intentar encontrar un target basado en el motivo
        for (const [abbr, label] of Object.entries(getTargetLabelMap())) {
          if (reporteCompleto.motivo.includes(label) || 
              reporteCompleto.motivo.includes(abbr)) {
            reporteCompleto.target = abbr;
            console.log(`DEPURACIÓN - Target inferido del motivo: ${abbr}`);
            break;
          }
        }
      } catch (e) {
        console.error('Error al inferir target del motivo:', e);
      }
    }
    
    console.log('DEPURACIÓN - Devolviendo reporte completo:', reporteCompleto);
    return reporteCompleto;
  }
  
  // Si no hay reporte local, crear uno predeterminado
  return { 
    estado: 'pendiente', 
    motivo: '', 
    horaReal: '',
    hora_tt: '',
    target: '',
    observaciones: '',
    id_reporte: reporteBackendId
  };
};

// Función auxiliar para mapeo de targets a etiquetas
function getTargetLabelMap() {
  return {
    "Enf": "Enfermedad",
    "P. Tec": "Problema técnico",
    "F. Serv": "Falla de servicios",
    "Tde": "Tarde",
    "Fta": "Falta",
    "Otros": "Otros"
  };
}

const actualizarReporte = async (filialId, programaId, fecha, nuevoEstado) => {
  const clave = generarClave(filialId, programaId, fecha);
  
  try {
    // Actualizar estado local inmediatamente
    setReportes(prev => ({
      ...prev,
      [clave]: nuevoEstado
    }));

    // Si hay conexión, guardar en el backend
    if (estadoConexion?.connected) {
      setGuardandoReporte(true);
      
      const fechaFormateada = formatearFechaParaBackendReporte(fecha);
      
      // Preparar los datos del reporte incluyendo los nuevos campos
      const datosReporte = {
        ...nuevoEstado,
        id_reporte: reportesBackend[clave] || null,
        horaReal: nuevoEstado.horaReal || nuevoEstado.hora_real || 
                 (programaActivo?.horario) || "05:00",
        // Incluir los nuevos campos
        hora_tt: nuevoEstado.hora_tt || null,
        target: nuevoEstado.target || null
      };
      
      // Si el estado es 'tarde' y no hay motivo específico, usar target como motivo
      if (nuevoEstado.estado === 'tarde' && !nuevoEstado.motivo && nuevoEstado.target && nuevoEstado.target !== 'Otros') {
        datosReporte.motivo = nuevoEstado.target;
      }
      
      // Si el estado es 'no' y no hay motivo específico, usar target como motivo
      if (nuevoEstado.estado === 'no' && !nuevoEstado.motivo && nuevoEstado.target && nuevoEstado.target !== 'Otros') {
        datosReporte.motivo = nuevoEstado.target;
      }
      
      const resultado = await guardarOActualizarReporte(
        filialId, 
        programaId, 
        fechaFormateada, 
        datosReporte
      );
      
      // Actualizar el ID del reporte en el backend map
      if (resultado.id || resultado.id_reporte) {
        const reporteId = resultado.id || resultado.id_reporte;
        setReportesBackend(prev => ({
          ...prev,
          [clave]: reporteId
        }));
      }
      
      // Recargar reportes desde el backend para sincronizar
      await cargarReportesDesdeBackend();
    }
    
  } catch (error) {
    console.error('Error al actualizar reporte:', error.message);
    
    // Revertir cambio en caso de error
    setReportes(prev => {
      const newReportes = { ...prev };
      delete newReportes[clave];
      return newReportes;
    });
    
    // Mostrar error detallado al usuario
    let mensajeError = 'Error al guardar el reporte.';
    
    if (error.response?.data?.message) {
      mensajeError += `\n\nDetalle: ${error.response.data.message}`;
      
      if (error.response.data.message.includes('hora_real') || 
          error.response.data.message.includes('hora_tt')) {
        mensajeError += '\n\n💡 Sugerencia: Asegúrate de que el reporte tenga una hora válida.';
      }
    } else if (error.response?.data?.trace) {
      if (error.response.data.trace.includes('ArrayList<com.kalek.incidencia.dto.ReporteDTO>')) {
        mensajeError += '\n\nError de formato: El backend esperaba un array de reportes.';
      } else {
        mensajeError += `\n\nError técnico: ${error.response.data.error}`;
      }
    }
    
    mensajeError += '\n\nPor favor, verifica la conexión e inténtalo de nuevo.';
    
    throw new Error(mensajeError);
    
  } finally {
    setGuardandoReporte(false);
  }
};

  // ==================== FUNCIONES DE NOTAS ====================
  
  const obtenerNotaGeneral = (filialId) => {
    const clave = generarClaveNota(filialId, fechaSeleccionada);
    return notasGenerales[clave] || '';
  };

  const guardarNotaGeneralBD = async (filialId, fechaInicioSemana, contenido) => {
    try {
      const clave = `${filialId}-${fechaInicioSemana}`;
      setNotasGenerales(prev => ({
        ...prev,
        [clave]: contenido
      }));
    } catch (error) {
      throw error;
    }
  };

  // ==================== FUNCIONES DE SINCRONIZACIÓN ====================
  
  const sincronizarReportesPendientes = async () => {
    if (!estadoConexion?.connected) return;
    
    try {
      for (const [clave, reporte] of Object.entries(reportes)) {
        if (!reportesBackend[clave]) {
          const partes = clave.split('-');
          const filialId = parseInt(partes[0]);
          const programaId = parseInt(partes[1]);
          const fecha = partes.slice(2).join('-');
          
          try {
            const resultado = await guardarOActualizarReporte(
              filialId,
              programaId,
              fecha,
              reporte
            );
            
            if (resultado.id_reporte) {
              setReportesBackend(prev => ({
                ...prev,
                [clave]: resultado.id_reporte
              }));
            }
          } catch (error) {
            // Silencioso para reportes individuales
          }
        }
      }
    } catch (error) {
      // Silencioso
    }
  };

  const sincronizarManualmente = async () => {
    if (!estadoConexion?.connected) {
      throw new Error('No hay conexión con el backend. Verifica tu conexión e intenta nuevamente.');
    }

    try {
      setSincronizando(true);
      
      await cargarDatosDelBackend();
      await cargarReportesDesdeBackend();
      await sincronizarReportesPendientes();
      
      if (onSincronizar) {
        await onSincronizar();
      }
      
      return true;
    } catch (error) {
      throw error;
    } finally {
      setSincronizando(false);
    }
  };

  const refrescarReportes = async () => {
    if (!estadoConexion?.connected) {
      throw new Error('Sin conexión al backend. No se pueden refrescar los reportes.');
    }
    
    try {
      await cargarReportesDesdeBackend();
    } catch (error) {
      throw error;
    }
  };

  // ==================== RETORNO DEL HOOK ====================
  
  return {
    // Estados principales
    programas,
    filiales,
    programaActivo,
    setProgramaActivo,
    reportes,
    reportesBackend,
    notasGenerales,
    fechaSeleccionada,
    setFechaSeleccionada,
    
    // Estados de UI
    loading,
    usingBackendData,
    guardandoReporte,
    cargandoReportes,
    sincronizando,
    guardandoNota,
    setGuardandoNota,
    ultimaActualizacion,
    
    // Funciones de reportes
    obtenerEstadoReporte,
    actualizarReporte,
    cargarReportesDesdeBackend,
    refrescarReportes,
    
    // Funciones de notas
    obtenerNotaGeneral,
    guardarNotaGeneralBD,
    
    // Funciones de sincronización
    sincronizarManualmente,
    sincronizarReportesPendientes,
    
    // Utilidades
    API_CONFIG,
    TIMEZONE_PERU
  };
};