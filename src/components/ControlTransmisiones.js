// src/components/ControlTransmisiones.js - CORREGIDO (Sin violaciones de Hooks) - COMPLETO Y ACTUALIZADO
import React, { useMemo, useCallback } from 'react';

// ==================== IMPORTACIONES DEL SISTEMA DE MAPEO ====================
import { 
  convertAbbrToBackendTarget,
  getTargetLabel,
  getTargetForEstado,
  processReportTarget,
  isValidTargetAbbr
} from '../utils/targetMapping';

import { 
  Clock, CheckCircle, XCircle, AlertCircle, 
  FileText
} from 'lucide-react';
import ExportManager from './ExportManager';

// Importar módulos refactorizados
import { useGestorDatos } from './GestorDatos';
import { 
  HeaderSistema,
  ControlesFecha,
  CalendarioModal,
  FiltroBusqueda,
  EstadisticasPrograma,
  PestanasProgramas,
  TooltipReporte,
  ModalReporte,
  ModalNotas,
  LeyendaEstados,
  PanelInformacion,
  useModalManager
} from './InterfazUsuario';
import { 
  formatearFechaLocal, 
  obtenerFechaLocal,
  getSemanaFromDate,
  calcularEstadisticas,
  obtenerColor,
  diasSemana
} from './UtilidadesFecha';

// Función auxiliar optimizada para manejar conversiones de "Otro"
const convertTargetSafe = (target) => {
  if (target === 'Otro' || target === 'Otros') {
    return 'Otro';
  }
  return convertAbbrToBackendTarget(target);
};

/**
 * Componente principal OPTIMIZADO del sistema de transmisiones
 * CORREGIDO: Sin violaciones de las reglas de Hooks
 */

