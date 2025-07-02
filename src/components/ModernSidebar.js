// ModernSidebar.jsx - Componente de sidebar moderno para EXITOSA
import React, { useState, useEffect } from 'react';
import { Search, Home, Building, MapPin, Radio, ChevronRight, Wifi, WifiOff } from 'lucide-react';

const ModernSidebar = ({ 
  filiales = [], 
  filtroFilial, 
  setFiltroFilial, 
  ciudadSeleccionada, 
  onCiudadSelect,
  showMobileSidebar,
  setShowMobileSidebar,
  estadoConexion 
}) => {
  const [filialesFiltradas, setFilialesFiltradas] = useState([]);

  // Filtrar filiales cuando cambie el filtro
  useEffect(() => {
    if (filtroFilial) {
      const filtradas = filiales.filter(filial => 
        filial.nombre.toLowerCase().includes(filtroFilial.toLowerCase())
      );
      setFilialesFiltradas(filtradas);
    } else {
      setFilialesFiltradas(filiales);
    }
  }, [filiales, filtroFilial]);

  const handleCiudadClick = (filial) => {
    onCiudadSelect(filial);
    // Cerrar sidebar en móvil al seleccionar
    if (window.innerWidth <= 768) {
      setShowMobileSidebar(false);
    }
  };

  return (
    <>
      {/* Overlay para móvil */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar principal */}
      <aside className={`sidebar ${showMobileSidebar ? 'show' : ''}`}>
        
        {/* Header del sidebar */}
        <div className="sidebar-header">
          <div className="sidebar-title">
            <Radio className="icon" />
            <span>EXITOSA</span>
          </div>
          <div className="sidebar-subtitle">
            Control de Transmisiones
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="sidebar-search">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar ciudad..."
              className="search-input"
              value={filtroFilial}
              onChange={(e) => setFiltroFilial(e.target.value)}
            />
            <Search className="search-icon" />
          </div>
        </div>

        {/* Contenido principal */}
        <div className="sidebar-content">
          
          {/* Sección de estado */}
          <div className="sidebar-section">
            <div className="section-title">Estado del Sistema</div>
            <div className="city-item" style={{ cursor: 'default' }}>
              <div className="city-icon">
                {estadoConexion?.connected ? (
                  <Wifi className="w-5 h-5 text-emerald-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="city-name">
                <div className="text-sm font-medium">
                  {estadoConexion?.connected ? 'Sistema Online' : 'Sistema Offline'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {filialesFiltradas.length} {filialesFiltradas.length === 1 ? 'ciudad' : 'ciudades'}
                </div>
              </div>
              <div className={`status-indicator ${!estadoConexion?.connected ? 'offline' : ''}`} />
            </div>
          </div>

          {/* Sección de ciudades */}
          <div className="sidebar-section">
            <div className="section-title">
              Ciudades ({filialesFiltradas.length})
            </div>
            
            {filialesFiltradas.length === 0 ? (
              <div className="px-6 py-4 text-center">
                <div className="text-gray-400 text-sm">
                  {filtroFilial ? 'No se encontraron ciudades' : 'No hay ciudades disponibles'}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {filialesFiltradas.map((filial) => (
                  <div
                    key={filial.id}
                    className={`city-item ${ciudadSeleccionada?.id === filial.id ? 'active' : ''}`}
                    onClick={() => handleCiudadClick(filial)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCiudadClick(filial);
                      }
                    }}
                    aria-label={`Seleccionar ciudad ${filial.nombre}`}
                  >
                    <div className="city-icon">
                      <Home className="w-5 h-5" />
                    </div>
                    <div className="city-name">
                      {filial.nombre}
                    </div>
                    <ChevronRight className="city-chevron" />
                    
                    {/* Indicador de ciudad activa */}
                    {ciudadSeleccionada?.id === filial.id && (
                      <span className="sr-only">Ciudad seleccionada</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección de información adicional */}
          {estadoConexion?.connected && (
            <div className="sidebar-section">
              <div className="section-title">Información</div>
              <div className="city-item" style={{ cursor: 'default' }}>
                <div className="city-icon">
                  <Building className="w-5 h-5" />
                </div>
                <div className="city-name">
                  <div className="text-sm font-medium">Sistema Activo</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Última actualización: {new Date().toLocaleTimeString('es-PE')}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer del sidebar */}
        <div className="sidebar-footer">
          <div className="version-info">Perú • GMT-5</div>
          <div className="brand-info">EXITOSA Transmisiones</div>
        </div>

      </aside>
    </>
  );
};

export default ModernSidebar;