import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Wifi, WifiOff, Clock } from 'lucide-react';
import { TIMEZONE_PERU } from '../services/api';

const AdminLogin = ({ estadoConexion }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Credenciales hardcodeadas
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: '147ABC55'
  };

  useEffect(() => {
    // Verificar si ya está autenticado
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simular delay de autenticación
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (credentials.username === ADMIN_CREDENTIALS.username && 
          credentials.password === ADMIN_CREDENTIALS.password) {
        
        // Guardar autenticación en localStorage
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_login_time', new Date().toISOString());
        localStorage.setItem('admin_username', credentials.username);
        
        // Redirigir al dashboard de admin
        const from = location.state?.from?.pathname || '/admin/dashboard';
        navigate(from, { replace: true });
        
      } else {
        setError('Credenciales incorrectas. Verifica usuario y contraseña.');
      }
    } catch (error) {
      setError('Error de autenticación. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Control de Transmisiones EXITOSA - Perú
          </p>
          
          {/* Estado de conexión */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              estadoConexion?.connected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {estadoConexion?.connected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              {estadoConexion?.connected ? 'Backend Online' : 'Backend Offline'}
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              <Clock className="w-4 h-4" />
              {TIMEZONE_PERU}
            </div>
          </div>
        </div>

        {/* Formulario de Login */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Usuario */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ingresa tu usuario"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ingresa tu contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading || !credentials.username || !credentials.password}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Autenticando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Información del Sistema</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Zona horaria: {TIMEZONE_PERU}</p>
              <p>• Conexión backend: {estadoConexion?.connected ? '✅ Activa' : '❌ Desconectada'}</p>
              <p>• Acceso: Solo personal autorizado</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Volver al Control de Transmisiones
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;