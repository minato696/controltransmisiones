// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, LogIn, Clock, Wifi, WifiOff, Radio, Activity } from 'lucide-react';
import { formatearFechaHoraCompleta, obtenerFechaLocal } from './UtilidadesFecha';
import { TIMEZONE_PERU } from '../services/api';

const Login = ({ estadoConexion }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    usuario: '',
    password: ''
  });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [horaActual, setHoraActual] = useState(obtenerFechaLocal());

  // Credenciales válidas para USUARIOS REGULARES
  const CREDENCIALES_USUARIO = {
    usuario: 'exitosa',
    password: '147ABC55'
  };

  // ==================== EFECTOS ====================

  // Verificar si ya está autenticado como usuario
  useEffect(() => {
    const isUserAuthenticated = localStorage.getItem('user_authenticated') === 'true';
    if (isUserAuthenticated) {
      // Si ya está autenticado como usuario, redirigir a la página principal
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  // Actualizar hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(obtenerFechaLocal());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ==================== MANEJADORES DE EVENTOS ====================

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos vacíos
    if (!formData.usuario.trim() || !formData.password.trim()) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simular delay de autenticación
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Validar credenciales de USUARIO
      const usuarioValido = formData.usuario.toLowerCase().trim() === CREDENCIALES_USUARIO.usuario.toLowerCase();
      const passwordValido = formData.password.trim() === CREDENCIALES_USUARIO.password;

      if (usuarioValido && passwordValido) {
        
        // Guardar estado de autenticación de USUARIO (diferente del admin)
        localStorage.setItem('user_authenticated', 'true');
        localStorage.setItem('user_login_time', new Date().toISOString());
        localStorage.setItem('user_name', formData.usuario.trim());
        localStorage.setItem('user_role', 'operador'); // Rol de usuario regular

        // Redirigir a la página principal del sistema de transmisiones
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });

      } else {
        setError('Usuario o contraseña incorrectos');
      }

    } catch (error) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar mostrar/ocultar contraseña
  const toggleMostrarPassword = () => {
    setMostrarPassword(prev => !prev);
  };

  // Manejar tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // ==================== RENDERIZADO ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header del sistema */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center mb-4">
            <img 
              src="/exitosalogo.svg" 
              alt="Logo EXITOSA" 
              className="w-32 h-32"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <Radio className="w-32 h-32 text-green-600" style={{display: 'none'}} />
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-4">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatearFechaHoraCompleta(horaActual)}</span>
            <span className="text-xs bg-blue-100 px-2 py-1 rounded">
              {TIMEZONE_PERU}
            </span>
          </div>

          {/* Estado de conexión */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              estadoConexion?.connected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {estadoConexion?.connected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Sistema Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Sistema Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Formulario de login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-2 justify-center mb-6">
            <User className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Iniciar Sesión
            </h2>
          </div>

          {/* Mostrar error si existe */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="text-red-800 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={toggleMostrarPassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-red-600 transition-colors"
                  disabled={loading}
                  tabIndex={-1}
                >
                  {mostrarPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={loading || !formData.usuario.trim() || !formData.password.trim()}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Información adicional */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="w-4 h-4" />
                <span>Control de Transmisiones EXITOSA</span>
              </div>
              <p className="text-xs">
                Backend Kalek • Frontend Dans
              </p>
            </div>
          </div>
        </div>

        {/* Información de estado del sistema */}
        <div className="mt-4 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600">
              <div className="flex items-center justify-center gap-4">
                <span>📻 {estadoConexion?.connected ? 'Conectado' : 'Desconectado'}</span>
                <span>⏰ {TIMEZONE_PERU}</span>
                <span>👤 Usuario</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;