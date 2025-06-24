// AuthUtils.js - Utilidades de autenticación
import { formatearFechaHoraCompleta, obtenerFechaLocal } from './UtilidadesFecha';
import { TIMEZONE_PERU } from '../services/api';

/**
 * Utilidades para manejo de autenticación
 */

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return localStorage.getItem('admin_authenticated') === 'true';
};

// Obtener información del usuario logueado
export const getUserInfo = () => {
  if (!isAuthenticated()) return null;
  
  return {
    usuario: localStorage.getItem('admin_user') || 'exitosa',
    loginTime: localStorage.getItem('admin_login_time'),
    isAuthenticated: true
  };
};

// Cerrar sesión
export const logout = () => {
  console.log('🚪 Cerrando sesión:', {
    usuario: localStorage.getItem('admin_user'),
    timestamp: formatearFechaHoraCompleta(obtenerFechaLocal()),
    timezone: TIMEZONE_PERU
  });
  
  localStorage.removeItem('admin_authenticated');
  localStorage.removeItem('admin_login_time');
  localStorage.removeItem('admin_user');
  
  // Recargar la página para limpiar el estado
  window.location.href = '/admin';
};

// Verificar tiempo de sesión (opcional - para auto-logout)
export const checkSessionTimeout = () => {
  const loginTime = localStorage.getItem('admin_login_time');
  if (!loginTime) return false;
  
  const loginDate = new Date(loginTime);
  const now = new Date();
  const diffHours = (now - loginDate) / (1000 * 60 * 60);
  
  // Auto logout después de 8 horas
  if (diffHours > 8) {
    logout();
    return true;
  }
  
  return false;
};

// ==========================================

// LogoutButton.js - Componente de botón de logout
import React from 'react';
import { LogOut, User, Clock } from 'lucide-react';
import { logout, getUserInfo } from './AuthUtils';

export const LogoutButton = ({ className = '' }) => {
  const userInfo = getUserInfo();
  
  if (!userInfo) return null;

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <User className="w-4 h-4" />
        <span className="font-medium">{userInfo.usuario}</span>
      </div>
      
      <button
        onClick={handleLogout}
        className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Cerrar sesión"
      >
        <LogOut className="w-4 h-4" />
        <span>Salir</span>
      </button>
    </div>
  );
};

// ==========================================

// App.js - Ejemplo de integración completa
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import TransmissionTracker from './components/ControlTransmisiones';
import { LogoutButton, isAuthenticated, checkSessionTimeout } from './components/AuthUtils';
import { 
  sincronizarDatos, 
  testConnection, 
  checkApiHealth,
  API_CONFIG 
} from './services/api';

/**
 * Componente principal de la aplicación con sistema de autenticación
 */
function App() {
  // Estados principales
  const [programasBackend, setProgramasBackend] = useState([]);
  const [filialesBackend, setFilialesBackend] = useState([]);
  const [estadoConexion, setEstadoConexion] = useState({
    connected: false,
    lastTest: null,
    apiHealth: null
  });

  // Verificar sesión al cargar
  useEffect(() => {
    // Verificar timeout de sesión
    checkSessionTimeout();
    
    // Verificar conexión si está autenticado
    if (isAuthenticated()) {
      inicializarSistema();
    }
  }, []);

  // Función para inicializar el sistema
  const inicializarSistema = async () => {
    try {
      console.log('🚀 Inicializando sistema autenticado...');
      
      // Verificar conexión con el backend
      const testResult = await testConnection();
      const healthResult = await checkApiHealth();
      
      setEstadoConexion({
        connected: testResult.success,
        lastTest: new Date().toLocaleString(),
        apiHealth: healthResult
      });

      if (testResult.success) {
        // Sincronizar datos del backend
        const datos = await sincronizarDatos();
        setProgramasBackend(datos.programas);
        setFilialesBackend(datos.filiales);
        
        console.log('✅ Sistema inicializado correctamente');
      }
    } catch (error) {
      console.error('❌ Error al inicializar sistema:', error);
      setEstadoConexion({
        connected: false,
        lastTest: new Date().toLocaleString(),
        apiHealth: null
      });
    }
  };

  // Función para manejar sincronización manual
  const handleSincronizar = async () => {
    try {
      console.log('🔄 Sincronización manual iniciada...');
      const datos = await sincronizarDatos();
      setProgramasBackend(datos.programas);
      setFilialesBackend(datos.filiales);
      
      // Actualizar estado de conexión
      const healthResult = await checkApiHealth();
      setEstadoConexion(prev => ({
        ...prev,
        connected: true,
        lastTest: new Date().toLocaleString(),
        apiHealth: healthResult
      }));
      
      console.log('✅ Sincronización completada');
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      throw error;
    }
  };

  return (
    <Router>
      <div className="App">
        {/* Header con logout si está autenticado */}
        {isAuthenticated() && (
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h1 className="text-lg font-semibold text-gray-900">
                    Sistema EXITOSA
                  </h1>
                  <div className="text-sm text-gray-500">
                    API: {API_CONFIG.BASE_URL.split('://')[1]}
                  </div>
                </div>
                <LogoutButton />
              </div>
            </div>
          </div>
        )}

        {/* Rutas principales */}
        <Routes>
          {/* Ruta de login */}
          <Route path="/admin" element={<Login />} />
          
          {/* Ruta principal protegida */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <TransmissionTracker
                  programasBackend={programasBackend}
                  filialesBackend={filialesBackend}
                  estadoConexion={estadoConexion}
                  onSincronizar={handleSincronizar}
                />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirigir cualquier otra ruta a la principal */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

// ==========================================

// Ejemplo de modificación del HeaderSistema en InterfazUsuario.js
// Agregar el botón de logout al header existente

export const HeaderSistemaConAuth = ({ 
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
      
      <div className="flex items-center gap-3">
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
        
        {/* Botón de logout integrado */}
        <LogoutButton />
      </div>
    </div>
  </div>
);