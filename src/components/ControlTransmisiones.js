// src/components/TransmissionTracker.js (Refactorizado)
import React from 'react';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, 
  FileText, Wifi, WifiOff
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

/**
 * Componente principal refactorizado del sistema de transmisiones
 * Responsabilidades:
 * - Coordinación entre GestorDatos e InterfazUsuario
 * - Renderizado de la tabla principal de transmisiones
 * - Manejo de eventos de interacción principal
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

  // ==================== CÁLCULOS DERIVADOS ====================
  
  const semanaActual = getSemanaFromDate(fechaSeleccionada);
  const filialesFiltradas = filiales.filter(f => 
    f.nombre.toLowerCase().includes(filtroFilial.toLowerCase())
  );
  const stats = calcularEstadisticas(
    filiales, 
    semanaActual, 
    fechaSeleccionada, 
    programaActivo, 
    modoVista, 
    obtenerEstadoReporte
  );

  // ==================== FUNCIONES DE NAVEGACIÓN ====================
  
  const navegarSemana = (direccion) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(fechaSeleccionada.getDate() + (direccion * 7));
    setFechaSeleccionada(nuevaFecha);
  };

  const irASemanaActual = () => {
    setFechaSeleccionada(obtenerFechaLocal());
  };

  // ==================== FUNCIONES DE INTERACCIÓN ====================
  
  const manejarClickReporte = (filialId, programaId, fecha, diaNombre) => {
    const reporte = obtenerEstadoReporte(filialId, programaId, fecha);
    abrirModal(filialId, programaId, fecha, diaNombre, reporte);
  };

  const manejarClickNotas = (filial) => {
    const nota = obtenerNotaGeneral(filial.id);
    const semana = `${formatearFechaLocal(semanaActual.inicio)} - ${formatearFechaLocal(semanaActual.fin)}`;
    abrirModalNotas(filial, nota, semana);
  };

  const guardarReporte = async () => {
  if (!reporteSeleccionado) return;
  
  try {
    // Log detallado antes de enviar al backend
    console.log('DEPURACIÓN - FRONTEND - Datos antes de enviar al backend:');
    console.log('Estado:', reporteSeleccionado.estado);
    console.log('Hora Real:', reporteSeleccionado.horaReal);
    console.log('Hora TT:', reporteSeleccionado.hora_tt);
    console.log('Target:', reporteSeleccionado.target);
    console.log('Motivo:', reporteSeleccionado.motivo);
    console.log('Objeto completo:', reporteSeleccionado);
    
    // Preparar datos según el estado de transmisión
    const datosReporte = { ...reporteSeleccionado };
    
    // Si es "Sí transmitió", asegurarnos que solo enviamos lo necesario
    if (reporteSeleccionado.estado === 'si') {
      // Verificar que la hora real esté presente
      if (!datosReporte.horaReal) {
        // Si no hay hora real, usar la hora del programa
        const programaActual = programas.find(p => p.id === reporteSeleccionado.programaId);
        datosReporte.horaReal = programaActual?.horario || "05:00";
        console.log('DEPURACIÓN - Se asignó hora predeterminada:', datosReporte.horaReal);
      }
      
      // Para "Sí transmitió" solo enviamos estado y hora real
      datosReporte.hora_tt = null;
      datosReporte.target = null;
      datosReporte.motivo = null;
    } 
    // Si es "No transmitió", enviar estado y target como motivo
    else if (reporteSeleccionado.estado === 'no') {
      datosReporte.horaReal = null;
      datosReporte.hora_tt = null;
      // Si el target es "Otros", usar el motivo, sino usar el target como motivo
      if (reporteSeleccionado.target === 'Otros') {
        // Mantener el motivo personalizado
      } else {
        datosReporte.motivo = reporteSeleccionado.target;
      }
    }
    // Si es "Transmitio Tarde", enviar todos los campos
    
    // Log de lo que vamos a enviar después de los ajustes
    console.log('DEPURACIÓN - FRONTEND - Datos ajustados para enviar:');
    console.log('Estado:', datosReporte.estado);
    console.log('Hora Real:', datosReporte.horaReal);
    console.log('Hora TT:', datosReporte.hora_tt);
    console.log('Target:', datosReporte.target);
    console.log('Motivo:', datosReporte.motivo);
    
    // Enviar al backend
    await actualizarReporte(
      datosReporte.filialId, 
      datosReporte.programaId,
      datosReporte.fecha, 
      datosReporte
    );
    
    setMostrarModal(false);
    setReporteSeleccionado(null);
  } catch (error) {
    console.error('DEPURACIÓN - Error al guardar reporte:', error);
    alert(error.message);
  }
};

  const guardarNotaGeneral = async () => {
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
      console.log('✅ Nota guardada exitosamente con timezone:', TIMEZONE_PERU);
    } catch (error) {
      console.error('Error al guardar la nota:', error);
      alert('Error al guardar la nota. Por favor, inténtalo de nuevo.');
    } finally {
      setGuardandoNota(false);
    }
  };

  const manejarSincronizacion = async () => {
    try {
      await sincronizarManualmente();
      alert('✅ Datos sincronizados correctamente con zona horaria de Perú');
    } catch (error) {
      alert('❌ ' + error.message);
    }
  };

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
                  Cargando reportes...
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
                        // Vista semanal - mostrar 5 días
                        semanaActual.fechas.map((fecha, index) => {
                          const reporte = obtenerEstadoReporte(filial.id, programaActivo?.id, fecha);
                          const clave = `${filial.id}-${programaActivo?.id}-${fecha.toISOString().split('T')[0]}`;
                          const tieneSincronizacion = reportesBackend[clave];
                          
                          return (
                            <td key={index} className="px-4 py-4 text-center">
                              <div className="relative inline-block">
                                <button
                                  onClick={() => manejarClickReporte(filial.id, programaActivo?.id, fecha, diasSemana[index])}
                                  onMouseEnter={(e) => mostrarTooltip(e, reporte)}
                                  onMouseLeave={ocultarTooltip}
                                  className={`w-12 h-12 rounded-lg ${obtenerColor(reporte.estado)} hover:opacity-80 transition-opacity flex items-center justify-center`}
                                >
                                  {reporte.estado === 'si' && <CheckCircle className="w-4 h-4 text-white" />}
                                  {reporte.estado === 'no' && <XCircle className="w-4 h-4 text-white" />}
                                  {reporte.estado === 'tarde' && <AlertCircle className="w-4 h-4 text-white" />}
                                </button>
                                {tieneSincronizacion && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" 
                                       title="Sincronizado con backend"></div>
                                )}
                              </div>
                            </td>
                          );
                        })
                      ) : (
                        // Vista diaria - mostrar día seleccionado + hora + observaciones
                        (() => {
                          const reporte = obtenerEstadoReporte(filial.id, programaActivo?.id, fechaSeleccionada);
                          const diaNombre = diasSemana[fechaSeleccionada.getDay() === 0 ? 6 : fechaSeleccionada.getDay() - 1] || 'Domingo';
                          const clave = `${filial.id}-${programaActivo?.id}-${fechaSeleccionada.toISOString().split('T')[0]}`;
                          const tieneSincronizacion = reportesBackend[clave];
                          
                          return (
                            <>
                              <td className="px-4 py-4 text-center">
                                <div className="relative inline-block">
                                  <button
                                    onClick={() => manejarClickReporte(filial.id, programaActivo?.id, fechaSeleccionada, diaNombre)}
                                    onMouseEnter={(e) => mostrarTooltip(e, reporte)}
                                    onMouseLeave={ocultarTooltip}
                                    className={`w-12 h-12 rounded-lg ${obtenerColor(reporte.estado)} hover:opacity-80 transition-opacity flex items-center justify-center`}
                                  >
                                    {reporte.estado === 'si' && <CheckCircle className="w-4 h-4 text-white" />}
                                    {reporte.estado === 'no' && <XCircle className="w-4 h-4 text-white" />}
                                    {reporte.estado === 'tarde' && <AlertCircle className="w-4 h-4 text-white" />}
                                  </button>
                                  {tieneSincronizacion && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" 
                                         title="Sincronizado con backend"></div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center text-sm text-gray-600">
                                {reporte.horaReal || '-'}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                                {reporte.motivo || '-'}
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