// src/components/ControlTransmisionesNuevo.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search, 
  ChevronLeft, ChevronRight, FileText, Wifi, WifiOff, 
  RefreshCw, Menu, Radio, Home, Info
} from 'lucide-react';

// Importar el sidebar moderno
import ModernSidebar from './ModernSidebar';

// Importar módulos refactorizados del sistema actual - mantenemos la lógica de negocio
import { useGestorDatos } from './GestorDatos';
import { 
  ModalReporte,
  ModalNotas,
  TooltipReporte,       // ⭐️ Nuevo: reutilizamos el tooltip como componente
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
import ExportManager from './ExportManager';

/**
 * Componente principal del sistema de transmisiones con nuevo diseño
 * Preserva toda la funcionalidad original mientras implementa la UI del HTML
 */
const ControlTransmisionesNuevo = ({ 
  programasBackend = [], 
  filialesBackend = [], 
  estadoConexion,
  onSincronizar 
}) => {

  // ==================== HOOKS PERSONALIZADOS ====================
  // Mantenemos toda la lógica de negocio del sistema actual
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

  // Estado para gestionar la visualización del sidebar en móvil
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // ==================== ESTADOS LOCALES ====================
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState(null);
  const [ciudadesExpandidas, setCiudadesExpandidas] = useState({});

  // ==================== CÁLCULOS MEMOIZADOS ====================
  const semanaActual = React.useMemo(() => getSemanaFromDate(fechaSeleccionada), [fechaSeleccionada]);
  
  const filialesFiltradas = React.useMemo(() => 
    filiales.filter(f => 
      f.nombre.toLowerCase().includes(filtroFilial.toLowerCase())
    ), [filiales, filtroFilial]
  );
  
  const stats = React.useMemo(() => 
    calcularEstadisticas(
      filiales, 
      semanaActual, 
      fechaSeleccionada, 
      programaActivo, 
      modoVista, 
      obtenerEstadoReporte
    ), [filiales, semanaActual, fechaSeleccionada, programaActivo, modoVista, obtenerEstadoReporte]
  );

  // Función para filtrar programas por filial seleccionada
  const getProgramasFilial = useCallback(() => {
    if (!ciudadSeleccionada) {
      return programas; // Si no hay ciudad seleccionada, mostrar todos
    }
    
    // Buscar la filial seleccionada
    const filialActual = filiales.find(f => f.id === ciudadSeleccionada.id);
    
    if (!filialActual) {
      return programas; // Si no encuentra la filial, mostrar todos
    }
    
    // Si la filial tiene programas asociados directamente
    if (filialActual.programas && filialActual.programas.length > 0) {
      return filialActual.programas;
    }
    
    // Si la filial tiene programaIds
    if (filialActual.programaIds && filialActual.programaIds.length > 0) {
      return programas.filter(programa => 
        filialActual.programaIds.includes(programa.id)
      );
    }
    
    // Si no hay asociaciones, buscar programas que tengan esta filial en su filialesIds
    return programas.filter(programa => 
      programa.filialesIds && programa.filialesIds.includes(filialActual.id)
    );
  }, [ciudadSeleccionada, programas, filiales]);

  // ==================== FUNCIONES DE NAVEGACIÓN ====================
  const navegarSemana = useCallback((direccion) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(fechaSeleccionada.getDate() + (direccion * 7));
    setFechaSeleccionada(nuevaFecha);
  }, [fechaSeleccionada, setFechaSeleccionada]);

  const irASemanaActual = useCallback(() => {
    setFechaSeleccionada(obtenerFechaLocal());
  }, [setFechaSeleccionada]);

  // ==================== FUNCIONES DE INTERACCIÓN ====================
  const manejarClickReporte = useCallback((filialId, programaId, fecha, diaNombre) => {
    const reporte = obtenerEstadoReporte(filialId, programaId, fecha);
    abrirModal(filialId, programaId, fecha, diaNombre, reporte);
  }, [obtenerEstadoReporte, abrirModal]);

  const manejarClickNotas = useCallback((filial) => {
    const nota = obtenerNotaGeneral(filial.id);
    const semana = `${formatearFechaLocal(semanaActual.inicio)} - ${formatearFechaLocal(semanaActual.fin)}`;
    abrirModalNotas(filial, nota, semana);
  }, [obtenerNotaGeneral, semanaActual, abrirModalNotas]);

  const guardarReporte = useCallback(async () => {
    if (!reporteSeleccionado) return;
    
    try {
      await actualizarReporte(
        reporteSeleccionado.filialId, 
        reporteSeleccionado.programaId,
        reporteSeleccionado.fecha, 
        reporteSeleccionado
      );
      
      setMostrarModal(false);
      setReporteSeleccionado(null);
    } catch (error) {
      alert('Error al guardar el reporte: ' + error.message);
    }
  }, [reporteSeleccionado, actualizarReporte, setMostrarModal, setReporteSeleccionado]);

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
    } catch (error) {
      alert('Error al guardar la nota: ' + error.message);
    } finally {
      setGuardandoNota(false);
    }
  }, [notaSeleccionada, semanaActual, guardarNotaGeneralBD, setMostrarModalNotas, setNotaSeleccionada, setGuardandoNota]);

  const manejarSincronizacion = useCallback(async () => {
    try {
      await sincronizarManualmente();
      // No es necesario mostrar alerta, ya que el componente actualiza su estado automáticamente
    } catch (error) {
      alert('Error al sincronizar: ' + error.message);
    }
  }, [sincronizarManualmente]);

  const toggleExpandirCiudad = useCallback((ciudadId) => {
    setCiudadesExpandidas(prev => ({
      ...prev,
      [ciudadId]: !prev[ciudadId]
    }));
  }, []);

  const seleccionarCiudad = useCallback((ciudad) => {
    setCiudadSeleccionada(ciudad);
    // Cerrar el sidebar en móvil cuando se selecciona una ciudad
    setShowMobileSidebar(false);
    // Expandir la ciudad seleccionada
    setCiudadesExpandidas(prev => ({
      ...prev,
      [ciudad.id]: true
    }));
  }, []);

  // Inicializar la primera ciudad como seleccionada al cargar las filiales
  useEffect(() => {
    if (filiales.length > 0 && !ciudadSeleccionada) {
      setCiudadSeleccionada(filiales[0]);
      setCiudadesExpandidas({[filiales[0].id]: true});
    }
  }, [filiales, ciudadSeleccionada]);

  // Actualizar el programa activo cuando se cambia de filial
  useEffect(() => {
    if (ciudadSeleccionada) {
      const programasDisponibles = getProgramasFilial();
      
      // Si hay programas disponibles para esta filial
      if (programasDisponibles.length > 0) {
        // Si el programa activo actual no está disponible para esta filial, 
        // cambiar al primer programa disponible
        const programaActualDisponible = programasDisponibles.some(
          p => p.id === programaActivo?.id
        );
        
        if (!programaActualDisponible) {
          setProgramaActivo(programasDisponibles[0]);
        }
      } else {
        // Si no hay programas para esta filial, quitar el programa activo
        setProgramaActivo(null);
      }
    }
  }, [ciudadSeleccionada, getProgramasFilial, programaActivo, setProgramaActivo]);

  // ==================== FUNCIONES PARA TOOLTIP ====================
  // Función para generar contenido del tooltip
  const generarTooltipContenido = useCallback((reporteData) => {
    // Asegurar que el reporte tenga todas las propiedades necesarias
    const reporte = { ...reporteData };
    
    if (reporte.estado === 'si') {
      return `✅ Transmitió\nHora: ${reporte.horaReal || 'No registrada'}`;
    }
    
    if (reporte.estado === 'no') {
      let contenido = `❌ No transmitió`;
      if (reporte.target) {
        contenido += `\nMotivo: ${reporte.target}`;
        
        // Mostrar detalle para "Otros" cuando hay motivo personalizado
        if ((reporte.target === 'Otros' || reporte.target === 'Otro') && reporte.motivo) {
          contenido += `\nDetalle: ${reporte.motivo}`;
        }
      }
      return contenido;
    }
    
    if (reporte.estado === 'tarde') {
      let contenido = `⏰ Transmitió tarde`;
      if (reporte.horaReal) {
        contenido += `\nHora real: ${reporte.horaReal}`;
      }
      if (reporte.hora_tt) {
        contenido += `\nHora TT: ${reporte.hora_tt}`;
      }
      if (reporte.motivo) {
        contenido += `\nMotivo: ${reporte.motivo}`;
      }
      return contenido;
    }
    
    return `⏳ Pendiente`;
  }, []);

  // ==================== FUNCIÓN RENDERIZAR CELDA - ARREGLO SIMPLE ====================
  const renderizarCeldaReporte = (filial, fecha, diaNombre, index = null) => {
    if (!programaActivo) return null;
    
    const reporte = obtenerEstadoReporte(filial.id, programaActivo.id, fecha);
    const clave = `${filial.id}-${programaActivo.id}-${fecha.toISOString().split('T')[0]}`;
    const tieneSincronizacion = reportesBackend[clave];
    
    let estadoClase = '';
    let icono = null;
    
    // Usar las clases exactas que funcionan en tu CSS
    switch (reporte.estado) {
      case 'si':
        estadoClase = 'transmitio'; // Usar 'transmitio' como en tu CSS original
        icono = <CheckCircle className="w-4 h-4 text-white" />;
        break;
      case 'no':
        estadoClase = 'no-transmitio'; // Usar 'no-transmitio' como en tu CSS original
        icono = <XCircle className="w-4 h-4 text-white" />;
        break;
      case 'tarde':
        estadoClase = 'tarde';
        icono = <AlertCircle className="w-4 h-4 text-white" />;
        break;
      default:
        estadoClase = 'pendiente';
        icono = <Clock className="w-4 h-4 text-white" />;
    }
    
    return (
      <div className="flex justify-center" key={`${filial.id}-${index}`}>
        <div className="relative inline-block">
          <button
            onClick={() => manejarClickReporte(filial.id, programaActivo.id, fecha, diaNombre)}
            onMouseEnter={(e) => mostrarTooltip(e, reporte)}
            onMouseLeave={ocultarTooltip}
            className={`status-box ${estadoClase}`}
            title={generarTooltipContenido(reporte)}
            type="button"
          >
            {icono}
          </button>
          
          {/* Indicador de sincronización */}
          {tieneSincronizacion && (
            <div 
              className="sync-indicator" 
              title="Sincronizado con backend"
            />
          )}
        </div>
      </div>
    );
  };

  // ==================== RENDERIZADO CONDICIONAL ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Cargando sistema de transmisiones...</p>
          <p className="text-sm text-blue-600">Zona horaria: {TIMEZONE_PERU}</p>
        </div>
      </div>
    );
  }

  // ==================== RENDERIZADO PRINCIPAL ====================
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button 
              className="p-1 hover:bg-blue-700 rounded-md md:hidden" 
              id="menu-toggle"
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Radio className="w-6 h-6" />
              <h1 className="text-xl font-bold">Control de Transmisiones EXITOSA</h1>
            </div>
            
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 ml-4">
              <Wifi className="w-3 h-3" />
              <span>{estadoConexion?.connected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm bg-blue-700 px-3 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{TIMEZONE_PERU}</span>
            </div>
            
            <button 
              onClick={manejarSincronizacion}
              disabled={sincronizando || !estadoConexion?.connected}
              className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 flex items-center gap-1 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* SIDEBAR MODERNO - REEMPLAZADO */}
        <ModernSidebar 
          filiales={filialesFiltradas}
          filtroFilial={filtroFilial}
          setFiltroFilial={setFiltroFilial}
          ciudadSeleccionada={ciudadSeleccionada}
          onCiudadSelect={seleccionarCiudad}
          showMobileSidebar={showMobileSidebar}
          setShowMobileSidebar={setShowMobileSidebar}
          estadoConexion={estadoConexion}
        />
        
        {/* Main content */}
        <main className="main-content md:ml-64 w-full p-6">
          <div className="space-y-6">
            {/* Header with week selector */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Transmisiones por Ciudad</h2>
                <p className="text-sm text-gray-500">
                  Selecciona un programa y día para ver/editar el reporte de transmisión
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Semana: {formatearFechaLocal(semanaActual.inicio)} - {formatearFechaLocal(semanaActual.fin)}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navegarSemana(-1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <button
                    onClick={irASemanaActual}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Semana Actual
                  </button>
                  
                  <button
                    onClick={() => navegarSemana(1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pestañas de Programas */}
            {programas.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="flex overflow-x-auto">
                  {/* Mostrar mensaje si no hay programas para esta filial */}
                  {getProgramasFilial().length === 0 && ciudadSeleccionada && (
                    <div className="px-6 py-4 text-sm text-gray-500 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      <span>No hay programas disponibles para {ciudadSeleccionada.nombre}</span>
                    </div>
                  )}
                  
                  {/* Renderizar los programas filtrados */}
                  {getProgramasFilial().map((programa) => (
                    <button
                      key={programa.id}
                      onClick={() => setProgramaActivo(programa)}
                      className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
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
            )}
            
            {/* Week header (days) */}
            <div className="hidden md:block">
              <div className="week-header mb-2 grid grid-cols-6 gap-2">
                {diasSemana.map((dia, index) => (
                  <div key={index} className="text-center font-medium text-gray-500 text-sm">{dia}</div>
                ))}
              </div>
              <div className="week-header mb-4 grid grid-cols-6 gap-2">
                {semanaActual.fechas.map((fecha, index) => (
                  <div key={index} className="week-date text-center text-xs text-gray-500">{formatearFechaLocal(fecha)}</div>
                ))}
              </div>
            </div>
            
            {/* Mobile week header */}
            <div className="md:hidden">
              <div className="week-header mb-1 grid grid-cols-3 gap-1">
                {diasSemana.slice(0, 3).map((dia, index) => (
                  <div key={index} className="text-center font-medium text-gray-500 text-sm">{dia}</div>
                ))}
              </div>
              <div className="week-header mb-2 grid grid-cols-3 gap-1">
                {semanaActual.fechas.slice(0, 3).map((fecha, index) => (
                  <div key={index} className="week-date text-center text-xs text-gray-500">{formatearFechaLocal(fecha)}</div>
                ))}
              </div>
              
              <div className="week-header second-row mb-1 grid grid-cols-3 gap-1">
                {diasSemana.slice(3, 6).map((dia, index) => (
                  <div key={index} className="text-center font-medium text-gray-500 text-sm">{dia}</div>
                ))}
              </div>
              <div className="week-header second-row mb-4 grid grid-cols-3 gap-1">
                {semanaActual.fechas.slice(3, 6).map((fecha, index) => (
                  <div key={index} className="week-date text-center text-xs text-gray-500">{formatearFechaLocal(fecha)}</div>
                ))}
              </div>
            </div>
            
            {/* City reports */}
            <div className="space-y-4">
              {filialesFiltradas.map(filial => (
                <div 
                  key={filial.id} 
                  className={`city-row border border-gray-200 rounded-lg p-4 mb-4 bg-white transition-all duration-200 hover:shadow-md hover:border-gray-300 ${ciudadesExpandidas[filial.id] ? 'expanded border-blue-300' : ''}`}
                >
                  <div 
                    className="city-header flex justify-between items-center cursor-pointer"
                    onClick={() => toggleExpandirCiudad(filial.id)}
                  >
                    <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                      <Home className={`w-5 h-5 ${ciudadSeleccionada?.id === filial.id ? 'text-blue-600' : 'text-gray-600'}`} />
                      {filial.nombre}
                    </h3>
                    <ChevronRight className={`w-5 h-5 text-gray-400 chevron-icon transition-transform ${ciudadesExpandidas[filial.id] ? 'rotate-90' : ''}`} />
                  </div>
                  
                  {ciudadesExpandidas[filial.id] && programaActivo && (
                    <div className="mt-4 space-y-4">
                      {/* Program Row */}
                      <div className="program-row p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
                        <div className="program-title flex items-center gap-2 font-medium text-gray-800 mb-1">
                          <Radio className="w-4 h-4 text-blue-600" />
                          {programaActivo?.nombre}
                        </div>
                        
                        <div className="program-info flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {programaActivo?.horario || "05:00"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {programaActivo?.diasSemana || "DIARIO"}
                          </span>
                        </div>
                        
                        {/* Weekly status - desktop */}
                        <div className="hidden md:flex week-row grid grid-cols-6 gap-2">
                          {semanaActual.fechas.map((fecha, index) => (
                            renderizarCeldaReporte(filial, fecha, diasSemana[index], index)
                          ))}
                        </div>
                        
                        {/* Weekly status - mobile */}
                        <div className="md:hidden">
                          <div className="week-row grid grid-cols-3 gap-1 mb-2">
                            {semanaActual.fechas.slice(0, 3).map((fecha, index) => (
                              renderizarCeldaReporte(filial, fecha, diasSemana[index], index)
                            ))}
                          </div>
                          <div className="week-row second-row grid grid-cols-3 gap-1">
                            {semanaActual.fechas.slice(3, 6).map((fecha, index) => (
                              renderizarCeldaReporte(filial, fecha, diasSemana[index + 3], index + 3)
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Leyenda:</h4>
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
                  <span className="text-sm text-gray-600">Transmitió tarde</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <span className="text-sm text-gray-600">Pendiente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative inline-block">
                    <div className="w-4 h-4 bg-blue-100 rounded"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-600">Sincronizado</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-sm text-gray-500">
            <div>© 2025 Sistema EXITOSA - Control de Transmisiones</div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{TIMEZONE_PERU}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modales del sistema original (mantenemos la funcionalidad) */}
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

      <ModalNotas 
        mostrarModalNotas={mostrarModalNotas}
        setMostrarModalNotas={setMostrarModalNotas}
        notaSeleccionada={notaSeleccionada}
        setNotaSeleccionada={setNotaSeleccionada}
        guardarNotaGeneral={guardarNotaGeneral}
        guardandoNota={guardandoNota}
        TIMEZONE_PERU={TIMEZONE_PERU}
      />

      {/* Tooltip */}
      <TooltipReporte tooltip={tooltip} />
    </div>
  );
};

export default ControlTransmisionesNuevo;