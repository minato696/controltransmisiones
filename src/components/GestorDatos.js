// src/components/GestorDatos.js - OPTIMIZADO PARA RENDIMIENTO - COMPLETO Y ACTUALIZADO
import { useState, useEffect, useCallback, useMemo } from 'react';
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

// ==================== IMPORTACIONES DEL SISTEMA DE MAPEO ====================
import { 
  convertAbbrToBackendTarget,
  convertBackendTargetToAbbr,
  getTargetLabel,
  getTargetForEstado,
  processReportTarget,
  isValidTargetAbbr,
  getTargetFromMotivo,
  targetToFullLabel
} from '../utils/targetMapping';

/**
 * Hook personalizado OPTIMIZADO para manejo de datos y estado del sistema
 * Reducción significativa de llamadas al sistema de mapeo
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

  // ==================== MEMOIZACIÓN PARA OPTIMIZACIÓN ====================
  
  // Memoizar la función obtenerEstadoReporte para evitar recálculos innecesarios - CORREGIDA
  const obtenerEstadoReporte = useCallback((filialId, programaId, fecha) => {
    // Verificar parámetros con logging mínimo
    if (!filialId || !programaId || !fecha) {
      return { estado: 'pendiente', motivo: '', horaReal: '', target: '', hora_tt: '', observaciones: '' };
    }

    // Generar clave para buscar en el objeto de reportes
    const clave = generarClave(filialId, programaId, fecha);
    
    // Buscar el reporte en la estructura local
    const reporteLocal = reportes[clave];
    const reporteBackendId = reportesBackend[clave];
    
    // Solo hacer logging si hay debugging activo
    const debugEnabled = false; // Cambiar a true solo para debugging
    if (debugEnabled) {
      console.log(`🔍 MAPEO - obtenerEstadoReporte para clave: ${clave}`);
    }
    
    // Si encontramos un reporte local, lo devolvemos procesado
    if (reporteLocal) {
      // Asegurarse que todas las propiedades existan
      const reporteCompleto = {
        estado: reporteLocal.estado || 'pendiente',
        motivo: reporteLocal.motivo || '',
        horaReal: reporteLocal.horaReal || '',
        hora_tt: reporteLocal.hora_tt || '',
        target: reporteLocal.target || '',
        observaciones: reporteLocal.observaciones || '',
        id_reporte: reporteBackendId
      };
      
      // CORREGIDO: SIEMPRE procesar con sistema de mapeo para asegurar transformaciones
      let reporteFinal = processReportTarget(reporteCompleto);
      
      // TRANSFORMACIÓN ESPECÍFICA: "Otro" del backend → "Otros" del frontend
      if (reporteFinal.target === 'Otro') {
        reporteFinal = {
          ...reporteFinal,
          target: 'Otros'
        };
        if (debugEnabled) {
          console.log('🔄 MAPEO - Target transformado de "Otro" a "Otros"');
        }
      }
      
      if (debugEnabled) {
        console.log('✅ MAPEO - Devolviendo reporte procesado:', reporteFinal);
      }
      return reporteFinal;
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
  }, [reportes, reportesBackend]); // Solo depende de reportes y reportesBackend

  // ==================== FUNCIONES DE INICIALIZACIÓN OPTIMIZADAS ====================
  
  const inicializarDatos = useCallback(async () => {
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
  }, [programasBackend.length, filialesBackend.length, estadoConexion?.connected]);

  const cargarDatosDelBackend = useCallback(async () => {
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
  }, [programaActivo]);

  const actualizarDatosDesdeBackend = useCallback(() => {
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
  }, [programasBackend, filialesBackend, programaActivo]);

  const cargarDatosLocales = useCallback(async () => {
    try {
      setProgramas([]);
      setFiliales([]);
      setUsingBackendData(false);
      setProgramaActivo(null);
    } catch (error) {
      // Silencioso
    }
  }, []);

  // ==================== FUNCIÓN OPTIMIZADA PARA CARGAR REPORTES ====================
  
  const cargarReportesDesdeBackend = useCallback(async () => {
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
      
      console.log(`🔄 CARGA - Reportes para semana ${fechaInicio} al ${fechaFin}`);
      
      // Obtener reportes del backend
      const reportesData = await getReportesPorFechas(fechaInicio, fechaFin);
      
      if (!reportesData || reportesData.length === 0) {
        console.log('No se encontraron reportes para el período seleccionado');
        setCargandoReportes(false);
        return;
      }
      
      // Procesar reportes CON MAPEO COMPLETO - CORREGIDO
      const reportesMap = {};
      const reportesBackendMap = {};
      
      reportesData.forEach(reporte => {
        // Validar que el reporte tenga datos mínimos
        if (!reporte.filialId || !reporte.fecha) {
          return;
        }
        
        try {
          const fechaObj = new Date(reporte.fecha + 'T00:00:00');
          const clave = generarClave(reporte.filialId, reporte.programaId, fechaObj);
          
          // PROCESAMIENTO COMPLETO CON TRANSFORMACIONES
          let reporteProcesado = { ...reporte };
          
          // TRANSFORMACIÓN ESPECÍFICA: "Otro" del backend → "Otros" del frontend
          if (reporteProcesado.target === 'Otro') {
            reporteProcesado.target = 'Otros';
            console.log('🔄 MAPEO - Transformando "Otro" a "Otros" en carga');
          }
          
          // Aplicar procesamiento del sistema de mapeo
          reporteProcesado = processReportTarget(reporteProcesado);
          
          // Guardar reporte en el mapa
          reportesMap[clave] = {
            estado: reporteProcesado.estado || 'pendiente',
            motivo: reporteProcesado.motivo || '',
            horaReal: reporteProcesado.horaReal || '',
            hora_tt: reporteProcesado.hora_tt || '',
            target: reporteProcesado.target || '',
            observaciones: reporteProcesado.observaciones || ''
          };
          
          // Guardar ID del reporte para referencia
          if (reporte.id_reporte) {
            reportesBackendMap[clave] = reporte.id_reporte;
          }
          
        } catch (error) {
          console.error('❌ Error al procesar reporte individual:', error);
        }
      });
      
      // Actualizar estados de una sola vez
      setReportes(prevReportes => ({ ...prevReportes, ...reportesMap }));
      setReportesBackend(prevBackend => ({ ...prevBackend, ...reportesBackendMap }));
      
      console.log(`✅ CARGA - ${Object.keys(reportesMap).length} reportes cargados`);
      
    } catch (error) {
      console.error('❌ Error al cargar reportes desde backend:', error);
    } finally {
      setCargandoReportes(false);
    }
  }, [programaActivo?.id, fechaSeleccionada, estadoConexion?.connected]);

  // ==================== FUNCIÓN OPTIMIZADA PARA ACTUALIZAR REPORTES ====================
  
  const actualizarReporte = useCallback(async (filialId, programaId, fecha, nuevoEstado) => {
    const clave = generarClave(filialId, programaId, fecha);
    
    try {
      console.log('🔄 ACTUALIZAR - Reporte:', { filialId, programaId, fecha, estado: nuevoEstado.estado });
      
      // Procesar el estado con mapeo MÍNIMO
      let estadoProcesado = { ...nuevoEstado };
      
      // Solo aplicar procesamiento de mapeo si es necesario
      if ((nuevoEstado.estado === 'no' || nuevoEstado.estado === 'tarde') && 
          (!nuevoEstado.target || nuevoEstado.target === '')) {
        estadoProcesado = processReportTarget(nuevoEstado);
      }
      
      // Actualizar estado local inmediatamente
      setReportes(prev => ({
        ...prev,
        [clave]: estadoProcesado
      }));

      // Si hay conexión, guardar en el backend
      if (estadoConexion?.connected) {
        setGuardandoReporte(true);
        
        const fechaFormateada = formatearFechaParaBackendReporte(fecha);
        
        // Preparar los datos del reporte con conversiones mínimas
        const datosReporte = {
          ...estadoProcesado,
          id_reporte: reportesBackend[clave] || null,
          horaReal: estadoProcesado.horaReal || estadoProcesado.hora_real || 
                   (programaActivo?.horario) || "05:00",
          hora_tt: estadoProcesado.hora_tt || null,
          target: estadoProcesado.target || null
        };
        
        console.log('📤 ENVIAR - Datos al backend:', {
          estado: datosReporte.estado,
          target: datosReporte.target,
          motivo: datosReporte.motivo ? datosReporte.motivo.substring(0, 50) + '...' : null
        });
        
        const resultado = await guardarOActualizarReporte(
          filialId, 
          programaId, 
          fechaFormateada, 
          datosReporte
        );
        
        console.log('✅ GUARDADO - Reporte actualizado exitosamente');
        
        // Actualizar el ID del reporte en el backend map
        if (resultado.id || resultado.id_reporte) {
          const reporteId = resultado.id || resultado.id_reporte;
          setReportesBackend(prev => ({
            ...prev,
            [clave]: reporteId
          }));
        }
        
        // NO recargar todos los reportes, solo el que se actualizó es suficiente
      }
      
    } catch (error) {
      console.error('❌ Error al actualizar reporte:', error.message);
      
      // Revertir cambio en caso de error
      setReportes(prev => {
        const newReportes = { ...prev };
        delete newReportes[clave];
        return newReportes;
      });
      
      throw error;
      
    } finally {
      setGuardandoReporte(false);
    }
  }, [estadoConexion?.connected, reportesBackend, programaActivo?.horario]);

  // ==================== FUNCIONES DE NOTAS OPTIMIZADAS ====================
  
  const obtenerNotaGeneral = useCallback((filialId) => {
    const clave = generarClaveNota(filialId, fechaSeleccionada);
    return notasGenerales[clave] || '';
  }, [notasGenerales, fechaSeleccionada]);

  const guardarNotaGeneralBD = useCallback(async (filialId, fechaInicioSemana, contenido) => {
    try {
      const clave = `${filialId}-${fechaInicioSemana}`;
      setNotasGenerales(prev => ({
        ...prev,
        [clave]: contenido
      }));
    } catch (error) {
      throw error;
    }
  }, []);

  // ==================== FUNCIONES DE SINCRONIZACIÓN OPTIMIZADAS ====================
  
  const sincronizarManualmente = useCallback(async () => {
    if (!estadoConexion?.connected) {
      throw new Error('No hay conexión con el backend. Verifica tu conexión e intenta nuevamente.');
    }

    try {
      setSincronizando(true);
      console.log('🔄 SYNC - Iniciando sincronización manual');
      
      await cargarDatosDelBackend();
      await cargarReportesDesdeBackend();
      
      if (onSincronizar) {
        await onSincronizar();
      }
      
      console.log('✅ SYNC - Sincronización completada');
      return true;
    } catch (error) {
      console.error('❌ SYNC - Error en sincronización:', error);
      throw error;
    } finally {
      setSincronizando(false);
    }
  }, [estadoConexion?.connected, cargarDatosDelBackend, cargarReportesDesdeBackend, onSincronizar]);

  // ==================== EFECTOS OPTIMIZADOS ====================
  
  useEffect(() => {
    inicializarDatos();
    
    // Actualizar fecha actual cada minuto
    const intervalId = setInterval(() => {
      obtenerFechaLocal();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []); // Sin dependencias para evitar re-inicializaciones

  // Actualizar datos cuando cambian los props del backend
  useEffect(() => {
    if (programasBackend.length > 0 || filialesBackend.length > 0) {
      actualizarDatosDesdeBackend();
    }
  }, [programasBackend.length, filialesBackend.length, actualizarDatosDesdeBackend]);

  // Asegurar programa activo cuando hay datos disponibles
  useEffect(() => {
    if (!programaActivo && (programas.length > 0 || programasBackend.length > 0)) {
      const programasAUsar = programas.length > 0 ? programas : programasBackend;
      if (programasAUsar.length > 0) {
        setProgramaActivo(programasAUsar[0]);
      }
    }
  }, [programas.length, programasBackend.length, programaActivo]);

  // Cargar reportes - CON DEBOUNCING para evitar llamadas excesivas
  useEffect(() => {
    let timeoutId;
    
    if (programaActivo && estadoConexion?.connected) {
      // Debouncing de 300ms para evitar llamadas excesivas
      timeoutId = setTimeout(() => {
        cargarReportesDesdeBackend();
      }, 300);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [programaActivo?.id, fechaSeleccionada.getTime(), estadoConexion?.connected]);

  // ==================== RETORNO DEL HOOK OPTIMIZADO ====================
  
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
    
    // Funciones de reportes MEMOIZADAS
    obtenerEstadoReporte,
    actualizarReporte,
    cargarReportesDesdeBackend,
    
    // Funciones de notas MEMOIZADAS
    obtenerNotaGeneral,
    guardarNotaGeneralBD,
    
    // Funciones de sincronización MEMOIZADAS
    sincronizarManualmente,
    
    // Utilidades
    API_CONFIG,
    TIMEZONE_PERU,
    
    // Funciones del sistema de mapeo exportadas
    getTargetLabel,
    processReportTarget,
    convertAbbrToBackendTarget,
    convertBackendTargetToAbbr
  };
};