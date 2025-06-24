import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Componentes principales
import TransmissionTracker from './components/ControlTransmisiones';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

// Componentes de protección de rutas
import { 
  UserProtectedRoute, 
  AdminProtectedRoute, 
  AnyUserProtectedRoute 
} from './components/ProtectedRoute';

// Sistema de autenticación y logout
import LogoutButton, { 
  isAuthenticated, 
  getCurrentUserInfo, 
  checkSessionTimeout 
} from './components/LogoutButton';

// Servicios y utilidades
import { 
  sincronizarDatos, 
  testConnection, 
  checkApiHealth, 
  API_CONFIG,
  TIMEZONE_PERU 
} from './services/api';
import { formatearFechaHoraCompleta, obtenerFechaLocal } from './components/UtilidadesFecha';

// Iconos
import { Wifi, WifiOff, Activity, Clock, Shield, Radio, Code, Server } from 'lucide-react';

import './App.css';

function App() {
  // Estados principales
  const [programas, setProgramas] = useState([]);
  const [filiales, setFiliales] = useState([]);
  const [estadoConexion, setEstadoConexion] = useState({
    connected: false,
    lastTest: null,
    apiHealth: null
  });

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [horaActual, setHoraActual] = useState(obtenerFechaLocal());

  // ==================== INICIALIZACIÓN ====================

  useEffect(() => {
    const init = async () => {
      try {
        // Verificar timeout de sesión para cualquier usuario autenticado
        const sessionExpired = checkSessionTimeout();
        if (sessionExpired) {
          return;
        }

        // Verificar conexión y cargar datos
        const isConnected = await verificarConexion();
        
        // Cargar datos independientemente del estado de conexión
        await cargarDatos();
        
      } catch (error) {
        console.error('Error al inicializar aplicación:', error);
        setEstadoConexion(prev => ({
          ...prev,
          connected: false,
          lastTest: new Date().toISOString(),
          error: error.message
        }));
      } finally {
        setLoading(false);
      }
    };

    init();

    // Actualizar hora cada segundo
    const horaInterval = setInterval(() => {
      setHoraActual(obtenerFechaLocal());
    }, 1000);

    // Verificar sesión cada 5 minutos
    const sessionInterval = setInterval(() => {
      checkSessionTimeout();
    }, 5 * 60 * 1000);

    // Verificar conexión cada 30 segundos
    const conexionInterval = setInterval(async () => {
      try {
        const wasConnected = estadoConexion.connected;
        const isConnected = await verificarConexion();
        
        // Si se reconectó después de estar desconectado, recargar datos
        if (!wasConnected && isConnected) {
          await cargarDatos();
        }
        
      } catch (error) {
        // Silencioso
      }
    }, 30000);

    return () => {
      clearInterval(horaInterval);
      clearInterval(sessionInterval);
      clearInterval(conexionInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== FUNCIONES DE CONEXIÓN ====================

  const verificarConexion = async () => {
    try {
      const [connectionResult, healthResult] = await Promise.all([
        testConnection(),
        checkApiHealth()
      ]);
      
      const isConnected = connectionResult.success && healthResult.status === 'healthy';
      
      setEstadoConexion({
        connected: isConnected,
        lastTest: new Date().toISOString(),
        apiHealth: healthResult,
        connectionInfo: connectionResult
      });
      
      return isConnected;
      
    } catch (error) {
      setEstadoConexion(prev => ({
        ...prev,
        connected: false,
        lastTest: new Date().toISOString(),
        error: error.message
      }));
      return false;
    }
  };

  const cargarDatos = async () => {
    try {
      let resultado;
      try {
        resultado = await sincronizarDatos();
      } catch (error) {
        setProgramas([]);
        setFiliales([]);
        return;
      }
      
      if (resultado.sincronizado) {
        setProgramas(resultado.programas);
        setFiliales(resultado.filiales);
      } else {
        setProgramas([]);
        setFiliales([]);
      }
      
    } catch (error) {
      setProgramas([]);
      setFiliales([]);
    }
  };

  const manejarSincronizacion = async () => {
    try {
      const isConnected = await verificarConexion();
      if (!isConnected) {
        throw new Error('No hay conexión con el backend');
      }
      
      await cargarDatos();
      return true;
      
    } catch (error) {
      throw error;
    }
  };

  // ==================== COMPONENTE HEADER AUTENTICADO ====================

  const HeaderAutenticado = () => {
    const userInfo = getCurrentUserInfo();
    
    if (!userInfo) return null;

    const isUser = userInfo.tipoAuth === 'user';
    const isAdmin = userInfo.tipoAuth === 'admin';

    return (
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo EXITOSA */}
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <img 
                  src="/exitosalogo.svg" 
                  alt="Logo EXITOSA" 
                  className="w-16 h-16"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                {isUser && <Radio className="w-16 h-16 text-green-600" style={{display: 'none'}} />}
                {isAdmin && <Shield className="w-16 h-16 text-blue-600" style={{display: 'none'}} />}
              </div>
              
              {/* Indicadores de estado */}
              <div className="flex items-center gap-3">
                {/* Estado de conexión */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  estadoConexion.connected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {estadoConexion.connected ? (
                    <Wifi className="w-3 h-3" />
                  ) : (
                    <WifiOff className="w-3 h-3" />
                  )}
                  <span>{estadoConexion.connected ? 'Online' : 'Offline'}</span>
                </div>

                {/* Datos disponibles - solo para usuarios que usan el sistema de transmisiones */}
                {isUser && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <Activity className="w-3 h-3" />
                    <span>{programas.length} prog, {filiales.length} fil</span>
                  </div>
                )}

                {/* Hora y timezone */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  <Clock className="w-3 h-3" />
                  <span>{formatearFechaHoraCompleta(horaActual).split(' ')[1]}</span>
                  <span className="opacity-75">{TIMEZONE_PERU}</span>
                </div>

                {/* Indicador de tipo de usuario */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  isUser ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  <span>{userInfo.tipo}</span>
                </div>
              </div>
            </div>

            {/* Botón de logout */}
            <LogoutButton variant="compact" />
          </div>
        </div>
      </div>
    );
  };

  // ==================== PANTALLA DE CARGA ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <img 
                src="/exitosalogo.svg" 
                alt="Logo EXITOSA" 
                className="w-24 h-24"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <Radio className="w-24 h-24 text-green-600" style={{display: 'none'}} />
            </div>
            <p className="text-gray-900 font-medium">Iniciando Sistema EXITOSA</p>
            <p className="text-sm text-gray-600">Control de Transmisiones - Perú</p>
            <p className="text-sm text-blue-600 mt-2">🕐 {formatearFechaHoraCompleta(horaActual)}</p>
            <p className="text-xs text-blue-500">{TIMEZONE_PERU}</p>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDERIZADO PRINCIPAL ====================

  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        {/* Header autenticado - solo si hay algún usuario logueado */}
        <HeaderAutenticado />

        {/* Rutas principales */}
        <Routes>
          {/* Ruta principal - Control de Transmisiones (para usuarios regulares) */}
          <Route 
            path="/" 
            element={
              <UserProtectedRoute>
                <div className={isAuthenticated() ? 'pb-4' : ''}>
                  <TransmissionTracker
                    programasBackend={programas}
                    filialesBackend={filiales}
                    estadoConexion={estadoConexion}
                    onSincronizar={manejarSincronizacion}
                  />
                </div>
              </UserProtectedRoute>
            } 
          />
          
          {/* Ruta de login para usuarios regulares */}
          <Route 
            path="/login" 
            element={
              <Login 
                estadoConexion={estadoConexion}
              />
            } 
          />
          
          {/* Ruta de login para administradores */}
          <Route 
            path="/admin" 
            element={
              <AdminLogin 
                estadoConexion={estadoConexion}
              />
            } 
          />
          
          {/* Ruta protegida del panel de administración (solo para admins) */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminProtectedRoute>
                <div className={isAuthenticated() ? 'pb-4' : ''}>
                  <AdminPanel
                    estadoConexion={estadoConexion}
                    onSincronizar={manejarSincronizacion}
                    programas={programas}
                    filiales={filiales}
                  />
                </div>
              </AdminProtectedRoute>
            } 
          />

          {/* Ruta de acceso directo (redirige según el tipo de usuario) */}
          <Route 
            path="/dashboard" 
            element={
              <AnyUserProtectedRoute>
                {(() => {
                  const userInfo = getCurrentUserInfo();
                  if (userInfo?.tipoAuth === 'admin') {
                    return <Navigate to="/admin/dashboard" replace />;
                  } else {
                    return <Navigate to="/" replace />;
                  }
                })()}
              </AnyUserProtectedRoute>
            } 
          />

          {/* Redirección para rutas no encontradas */}
          <Route 
            path="*" 
            element={
              (() => {
                // Si hay algún usuario autenticado, redirigir según su tipo
                const userInfo = getCurrentUserInfo();
                if (userInfo?.tipoAuth === 'admin') {
                  return <Navigate to="/admin/dashboard" replace />;
                } else if (userInfo?.tipoAuth === 'user') {
                  return <Navigate to="/" replace />;
                } else {
                  // Si no está autenticado, ir al login de usuarios
                  return <Navigate to="/login" replace />;
                }
              })()
            } 
          />
        </Routes>

        {/* Footer del sistema - solo si está autenticado */}
        {isAuthenticated() && (
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span>© 2025 Sistema EXITOSA - Control de Transmisiones</span>
                  
                  {/* Créditos de desarrollo */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Server className="w-3 h-3 text-blue-500" />
                      <span className="text-blue-600 font-medium">Backend Kalek</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <Code className="w-3 h-3 text-green-500" />
                      <span className="text-green-600 font-medium">Frontend Dans</span>
                    </div>
                  </div>
                  
                  <span>API: {API_CONFIG.BASE_URL.split('://')[1]}</span>
                  {(() => {
                    const userInfo = getCurrentUserInfo();
                    return userInfo && (
                      <span>Sesión: {userInfo.tipo} ({userInfo.nombre})</span>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatearFechaHoraCompleta(horaActual)} ({TIMEZONE_PERU})</span>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>
    </Router>
  );
}

export default App;