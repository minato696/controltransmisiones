// src/components/GestorDatos.js
import { useState, useEffect } from 'react';
import { 
  getProgramasTransformados, 
  getFilialesTransformadas,
  formatearFechaParaBackend,
  TIMEZONE_PERU,
  guardarOActualizarReporte,
  getReportesPorFechas,
  API_CONFIG,
  transformarReportes
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

  // ==================== FUNCIONES DE REPORTES ====================
  
  const cargarReportesDesdeBackend = async () => {
    try {
      if (!programaActivo || !estadoConexion?.connected) return;

      setCargandoReportes(true);
      
      const semanaActual = getSemanaFromDate(fechaSeleccionada);
      const fechaInicio = formatearFechaParaBackendReporte(semanaActual.inicio);
      const fechaFin = formatearFechaParaBackendReporte(semanaActual.fin);
      
      const reportesData = await getReportesPorFechas(fechaInicio, fechaFin);
      
      const reportesMap = {};
      const reportesBackendMap = {};
      
      reportesData.forEach(reporte => {
        if (reporte.programaId === programaActivo.id) {
          const fechaObj = new Date(reporte.fecha + 'T00:00:00');
          const clave = generarClave(reporte.filialId, reporte.programaId, fechaObj);
          
          reportesMap[clave] = {
            estado: reporte.estado,
            motivo: reporte.motivo,
            horaReal: reporte.horaReal,
            horaTardio: reporte.horaTardio,
            observaciones: reporte.observaciones,
            target: reporte.target // Incluir target si existe
          };
          
          reportesBackendMap[clave] = reporte.id_reporte;
        }
      });
      
      setReportes(prevReportes => ({ ...prevReportes, ...reportesMap }));
      setReportesBackend(prevBackend => ({ ...prevBackend, ...reportesBackendMap }));
      
    } catch (error) {
      // Silencioso
    } finally {
      setCargandoReportes(false);
    }
  };

  const obtenerEstadoReporte = (filialId, programaId, fecha) => {
    const clave = generarClave(filialId, programaId, fecha);
    const reporteBase = reportes[clave] || { estado: 'pendiente', motivo: '', horaReal: '', target: null };
    
    // Inferir target si no existe pero hay motivo
    if (!reporteBase.target && reporteBase.motivo) {
      // Asignar el target basado en el motivo (abreviatura)
      if (reporteBase.estado === 'no' || reporteBase.estado === 'tarde') {
        // Usar el motivo como target si está disponible
        return {
          ...reporteBase,
          target: reporteBase.motivo || 'Falta'
        };
      }
    } else if (reporteBase.estado === 'no' && !reporteBase.target) {
      // Asignar target por defecto para estado "no"
      return {
        ...reporteBase,
        target: 'Fta'
      };
    }
    
    return reporteBase;
  };

  // Función mejorada para actualizarReporte
  const actualizarReporte = async (filialId, programaId, fecha, nuevoEstado) => {
    const clave = generarClave(filialId, programaId, fecha);
    
    try {
      // Actualizar estado local inmediatamente para feedback UI inmediato
      setReportes(prev => ({
        ...prev,
        [clave]: nuevoEstado
      }));

      // Si hay conexión, guardar en el backend
      if (estadoConexion?.connected) {
        setGuardandoReporte(true);
        
        const fechaFormateada = formatearFechaParaBackendReporte(fecha);
        
        // Incluir el campo target en los datos del reporte
        const datosReporte = {
          ...nuevoEstado,
          id_reporte: reportesBackend[clave] || null,
          horaReal: nuevoEstado.horaReal || nuevoEstado.hora_real || 
                   (programaActivo?.horario) || "05:00",
          target: nuevoEstado.estado === 'no' ? (nuevoEstado.target || 'Falta') : null,
          // Asegurar que horaTardio esté presente para estado 'tarde'
          horaTardio: nuevoEstado.estado === 'tarde' 
            ? (nuevoEstado.horaTardio || obtenerHoraTardiaPorDefecto(nuevoEstado.horaReal || "05:00")) 
            : null
        };
        
        const resultado = await guardarOActualizarReporte(
          filialId, 
          programaId, 
          fechaFormateada, 
          datosReporte
        );
        
        // Extraer correctamente la respuesta (podría ser array)
        const reporteResultado = Array.isArray(resultado) ? resultado[0] : resultado;
        
        // Actualizar el ID del reporte en el backend map
        if (reporteResultado && (reporteResultado.id || reporteResultado.id_reporte)) {
          const reporteId = reporteResultado.id || reporteResultado.id_reporte;
          setReportesBackend(prev => ({
            ...prev,
            [clave]: reporteId
          }));
          
          // También actualizar los datos del reporte local con los valores del backend
          if (reporteResultado) {
            const reporteTransformado = transformarReporteIndividual(reporteResultado);
            if (reporteTransformado) {
              setReportes(prev => ({
                ...prev,
                [clave]: {
                  estado: reporteTransformado.estado || nuevoEstado.estado,
                  motivo: reporteTransformado.motivo || nuevoEstado.motivo,
                  horaReal: reporteTransformado.horaReal || nuevoEstado.horaReal,
                  horaTardio: reporteTransformado.horaTardio || nuevoEstado.horaTardio,
                  observaciones: reporteTransformado.observaciones || nuevoEstado.observaciones,
                  target: reporteTransformado.target || nuevoEstado.target
                }
              }));
            }
          }
        }
        
        // IMPORTANTE: Recargar de forma forzada los reportes para esta semana
        await recargarReportesForzado();
      }
      
    } catch (error) {
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
        
        if (error.response.data.message.includes('hora_real')) {
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

  // Nueva función para obtener una hora tardía por defecto (1 hora después de la hora normal)
  const obtenerHoraTardiaPorDefecto = (horaBase) => {
    try {
      const [horas, minutos] = horaBase.split(':').map(Number);
      let nuevaHora = horas + 1;
      if (nuevaHora >= 24) nuevaHora = 23;
      return `${nuevaHora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    } catch (error) {
      return "06:00"; // Hora tardía por defecto en caso de error
    }
  };

  // Nueva función para transformar un reporte individual
  const transformarReporteIndividual = (reporte) => {
    if (!reporte) return null;
    
    try {
      // Utilizar la función transformarReportes pero para un solo reporte
      const reportesTransformados = transformarReportes([reporte]);
      return reportesTransformados[0];
    } catch (error) {
      return null;
    }
  };

  // Nueva función para recargar reportes de forma forzada
  const recargarReportesForzado = async () => {
    try {
      if (!programaActivo || !estadoConexion?.connected) return;

      setCargandoReportes(true);
      
      // Obtener semana actual
      const semanaActual = getSemanaFromDate(fechaSeleccionada);
      const fechaInicio = formatearFechaParaBackendReporte(semanaActual.inicio);
      const fechaFin = formatearFechaParaBackendReporte(semanaActual.fin);
      
      // Obtener reportes desde el backend
      const reportesData = await getReportesPorFechas(fechaInicio, fechaFin);
      
      // Mapas para almacenar los reportes
      const reportesMap = {};
      const reportesBackendMap = {};
      
      // Recorrer los reportes y mapearlos
      reportesData.forEach(reporte => {
        // NO FILTRAR por programaId para asegurar que obtenemos todos los reportes
        const fechaObj = new Date(reporte.fecha + 'T00:00:00');
        const clave = generarClave(reporte.filialId, reporte.programaId, fechaObj);
        
        reportesMap[clave] = {
          estado: reporte.estado,
          motivo: reporte.motivo,
          horaReal: reporte.horaReal,
          horaTardio: reporte.horaTardio,
          observaciones: reporte.observaciones,
          target: reporte.target
        };
        
        reportesBackendMap[clave] = reporte.id_reporte;
      });
      
      // Actualizar estado con los nuevos reportes
      setReportes(reportesMap);
      setReportesBackend(reportesBackendMap);
      
    } catch (error) {
      // Silencioso
    } finally {
      setCargandoReportes(false);
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