const TransmissionTracker = ({ 
  programasBackend = [], 
  filialesBackend = [], 
  estadoConexion,
  onSincronizar 
}) => {

  // ==================== HOOKS PERSONALIZADOS ====================
  
  // Hook para manejo de datos y lógica de negocio
  const {
    // Estados principales
    programas,
    filiales,
    programaActivo,
    setProgramaActivo,
    reportes,
    reportesBackend,
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
    
    // Funciones de notas
    obtenerNotaGeneral,
    guardarNotaGeneralBD,
    
    // Funciones de sincronización
    sincronizarManualmente,
    
    // Utilidades
    API_CONFIG,
    TIMEZONE_PERU
  } = useGestorDatos({ 
    programasBackend, 
    filialesBackend, 
    estadoConexion, 
    onSincronizar 
  });

  // Hook para manejo de modales y UI
  const {
    mostrarModal,
    setMostrarModal,
    reporteSeleccionado,
    setReporteSeleccionado,
    mostrarModalNotas,
    setMostrarModalNotas,
    notaSeleccionada,
    setNotaSeleccionada,
    vistaCalendario,
    setVistaCalendario,
    modoVista,
    setModoVista,
    filtroFilial,
    setFiltroFilial,
    tooltip,
    mostrarTooltip,
    ocultarTooltip,
    abrirModal,
    abrirModalNotas
  } = useModalManager();

  // ==================== CÁLCULOS MEMOIZADOS ====================
  
  const semanaActual = useMemo(() => getSemanaFromDate(fechaSeleccionada), [fechaSeleccionada]);
  
  const filialesFiltradas = useMemo(() => 
    filiales.filter(f => 
      f.nombre.toLowerCase().includes(filtroFilial.toLowerCase())
    ), [filiales, filtroFilial]
  );
  
  const stats = useMemo(() => 
    calcularEstadisticas(
      filiales, 
      semanaActual, 
      fechaSeleccionada, 
      programaActivo, 
      modoVista, 
      obtenerEstadoReporte
    ), [filiales, semanaActual, fechaSeleccionada, programaActivo, modoVista, obtenerEstadoReporte]
  );

  // ==================== FUNCIONES DE NAVEGACIÓN MEMOIZADAS ====================
  
  const navegarSemana = useCallback((direccion) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(fechaSeleccionada.getDate() + (direccion * 7));
    setFechaSeleccionada(nuevaFecha);
  }, [fechaSeleccionada, setFechaSeleccionada]);

  const irASemanaActual = useCallback(() => {
    setFechaSeleccionada(obtenerFechaLocal());
  }, [setFechaSeleccionada]);

  // ==================== FUNCIONES DE INTERACCIÓN OPTIMIZADAS ====================
  
  const manejarClickReporte = useCallback((filialId, programaId, fecha, diaNombre) => {
    const reporte = obtenerEstadoReporte(filialId, programaId, fecha);
    // PROCESAMIENTO MÍNIMO - solo si es necesario
    const reporteProcesado = reporte.target ? reporte : processReportTarget(reporte);
    abrirModal(filialId, programaId, fecha, diaNombre, reporteProcesado);
  }, [obtenerEstadoReporte, abrirModal]);

  const manejarClickNotas = useCallback((filial) => {
    const nota = obtenerNotaGeneral(filial.id);
    const semana = `${formatearFechaLocal(semanaActual.inicio)} - ${formatearFechaLocal(semanaActual.fin)}`;
    abrirModalNotas(filial, nota, semana);
  }, [obtenerNotaGeneral, semanaActual, abrirModalNotas]);

  // ==================== FUNCIÓN GUARDAR REPORTE OPTIMIZADA ====================

  const guardarReporte = useCallback(async () => {
    if (!reporteSeleccionado) return;
    
    try {
      console.log('🔄 GUARDAR - Iniciando con datos:', {
        estado: reporteSeleccionado.estado,
        target: reporteSeleccionado.target,
        motivo: reporteSeleccionado.motivo ? 'Sí' : 'No'
      });
      
      // Preparar datos según el estado de transmisión SIN PROCESAMIENTO EXCESIVO
      const datosReporte = { ...reporteSeleccionado };
      
      // Validar y asignar target según el estado - MÍNIMO PROCESAMIENTO
      if (datosReporte.estado === 'no' || datosReporte.estado === 'tarde') {
        const targetApropiado = datosReporte.target || getTargetForEstado(datosReporte.estado, null);
        datosReporte.target = targetApropiado;
      }
      
      // Configuraciones específicas por estado
      if (datosReporte.estado === 'si') {
        // Para "Sí transmitió"
        if (!datosReporte.horaReal) {
          const programaActual = programas.find(p => p.id === reporteSeleccionado.programaId);
          datosReporte.horaReal = programaActual?.horario || "05:00";
        }
        datosReporte.hora_tt = null;
        datosReporte.target = null;
        datosReporte.motivo = null;
        
        console.log('✅ PREPARADO - Reporte "Sí transmitió"');
      } 
      else if (datosReporte.estado === 'no') {
        // Para "No transmitió"
        datosReporte.horaReal = null;
        datosReporte.hora_tt = null;
        
        // IMPORTANTE: Verificar "Otros" ANTES de convertir - CORREGIDO
        const esOtros = datosReporte.target === 'Otros' || datosReporte.target === 'Otro';
        
        if (esOtros) {
          // Para "Otros", mantener motivo personalizado
          datosReporte.motivo = datosReporte.motivo || "";
          console.log('📝 OTROS - Motivo personalizado:', datosReporte.motivo.substring(0, 50));
        } else {
          // Para targets predefinidos, motivo es null
          datosReporte.motivo = null;
        }
        
        // Convertir target usando función segura
        datosReporte.target = convertTargetSafe(datosReporte.target);
        console.log('✅ PREPARADO - Reporte "No transmitió" con target:', datosReporte.target);
      }
      else if (datosReporte.estado === 'tarde') {
        // Para "Transmitió Tarde"
        if (!datosReporte.horaReal) {
          const programaActual = programas.find(p => p.id === reporteSeleccionado.programaId);
          datosReporte.horaReal = programaActual?.horario || "05:00";
        }
        
        if (!datosReporte.hora_tt) {
          const [horas, minutos] = datosReporte.horaReal.split(':').map(Number);
          let minutosRetrasados = minutos + 10;
          let horasRetrasadas = horas;
          
          if (minutosRetrasados >= 60) {
            horasRetrasadas += 1;
            minutosRetrasados -= 60;
          }
          
          datosReporte.hora_tt = `${String(horasRetrasadas).padStart(2, '0')}:${String(minutosRetrasados).padStart(2, '0')}`;
        }
        
        // Manejar motivo para transmisión tardía
        if (datosReporte.target === 'Otros') {
          // Para "Otros", usar motivo personalizado
          datosReporte.motivo = datosReporte.motivo || "";
        } else if (datosReporte.target) {
          // Para targets predefinidos, usar etiqueta como motivo
          const targetLabel = getTargetLabel(datosReporte.target, false);
          datosReporte.motivo = targetLabel;
        }
        
        // Para backend, target es null en transmisión tardía
        datosReporte.target = null;
        
        console.log('✅ PREPARADO - Reporte "Transmitió Tarde"');
      }
      
      console.log('📤 ENVÍO - Datos al backend preparados');
      
      // Enviar al backend
      await actualizarReporte(
        datosReporte.filialId, 
        datosReporte.programaId,
        datosReporte.fecha, 
        datosReporte
      );
      
      console.log('✅ ÉXITO - Reporte guardado');
      
      setMostrarModal(false);
      setReporteSeleccionado(null);
    } catch (error) {
      console.error('❌ ERROR - Al guardar reporte:', error.message);
      
      // Mensaje de error más descriptivo sin detalles técnicos excesivos
      let mensajeError = 'Error al guardar el reporte.';
      
      if (error.response?.status === 500) {
        mensajeError = 'Error interno del servidor.';
      } else if (error.response?.status === 400) {
        mensajeError = 'Datos incorrectos. Verifica los campos e intenta de nuevo.';
      } else if (error.response?.status === 404) {
        mensajeError = 'No se encontró el recurso en el servidor.';
      }
      
      alert(mensajeError);
    }
  }, [reporteSeleccionado, programas, actualizarReporte, setMostrarModal, setReporteSeleccionado]);

  const guardarNotaGeneral = useCallback(async () => {
    if (!notaSeleccionada) return;
    
    try {
      setGuardandoNota(true);
      const fechaInicioSemana = formatearFechaLocal(semanaActual.inicio);
      await guardarNotaGeneralBD(
        notaSeleccionada.filialId, 
        fechaInicioSemana, 
        notaSeleccionada.contenido
      );
      setMostrarModalNotas(false);
      setNotaSeleccionada(null);
      console.log('✅ NOTA - Guardada exitosamente');
    } catch (error) {
      console.error('ERROR - Al guardar nota:', error);
      alert('Error al guardar la nota. Por favor, inténtalo de nuevo.');
    } finally {
      setGuardandoNota(false);
    }
  }, [notaSeleccionada, semanaActual, guardarNotaGeneralBD, setMostrarModalNotas, setNotaSeleccionada, setGuardandoNota]);

  const manejarSincronizacion = useCallback(async () => {
    try {
      await sincronizarManualmente();
      alert('✅ Datos sincronizados correctamente');
    } catch (error) {
      alert('❌ ' + error.message);
    }
  }, [sincronizarManualmente]);

  // ==================== FUNCIÓN AUXILIAR PARA GENERAR TOOLTIP CORREGIDA ====================
  
  const generarTooltipContenido = useCallback((reporteProcesado) => {
    // IMPORTANTE: Asegurar que el reporte esté completamente procesado
    const reporteCompleto = processReportTarget(reporteProcesado);
    
    if (reporteCompleto.estado === 'si') {
      return `✅ Transmitió\nHora: ${reporteCompleto.horaReal || 'No registrada'}`;
    }
    
    if (reporteCompleto.estado === 'no') {
      let contenido = `❌ No transmitió`;
      if (reporteCompleto.target) {
        const targetLabel = getTargetLabel(reporteCompleto.target, false);
        contenido += `\nMotivo: ${targetLabel}`;
        
        // CORREGIDO: Mostrar detalle para "Otros" cuando hay motivo personalizado
        if (reporteCompleto.target === 'Otros' && reporteCompleto.motivo) {
          contenido += `\nDetalle: ${reporteCompleto.motivo}`;
        }
      }
      return contenido;
    }
    
    if (reporteCompleto.estado === 'tarde') {
      let contenido = `⏰ Transmitió tarde`;
      if (reporteCompleto.horaReal) {
        contenido += `\nHora real: ${reporteCompleto.horaReal}`;
      }
      if (reporteCompleto.hora_tt) {
        contenido += `\nHora TT: ${reporteCompleto.hora_tt}`;
      }
      if (reporteCompleto.target) {
        const targetLabel = getTargetLabel(reporteCompleto.target, false);
        contenido += `\nMotivo: ${targetLabel}`;
        
        // CORREGIDO: Mostrar detalle para "Otros" cuando hay motivo personalizado
        if (reporteCompleto.target === 'Otros' && reporteCompleto.motivo) {
          contenido += `\nDetalle: ${reporteCompleto.motivo}`;
        }
      }
      return contenido;
    }
    
    return `⏳ Pendiente`;
  }, []);

  // ==================== RENDERIZADO CONDICIONAL ====================
  
  const hayDatosDisponibles = programas.length > 0 || programasBackend.length > 0;

  if (loading && !hayDatosDisponibles) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Cargando sistema de transmisiones...</p>
          <p className="text-sm text-blue-600">Zona horaria: {TIMEZONE_PERU}</p>
          {sincronizando && (
            <p className="text-sm text-blue-600">Sincronizando con backend...</p>
          )}
        </div>
      </div>
    );
  }

  if (!loading && !programaActivo && programas.length === 0 && programasBackend.length === 0 && !estadoConexion?.connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sin conexión al backend</h2>
          <p className="text-gray-600 mb-4">
            No se puede conectar al servidor. Verifica tu conexión e intenta nuevamente.
          </p>
          <p className="text-sm text-gray-500 mb-4">Zona horaria: {TIMEZONE_PERU}</p>
          
          <button
            onClick={manejarSincronizacion}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Intentar Conectar
          </button>
        </div>
      </div>
    );
  }

  // ==================== FUNCIÓN AUXILIAR PARA RENDERIZADO DE CELDA (CORREGIDA) ====================
  
  const renderizarCeldaReporte = (filial, fecha, diaNombre, index = null) => {
    const reporte = obtenerEstadoReporte(filial.id, programaActivo?.id, fecha);
    
    // PROCESAMIENTO MÍNIMO - solo si no tiene target pero lo necesita
    let reporteProcesado = reporte;
    if ((reporte.estado === 'no' || reporte.estado === 'tarde') && !reporte.target && reporte.motivo) {
      reporteProcesado = processReportTarget(reporte);
    }
    
    const clave = `${filial.id}-${programaActivo?.id}-${fecha.toISOString().split('T')[0]}`;
    const tieneSincronizacion = reportesBackend[clave];
    
    return (
      <td key={index !== null ? index : fecha.toISOString()} className="px-4 py-4 text-center">
        <div className="relative inline-block">
          <button
            onClick={() => manejarClickReporte(filial.id, programaActivo?.id, fecha, diaNombre)}
            onMouseEnter={(e) => mostrarTooltip(e, reporteProcesado)}
            onMouseLeave={ocultarTooltip}
            className={`w-12 h-12 rounded-lg ${obtenerColor(reporteProcesado.estado)} hover:opacity-80 transition-opacity flex items-center justify-center`}
            title={generarTooltipContenido(reporteProcesado)}
          >
            {reporteProcesado.estado === 'si' && <CheckCircle className="w-4 h-4 text-white" />}
            {reporteProcesado.estado === 'no' && <XCircle className="w-4 h-4 text-white" />}
            {reporteProcesado.estado === 'tarde' && <AlertCircle className="w-4 h-4 text-white" />}
          </button>
          {tieneSincronizacion && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" 
                 title="Sincronizado con backend"></div>
          )}
        </div>
      </td>
    );
  };

  // ==================== RENDERIZADO PRINCIPAL ====================
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header del sistema */}
        <HeaderSistema 
          estadoConexion={estadoConexion}
          programas={programas}
          filiales={filiales}
          ultimaActualizacion={ultimaActualizacion}
          usingBackendData={usingBackendData}
          sincronizando={sincronizando}
          sincronizarManualmente={manejarSincronizacion}
          TIMEZONE_PERU={TIMEZONE_PERU}
        />

        {/* Controles de fecha y vista */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <ControlesFecha 
            modoVista={modoVista}
            setModoVista={setModoVista}
            fechaSeleccionada={fechaSeleccionada}
            semanaActual={semanaActual}
            vistaCalendario={vistaCalendario}
            setVistaCalendario={setVistaCalendario}
            navegarSemana={navegarSemana}
            irASemanaActual={irASemanaActual}
            setFechaSeleccionada={setFechaSeleccionada}
          />

          {/* Calendario desplegable */}
          <CalendarioModal 
            vistaCalendario={vistaCalendario}
            fechaSeleccionada={fechaSeleccionada}
            setFechaSeleccionada={setFechaSeleccionada}
            setVistaCalendario={setVistaCalendario}
          />

          {/* Filtro de búsqueda y exportación */}
          <div className="mt-4 flex justify-between items-center">
            <FiltroBusqueda 
              filtroFilial={filtroFilial}
              setFiltroFilial={setFiltroFilial}
              ExportManager={
                <ExportManager
                  programaActivo={programaActivo}
                  fechaSeleccionada={fechaSeleccionada}
                  semanaActual={semanaActual}
                  modoVista={modoVista}
                  filiales={filiales}
                  filialesFiltradas={filialesFiltradas}
                  diasSemana={diasSemana}
                  stats={stats}
                  obtenerEstadoReporte={obtenerEstadoReporte}
                  obtenerNotaGeneral={obtenerNotaGeneral}
                  formatearFecha={formatearFechaLocal}
                  getTargetLabel={getTargetLabel}
                  processReportTarget={processReportTarget}
                />
              }
            />
          </div>
        </div>

        {/* Advertencia sin conexión */}
        {!estadoConexion?.connected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Modo Sin Conexión - Usando datos locales
              </span>
              <span className="text-xs text-yellow-700">({TIMEZONE_PERU})</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Los cambios se guardarán localmente. Se sincronizarán automáticamente cuando se restablezca la conexión.
            </p>
          </div>
        )}

        {/* Pestañas de programas */}
        <PestanasProgramas 
          programas={programas}
          programaActivo={programaActivo}
          setProgramaActivo={setProgramaActivo}
        />

        {/* Estadísticas del programa */}
        <EstadisticasPrograma 
          programaActivo={programaActivo}
          stats={stats}
          modoVista={modoVista}
          semanaActual={semanaActual}
          fechaSeleccionada={fechaSeleccionada}
          filiales={filiales}
          TIMEZONE_PERU={TIMEZONE_PERU}
        />

        {/* Tabla principal de transmisiones */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {programaActivo?.nombre} - {programaActivo?.horario}
              <span className="ml-4 text-sm opacity-80">
                {modoVista === 'semana' ? 'Vista Semanal' : `Vista Diaria - ${formatearFechaLocal(fechaSeleccionada)}`}
              </span>
              {usingBackendData && (
                <span className="ml-2 px-2 py-1 bg-blue-500 text-xs rounded">
                  Backend Data
                </span>
              )}
              <span className="ml-2 px-2 py-1 bg-blue-500 text-xs rounded">
                {TIMEZONE_PERU}
              </span>
              {cargandoReportes && (
                <span className="ml-2 px-2 py-1 bg-yellow-500 text-xs rounded flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Cargando...
                </span>
              )}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-gray-900">Ciudad</th>
                  {modoVista === 'semana' ? (
                    semanaActual.fechas.map((fecha, index) => (
                      <th key={index} className="px-4 py-4 text-center font-medium min-w-[120px] text-gray-900">
                        <div className="flex flex-col">
                          <span>{diasSemana[index]}</span>
                          <span className="text-xs opacity-70">{formatearFechaLocal(fecha)}</span>
                        </div>
                      </th>
                    ))
                  ) : (
                    <>
                      <th className="px-4 py-4 text-center font-medium min-w-[120px] text-gray-900">
                        <div className="flex flex-col">
                          <span>{diasSemana[fechaSeleccionada.getDay() === 0 ? 6 : fechaSeleccionada.getDay() - 1] || 'Domingo'}</span>
                          <span className="text-xs opacity-70">{formatearFechaLocal(fechaSeleccionada)}</span>
                        </div>
                      </th>
                      <th className="px-4 py-4 text-center font-medium text-gray-900">Hora Real</th>
                      <th className="px-4 py-4 text-center font-medium text-gray-900">Observaciones</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filialesFiltradas.map(filial => {
                  const tieneNota = obtenerNotaGeneral(filial.id).length > 0;
                  
                  return (
                    <tr key={filial.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center justify-between">
                          <span>{filial.nombre}</span>
                          <div className="flex items-center gap-1">
                            {tieneNota && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" title="Tiene notas generales"></div>
                            )}
                            <button
                              onClick={() => manejarClickNotas(filial)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Ver/editar notas generales de la semana"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                      
                      {modoVista === 'semana' ? (
                        // Vista semanal - mostrar 6 días (lunes a sábado)
                        semanaActual.fechas.map((fecha, index) => 
                          renderizarCeldaReporte(filial, fecha, diasSemana[index], index)
                        )
                      ) : (
                        // Vista diaria - mostrar día seleccionado + hora + observaciones
                        (() => {
                          const reporte = obtenerEstadoReporte(filial.id, programaActivo?.id, fechaSeleccionada);
                          // PROCESAMIENTO MÍNIMO
                          const reporteProcesado = reporte.target ? reporte : processReportTarget(reporte);
                          const diaNombre = diasSemana[fechaSeleccionada.getDay() === 0 ? 6 : fechaSeleccionada.getDay() - 1] || 'Domingo';
                          
                          // Formatear observaciones con sistema de mapeo OPTIMIZADO
                          const formatearObservaciones = () => {
                            if (reporteProcesado.target && reporteProcesado.target !== 'Otros') {
                              return getTargetLabel(reporteProcesado.target, false);
                            }
                            return reporteProcesado.motivo || '-';
                          };
                          
                          return (
                            <>
                              {renderizarCeldaReporte(filial, fechaSeleccionada, diaNombre)}
                              <td className="px-4 py-4 text-center text-sm text-gray-600">
                                {reporteProcesado.horaReal || '-'}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                                {formatearObservaciones()}
                              </td>
                            </>
                          );
                        })()
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de información del sistema */}
        <PanelInformacion 
          estadoConexion={estadoConexion}
          usingBackendData={usingBackendData}
          reportes={reportes}
          reportesBackend={reportesBackend}
          programaActivo={programaActivo}
          API_CONFIG={API_CONFIG}
          TIMEZONE_PERU={TIMEZONE_PERU}
        />

        {/* Leyenda */}
        <LeyendaEstados />

        {/* ==================== MODALES ==================== */}
        
        {/* Tooltip */}
        <TooltipReporte tooltip={tooltip} />

        {/* Modal para editar reportes */}
        <ModalReporte 
          mostrarModal={mostrarModal}
          setMostrarModal={setMostrarModal}
          reporteSeleccionado={reporteSeleccionado}
          setReporteSeleccionado={setReporteSeleccionado}
          guardarReporte={guardarReporte}
          guardandoReporte={guardandoReporte}
          filiales={filiales}
          programas={programas}
          formatearFecha={formatearFechaLocal}
          TIMEZONE_PERU={TIMEZONE_PERU}
        />

        {/* Modal para notas generales */}
        <ModalNotas 
          mostrarModalNotas={mostrarModalNotas}
          setMostrarModalNotas={setMostrarModalNotas}
          notaSeleccionada={notaSeleccionada}
          setNotaSeleccionada={setNotaSeleccionada}
          guardarNotaGeneral={guardarNotaGeneral}
          guardandoNota={guardandoNota}
          TIMEZONE_PERU={TIMEZONE_PERU}
        />
      </div>
    </div>
  );
};

export default TransmissionTracker;