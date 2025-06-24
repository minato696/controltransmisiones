// src/components/LogoutButton.js
import React from 'react';
import { LogOut, Clock, Shield, Radio } from 'lucide-react';
import { formatearFechaHoraCompleta, obtenerFechaLocal } from './UtilidadesFecha';
import { TIMEZONE_PERU } from '../services/api';

// ==================== UTILIDADES DE AUTENTICACIÓN ====================

// Verificar si hay cualquier tipo de autenticación activa
export const isAuthenticated = () => {
  const userAuth = localStorage.getItem('user_authenticated') === 'true';
  const adminAuth = localStorage.getItem('admin_authenticated') === 'true';
  return userAuth || adminAuth;
};

// Verificar específicamente si es usuario regular
export const isUserAuthenticated = () => {
  return localStorage.getItem('user_authenticated') === 'true';
};

// Verificar específicamente si es administrador
export const isAdminAuthenticated = () => {
  return localStorage.getItem('admin_authenticated') === 'true';
};

// Obtener información del usuario actual (usuario o admin)
export const getCurrentUserInfo = () => {
  if (isUserAuthenticated()) {
    return {
      nombre: localStorage.getItem('user_name') || 'exitosa',
      tipo: 'Usuario',
      rol: localStorage.getItem('user_role') || 'operador',
      loginTime: localStorage.getItem('user_login_time'),
      isAuthenticated: true,
      tipoAuth: 'user'
    };
  }
  
  if (isAdminAuthenticated()) {
    return {
      nombre: localStorage.getItem('admin_user') || 'admin',
      tipo: 'Administrador',
      rol: 'admin',
      loginTime: localStorage.getItem('admin_login_time'),
      isAuthenticated: true,
      tipoAuth: 'admin'
    };
  }
  
  return null;
};

// Logout DIRECTO y funcional
export const logoutUser = () => {
  // Limpiar localStorage de usuario
  localStorage.removeItem('user_authenticated');
  localStorage.removeItem('user_login_time');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_role');
  
  // Redirección inmediata
  window.location.href = '/login';
};

export const logoutAdmin = () => {
  // Limpiar localStorage de admin
  localStorage.removeItem('admin_authenticated');
  localStorage.removeItem('admin_login_time');
  localStorage.removeItem('admin_user');
  
  // Redirección inmediata
  window.location.href = '/admin';
};

// Logout universal directo
export const logout = () => {
  const userInfo = getCurrentUserInfo();
  
  if (userInfo?.tipoAuth === 'user') {
    logoutUser();
  } else if (userInfo?.tipoAuth === 'admin') {
    logoutAdmin();
  } else {
    localStorage.clear();
    window.location.href = '/login';
  }
};

// Verificar timeout de sesión
export const checkSessionTimeout = () => {
  const userInfo = getCurrentUserInfo();
  
  if (!userInfo || !userInfo.loginTime) return false;
  
  const loginDate = new Date(userInfo.loginTime);
  const now = new Date();
  const diffHours = (now - loginDate) / (1000 * 60 * 60);
  
  if (diffHours > 8) {
    logout();
    return true;
  }
  
  return false;
};

// ==================== COMPONENTE LOGOUT BUTTON ====================

const LogoutButton = ({ 
  className = '', 
  showUserInfo = true, 
  variant = 'default'
}) => {
  const userInfo = getCurrentUserInfo();
  
  if (!userInfo) return null;

  const handleLogoutClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // Logout inmediato sin modal
    logout();
  };

  const getSessionTime = () => {
    if (!userInfo.loginTime) return '';
    
    const loginDate = new Date(userInfo.loginTime);
    const now = new Date();
    const diffMinutes = Math.floor((now - loginDate) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const getUserIcon = () => {
    return userInfo.tipoAuth === 'admin' ? Shield : Radio;
  };

  const getUserColor = () => {
    return userInfo.tipoAuth === 'admin' ? 'blue' : 'green';
  };

  const IconComponent = getUserIcon();
  const color = getUserColor();

  // ==================== VARIANTES DEL COMPONENTE ====================

  // Variante compacta
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <IconComponent className={`w-4 h-4 text-${color}-600`} />
            <span className="font-medium">{userInfo.nombre}</span>
            <span className={`text-xs px-1 py-0.5 bg-${color}-100 text-${color}-800 rounded`}>
              {userInfo.tipo}
            </span>
          </div>
          
          <button
            onClick={handleLogoutClick}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            title={`Cerrar sesión de ${userInfo.tipo}`}
            type="button"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Variante solo icono
  if (variant === 'icon-only') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleLogoutClick}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title={`Cerrar sesión de ${userInfo.tipo}: ${userInfo.nombre}`}
          type="button"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Variante por defecto (completa)
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-3">
        {showUserInfo && (
          <div className={`flex items-center gap-2 px-3 py-2 bg-${color}-50 rounded-lg`}>
            <div className="flex items-center gap-2 text-sm">
              <IconComponent className={`w-4 h-4 text-${color}-600`} />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{userInfo.nombre}</span>
                  <span className={`text-xs px-2 py-1 bg-${color}-100 text-${color}-800 rounded-full`}>
                    {userInfo.tipo}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Sesión: {getSessionTime()}</span>
                  <span>({TIMEZONE_PERU})</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogoutClick}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
          title="Cerrar sesión"
          type="button"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default LogoutButton;