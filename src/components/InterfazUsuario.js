// src/components/InterfazUsuario.js
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search, 
  ChevronLeft, ChevronRight, FileText, Wifi, WifiOff, 
  Save, RefreshCw
} from 'lucide-react';
import { 
  formatearFechaLocal, 
  formatearFechaHoraCompleta, 
  obtenerFechaLocal,
  getSemanaFromDate,
  generarCalendario,
  calcularEstadisticas,
  obtenerColor,
  diasSemana,
  meses
} from './UtilidadesFecha';
import { 
  targetOptions, 
  convertBackendTargetToAbbr, 
  convertAbbrToBackendTarget,
  getTargetLabel,
  getTargetForEstado,
  processReportTarget
} from '../utils/targetMapping';

/**
 * Componentes de interfaz de usuario para el sistema de transmisiones
 * Responsabilidades:
 * - Renderizado de componentes visuales
 * - Manejo de modales y tooltips
 * - Eventos de interacción del usuario
 * - Gestión de filtros y vistas
 */

// ==================== COMPONENTE HEADER ====================

export const HeaderSistema = ({ 
  estadoConexion, 
  programas, 
  filiales, 
  ultimaActualizacion, 
  usingBackendData,
  sincronizando,
  sincronizarManualmente,
  TIMEZONE_PERU 
}) => (
  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Control de Transmisiones EXITOSA - Perú
          </h1>
          
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            estadoConexion?.connected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {estadoConexion?.connected ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {usingBackendData ? 'Backend' : 'Local'}
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            {TIMEZONE_PERU}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span>{programas.length} programas</span>
          <span>{filiales.length} filiales</span>
          {ultimaActualizacion && (
            <span>Actualizado: {formatearFechaHoraCompleta(ultimaActualizacion)}</span>
          )}
          <span className="text-blue-600">🕐 {formatearFechaHoraCompleta(obtenerFechaLocal())}</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={sincronizarManualmente}
          disabled={sincronizando || !estadoConexion?.connected}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
            sincronizando
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : estadoConexion?.connected
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
          {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>
    </div>
  </div>
);

// ==================== COMPONENTE CONTROLES DE FECHA ====================

export const ControlesFecha = ({ 
  modoVista, 
  setModoVista, 
  fechaSeleccionada, 
  semanaActual, 
  vistaCalendario, 
  setVistaCalendario, 
  navegarSemana, 
  irASemanaActual,
  setFechaSeleccionada 
}) => (
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2 mr-4">
      <button
        onClick={() => setModoVista('semana')}
        className={`px-3 py-2 text-sm rounded-lg ${
          modoVista === 'semana' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Vista Semana
      </button>
      <button
        onClick={() => setModoVista('dia')}
        className={`px-3 py-2 text-sm rounded-lg ${
          modoVista === 'dia' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Vista Día
      </button>
    </div>

    <div className="flex items-center gap-2">
      {modoVista === 'semana' && (
        <button
          onClick={() => navegarSemana(-1)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      
      <button
        onClick={() => setVistaCalendario(!vistaCalendario)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Calendar className="w-4 h-4" />
        <span className="font-medium">
          {modoVista === 'semana' 
            ? `${formatearFechaLocal(semanaActual.inicio)} - ${formatearFechaLocal(semanaActual.fin)}`
            : formatearFechaLocal(fechaSeleccionada)
          }
        </span>
      </button>
      
      {modoVista === 'semana' && (
        <button
          onClick={() => navegarSemana(1)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
    
    <button
      onClick={modoVista === 'semana' ? irASemanaActual : () => setFechaSeleccionada(obtenerFechaLocal())}
      className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
    >
      {modoVista === 'semana' ? 'Semana actual' : 'Hoy'}
    </button>
  </div>
);

// ==================== COMPONENTE CALENDARIO ====================

export const CalendarioModal = ({ 
  vistaCalendario, 
  fechaSeleccionada, 
  setFechaSeleccionada, 
  setVistaCalendario 
}) => {
  if (!vistaCalendario) return null;

  const calendario = generarCalendario(fechaSeleccionada);

  return (
    <div className="absolute z-20 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">
          {meses[fechaSeleccionada.getMonth()]} {fechaSeleccionada.getFullYear()}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => {
              const nuevaFecha = new Date(fechaSeleccionada);
              nuevaFecha.setMonth(fechaSeleccionada.getMonth() - 1);
              setFechaSeleccionada(nuevaFecha);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const nuevaFecha = new Date(fechaSeleccionada);
              nuevaFecha.setMonth(fechaSeleccionada.getMonth() + 1);
              setFechaSeleccionada(nuevaFecha);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(dia => (
          <div key={dia} className="text-center text-sm font-medium text-gray-500 p-2">
            {dia}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendario.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              setFechaSeleccionada(item.fecha);
              setVistaCalendario(false);
            }}
            className={`p-2 text-sm rounded hover:bg-blue-100 ${
              item.esDelMes ? 'text-gray-900' : 'text-gray-400'
            } ${
              formatearFechaLocal(item.fecha) === formatearFechaLocal(fechaSeleccionada)
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : ''
            }`}
          >
            {item.fecha.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
};

// ==================== COMPONENTE FILTRO DE BÚSQUEDA ====================

export const FiltroBusqueda = ({ filtroFilial, setFiltroFilial, ExportManager }) => (
  <div className="flex justify-between items-center">
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar ciudad..."
        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={filtroFilial}
        onChange={(e) => setFiltroFilial(e.target.value)}
      />
    </div>
    
    {ExportManager}
  </div>
);

// ==================== COMPONENTE ESTADÍSTICAS ====================

export const EstadisticasPrograma = ({ 
  programaActivo, 
  stats, 
  modoVista, 
  semanaActual, 
  fechaSeleccionada, 
  filiales,
  TIMEZONE_PERU 
}) => (
  <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900">
        Estadísticas - {programaActivo?.nombre}
      </h3>
      <span className="text-sm text-gray-500">
        {modoVista === 'semana' 
          ? `Semana del ${formatearFechaLocal(semanaActual.inicio)} al ${formatearFechaLocal(semanaActual.fin)}`
          : `Día ${formatearFechaLocal(fechaSeleccionada)}`
        } ({TIMEZONE_PERU})
      </span>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-500">
          Total {modoVista === 'semana' ? `(${filiales.length} ciudades × 5 días)` : `(${filiales.length} ciudades)`}
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{stats.transmitidas}</div>
        <div className="text-sm text-gray-500">Transmitidas</div>
      </div>
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-red-600">{stats.noTransmitidas}</div>
        <div className="text-sm text-gray-500">No transmitidas</div>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-yellow-600">{stats.tardias}</div>
        <div className="text-sm text-gray-500">Transmitio Tarde</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-600">{stats.pendientes}</div>
        <div className="text-sm text-gray-500">Pendientes</div>
      </div>
    </div>
    
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-900">Efectividad de Transmisión</span>
        <span className="text-lg font-bold text-blue-600">
          {stats.total > 0 ? Math.round((stats.transmitidas / stats.total) * 100) : 0}%
        </span>
      </div>
      <div className="mt-2 bg-blue-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${stats.total > 0 ? (stats.transmitidas / stats.total) * 100 : 0}%` }}
        ></div>
      </div>
    </div>
  </div>
);

// ==================== COMPONENTE PESTAÑAS DE PROGRAMAS ====================

export const PestanasProgramas = ({ programas, programaActivo, setProgramaActivo }) => (
  <div className="bg-white rounded-lg shadow-sm mb-6">
    <div className="flex overflow-x-auto">
      {programas.map((programa) => (
        <button
          key={programa.id}
          onClick={() => setProgramaActivo(programa)}
          className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
            programaActivo?.id === programa.id
              ? 'text-blue-600 border-blue-600 bg-blue-50'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span>{programa.nombre}</span>
            <span className="text-xs opacity-75">{programa.horario}</span>
          </div>
        </button>
      ))}
    </div>
  </div>
);

// ==================== COMPONENTE TOOLTIP ====================

export const TooltipReporte = ({ tooltip }) => {
  if (!tooltip.visible) return null;

  // Formatear contenido del tooltip usando el sistema de mapeo
  const formatearContenidoTooltip = () => {
    const reporte = tooltip.reporte || {};
    
    if (reporte.estado === 'si') {
      const horaReal = reporte.horaReal || reporte.hora_real || reporte.hora || '';
      return `✅ Transmitió\nHora: ${horaReal || 'No registrada'}`;
    }
    
    if (reporte.estado === 'no') {
      let contenido = `❌ No transmitió`;
      
      if (reporte.target) {
        const targetLabel = getTargetLabel(reporte.target, false);
        contenido += `\nMotivo: ${targetLabel}`;
      }
      
      if (reporte.motivo && (!reporte.target || reporte.target === 'Otros')) {
        contenido += `\nDetalle: ${reporte.motivo}`;
      }
      
      return contenido;
    }
    
    if (reporte.estado === 'tarde') {
      let contenido = `⏰ Transmitió tarde`;
      
      const horaReal = reporte.horaReal || reporte.hora_real || reporte.hora || '';
      if (horaReal) {
        contenido += `\nHora real: ${horaReal}`;
      }
      
      if (reporte.hora_tt) {
        contenido += `\nHora TT: ${reporte.hora_tt}`;
      }
      
      if (reporte.target) {
        const targetLabel = getTargetLabel(reporte.target, false);
        contenido += `\nMotivo: ${targetLabel}`;
      }
      
      if (reporte.motivo && (!reporte.target || reporte.target === 'Otros')) {
        contenido += `\nDetalle: ${reporte.motivo}`;
      }
      
      return contenido;
    }
    
    return `⏳ Pendiente`;
  };

  const content = tooltip.content || formatearContenidoTooltip();

  return (
    <div
      className="fixed z-50 bg-black text-white px-3 py-2 rounded-lg text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full max-w-xs break-words"
      style={{
        left: tooltip.x,
        top: tooltip.y,
      }}
    >
      <div className="whitespace-pre-wrap">{content}</div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
    </div>
  );
};

// ==================== COMPONENTE MODAL DE REPORTE ====================

export const ModalReporte = ({ 
  mostrarModal, 
  setMostrarModal, 
  reporteSeleccionado, 
  setReporteSeleccionado, 
  guardarReporte, 
  guardandoReporte,
  filiales,
  programas,
  formatearFecha,
  TIMEZONE_PERU 
}) => {
  // Usar useEffect para procesar el reporte cuando cambia
  useEffect(() => {
    if (reporteSeleccionado && reporteSeleccionado.estado) {
      // Procesar el target del reporte usando el sistema de mapeo
      const reporteProcesado = processReportTarget(reporteSeleccionado);
      if (reporteProcesado.target !== reporteSeleccionado.target) {
        setReporteSeleccionado(reporteProcesado);
      }
    }
  }, [reporteSeleccionado?.estado]);

  // Manejar cambios en el estado de transmisión
  const handleEstadoChange = (e) => {
    const nuevoEstado = e.target.value;
    const currentPrograma = programas.find(p => p.id === reporteSeleccionado.programaId);
    const horaPrograma = currentPrograma?.horario || "05:00";
    
    // Obtener el target apropiado para el nuevo estado
    const targetApropiado = getTargetForEstado(nuevoEstado, reporteSeleccionado.target);
    
    const updateData = {
      ...reporteSeleccionado,
      estado: nuevoEstado,
      target: targetApropiado
    };
    
    // Configurar valores por defecto según el estado
    if (nuevoEstado === 'si') {
      updateData.horaReal = reporteSeleccionado.horaReal || horaPrograma;
      updateData.hora_tt = null;
      updateData.motivo = null;
    } else if (nuevoEstado === 'tarde') {
      updateData.horaReal = reporteSeleccionado.horaReal || horaPrograma;
      updateData.hora_tt = reporteSeleccionado.hora_tt || horaPrograma;
    } else if (nuevoEstado === 'no') {
      updateData.horaReal = null;
      updateData.hora_tt = null;
    }
    
    setReporteSeleccionado(updateData);
  };

  // Manejar cambios en el campo target
  const handleTargetChange = (e) => {
    const newTarget = e.target.value;
    setReporteSeleccionado({
      ...reporteSeleccionado,
      target: newTarget,
      // Si se selecciona "Otros", limpiar el motivo para que el usuario lo especifique
      motivo: newTarget === 'Otros' ? '' : reporteSeleccionado.motivo
    });
  };

  if (!mostrarModal || !reporteSeleccionado) return null;

  // Obtener información de la filial y programa seleccionados
  const filialActual = filiales.find(f => f.id === reporteSeleccionado.filialId);
  const programaActual = programas.find(p => p.id === reporteSeleccionado.programaId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full modal-content">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Actualizar Reporte
            </h3>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{TIMEZONE_PERU}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Ciudad:</strong> {filialActual?.nombre || reporteSeleccionado.filialId}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Programa:</strong> {programaActual?.nombre || reporteSeleccionado.programaId}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Día:</strong> {reporteSeleccionado.diaNombre}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Fecha:</strong> {formatearFecha ? formatearFecha(reporteSeleccionado.fecha) : reporteSeleccionado.fecha}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de transmisión
            </label>
            <select
              value={reporteSeleccionado.estado}
              onChange={handleEstadoChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pendiente">Pendiente</option>
              <option value="si">Sí transmitió</option>
              <option value="no">No transmitió</option>
              <option value="tarde">Transmitió Tarde</option>
            </select>
          </div>

          {/* Campos específicos para "Sí transmitió" */}
          {reporteSeleccionado.estado === 'si' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora real de transmisión
              </label>
              <input
                type="time"
                value={reporteSeleccionado.horaReal || ''}
                onChange={(e) => setReporteSeleccionado({
                  ...reporteSeleccionado,
                  horaReal: e.target.value
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Campos específicos para "No transmitió" */}
          {reporteSeleccionado.estado === 'no' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo
                </label>
                <select
                  value={reporteSeleccionado.target || ''}
                  onChange={handleTargetChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Seleccione un motivo</option>
                  {targetOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {reporteSeleccionado.target === 'Otros' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especificar motivo
                  </label>
                  <textarea
                    value={reporteSeleccionado.motivo || ''}
                    onChange={(e) => setReporteSeleccionado({
                      ...reporteSeleccionado,
                      motivo: e.target.value
                    })}
                    placeholder="Explica el motivo..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>
              )}
            </>
          )}

          {/* Campos específicos para "Transmitió Tarde" */}
          {reporteSeleccionado.estado === 'tarde' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora real de transmisión
                </label>
                <input
                  type="time"
                  value={reporteSeleccionado.horaReal || ''}
                  onChange={(e) => setReporteSeleccionado({
                    ...reporteSeleccionado,
                    horaReal: e.target.value
                  })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora tardía de transmisión (TT)
                </label>
                <input
                  type="time"
                  value={reporteSeleccionado.hora_tt || ''}
                  onChange={(e) => setReporteSeleccionado({
                    ...reporteSeleccionado,
                    hora_tt: e.target.value
                  })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del retraso
                </label>
                <select
                  value={reporteSeleccionado.target || ''}
                  onChange={handleTargetChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Seleccione un motivo</option>
                  {targetOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {reporteSeleccionado.target === 'Otros' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especificar motivo del retraso
                  </label>
                  <textarea
                    value={reporteSeleccionado.motivo || ''}
                    onChange={(e) => setReporteSeleccionado({
                      ...reporteSeleccionado,
                      motivo: e.target.value
                    })}
                    placeholder="Explica el motivo del retraso..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setMostrarModal(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={guardarReporte}
              disabled={guardandoReporte || 
                (reporteSeleccionado.estado === 'si' && !reporteSeleccionado.horaReal) ||
                (reporteSeleccionado.estado === 'tarde' && (!reporteSeleccionado.horaReal || !reporteSeleccionado.hora_tt)) ||
                (reporteSeleccionado.estado === 'no' && !reporteSeleccionado.target)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {guardandoReporte && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <Save className="w-4 h-4" />
              {guardandoReporte ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE MODAL DE NOTAS ====================

export const ModalNotas = ({ 
  mostrarModalNotas, 
  setMostrarModalNotas, 
  notaSeleccionada, 
  setNotaSeleccionada, 
  guardarNotaGeneral, 
  guardandoNota,
  TIMEZONE_PERU 
}) => {
  if (!mostrarModalNotas || !notaSeleccionada) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Notas Generales - {notaSeleccionada.filialNombre}
            </h3>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{TIMEZONE_PERU}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              <strong>Período:</strong> {notaSeleccionada.semana}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Estas notas aplican para toda la semana y se mostrarán como referencia general para esta ciudad.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones y notas generales
            </label>
            <textarea
              value={notaSeleccionada.contenido}
              onChange={(e) => setNotaSeleccionada({
                ...notaSeleccionada,
                contenido: e.target.value
              })}
              placeholder="Escribe observaciones generales, incidencias de la semana, cambios especiales, etc..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
              rows="6"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ejemplo: "El día martes 27 de mayo transmitieron fútbol a las 16:48. No hubo los programas restantes del día."
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setMostrarModalNotas(false)}
              disabled={guardandoNota}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={guardarNotaGeneral}
              disabled={guardandoNota}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {guardandoNota && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {guardandoNota ? 'Guardando...' : 'Guardar Notas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE LEYENDA ====================

export const LeyendaEstados = () => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <h3 className="font-medium text-gray-900 mb-3">Leyenda:</h3>
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-green-500 rounded"></div>
        <span className="text-sm text-gray-600">Transmitió</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-red-500 rounded"></div>
        <span className="text-sm text-gray-600">No transmitió</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
        <span className="text-sm text-gray-600">Transmitio Tarde</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
        <span className="text-sm text-gray-600">Pendiente</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
        <span className="text-sm text-gray-600">Sincronizado con Backend</span>
      </div>
    </div>
  </div>
);

// ==================== COMPONENTE PANEL DE INFORMACIÓN ====================

export const PanelInformacion = ({ 
  estadoConexion, 
  usingBackendData, 
  reportes, 
  reportesBackend, 
  programaActivo,
  API_CONFIG,
  TIMEZONE_PERU 
}) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-blue-900 mb-1">Estado del Sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${estadoConexion?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700">
              {estadoConexion?.connected ? 'Backend Online' : 'Backend Offline'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${usingBackendData ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
            <span className="text-gray-700">
              {usingBackendData ? 'Datos Remotos' : 'Datos Locales'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-gray-700">
              API: {API_CONFIG.BASE_URL.split('://')[1]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${Object.keys(reportes).length > 0 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
            <span className="text-gray-700">
              {Object.keys(reportes).length} reportes locales
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${Object.keys(reportesBackend).length > 0 ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
            <span className="text-gray-700">
              {Object.keys(reportesBackend).length} sync backend
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-blue-600" />
            <span className="text-gray-700">
              {TIMEZONE_PERU}
            </span>
          </div>
        </div>
      </div>
      
      {estadoConexion?.connected && (
        <div className="text-xs text-gray-600">
          <div>Último ping: {estadoConexion.lastTest}</div>
          <div>
            Endpoints: {estadoConexion.apiHealth?.endpoints?.programa ? '✅' : '❌'} Programas | 
            {estadoConexion.apiHealth?.endpoints?.filial ? '✅' : '❌'} Filiales | 
            {estadoConexion.apiHealth?.endpoints?.reporte ? '✅' : '❌'} Reportes
          </div>
          <div>Programa: {programaActivo?.nombre || 'Ninguno'}</div>
          <div>
            Reportes programa actual: {
              Object.keys(reportes).filter(key => 
                key.includes(`-${programaActivo?.id}-`)
              ).length
            }
          </div>
        </div>
      )}
    </div>
  </div>
);

// ==================== HOOK PARA MANEJO DE MODALES ====================

export const useModalManager = () => {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [mostrarModalNotas, setMostrarModalNotas] = useState(false);
  const [notaSeleccionada, setNotaSeleccionada] = useState(null);
  const [vistaCalendario, setVistaCalendario] = useState(false);
  const [modoVista, setModoVista] = useState('semana');
  const [filtroFilial, setFiltroFilial] = useState('');

  // Estados para tooltip
  const [tooltip, setTooltip] = useState({
    visible: false,
    reporte: null,
    content: '',
    x: 0,
    y: 0
  });

  const mostrarTooltip = (event, reporte) => {
    const rect = event.currentTarget.getBoundingClientRect();
    
    // Procesar el reporte para asegurar que tenga el target correcto
    const reporteProcesado = processReportTarget(reporte);
    
    setTooltip({
      visible: true,
      reporte: reporteProcesado,
      content: '', // El contenido se generará en el componente TooltipReporte
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const ocultarTooltip = () => {
    setTooltip({ visible: false, reporte: null, content: '', x: 0, y: 0 });
  };

  const abrirModal = (filialId, programaId, fecha, diaNombre, reporte) => {
    // Procesar el reporte para asegurar que tenga el target correcto
    const reporteProcesado = processReportTarget({
      filialId, 
      programaId, 
      fecha, 
      diaNombre, 
      ...reporte
    });
    
    setReporteSeleccionado(reporteProcesado);
    setMostrarModal(true);
  };

  const abrirModalNotas = (filial, nota, semana) => {
    setNotaSeleccionada({
      filialId: filial.id,
      filialNombre: filial.nombre,
      contenido: nota,
      semana: semana
    });
    setMostrarModalNotas(true);
  };

  return {
    // Estados de modales
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

    // Funciones de manejo
    mostrarTooltip,
    ocultarTooltip,
    abrirModal,
    abrirModalNotas
  };
};